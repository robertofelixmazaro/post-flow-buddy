import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, decryptToken, getUserId } from '../_shared/security.ts';

// Check if token is expired
function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ============ FACEBOOK PUBLISHING ============
async function publishToFacebook(pageId: string, accessToken: string, content: string, mediaUrls?: string[]) {
  console.log(`Publishing to Facebook page: ${pageId}`);
  
  // If there are multiple images, create a multi-photo post
  if (mediaUrls && mediaUrls.length > 1) {
    // Upload each photo first
    const photoIds: string[] = [];
    for (const mediaUrl of mediaUrls) {
      const uploadResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: mediaUrl,
          published: false,
          access_token: accessToken
        })
      });
      const uploadData = await uploadResponse.json();
      if (uploadData.error) {
        throw new Error(`Facebook photo upload failed: ${uploadData.error.message}`);
      }
      photoIds.push(uploadData.id);
    }
    
    // Create post with attached media
    const attachedMedia = photoIds.map(id => ({ media_fbid: id }));
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        attached_media: attachedMedia,
        access_token: accessToken
      })
    });
    return response.json();
  }
  
  // Single image or text-only post
  if (mediaUrls && mediaUrls.length === 1) {
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: mediaUrls[0],
        caption: content,
        access_token: accessToken
      })
    });
    return response.json();
  }
  
  // Text-only post
  const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: content,
      access_token: accessToken
    })
  });
  return response.json();
}

// ============ INSTAGRAM PUBLISHING ============
async function publishToInstagram(igUserId: string, accessToken: string, content: string, mediaUrls: string[]) {
  console.log(`Publishing to Instagram account: ${igUserId}`);
  
  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error('Instagram requires at least one image or video');
  }

  // Determine if it's a video (basic check)
  const isVideo = (url: string) => url.match(/\.(mp4|mov|avi|webm)(\?|$)/i);
  
  // Single image/video post
  if (mediaUrls.length === 1) {
    const mediaUrl = mediaUrls[0];
    const containerParams: any = {
      caption: content,
      access_token: accessToken
    };
    
    if (isVideo(mediaUrl)) {
      containerParams.media_type = 'VIDEO';
      containerParams.video_url = mediaUrl;
    } else {
      containerParams.image_url = mediaUrl;
    }
    
    // Step 1: Create media container
    const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerParams)
    });
    
    const containerData = await containerResponse.json();
    if (containerData.error) {
      throw new Error(`Instagram container creation failed: ${containerData.error.message}`);
    }
    
    // For videos, wait for processing
    if (isVideo(mediaUrl)) {
      await waitForMediaProcessing(igUserId, containerData.id, accessToken);
    }
    
    // Step 2: Publish the media
    const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken
      })
    });
    
    return publishResponse.json();
  }
  
  // Carousel post (2-10 images/videos)
  if (mediaUrls.length > 10) {
    throw new Error('Instagram carousel supports maximum 10 items');
  }
  
  // Step 1: Create container for each item
  const childrenIds: string[] = [];
  for (const mediaUrl of mediaUrls) {
    const childParams: any = {
      is_carousel_item: true,
      access_token: accessToken
    };
    
    if (isVideo(mediaUrl)) {
      childParams.media_type = 'VIDEO';
      childParams.video_url = mediaUrl;
    } else {
      childParams.image_url = mediaUrl;
    }
    
    const childResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(childParams)
    });
    
    const childData = await childResponse.json();
    if (childData.error) {
      throw new Error(`Instagram carousel item failed: ${childData.error.message}`);
    }
    
    // Wait for video processing
    if (isVideo(mediaUrl)) {
      await waitForMediaProcessing(igUserId, childData.id, accessToken);
    }
    
    childrenIds.push(childData.id);
  }
  
  // Step 2: Create carousel container
  const carouselResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: childrenIds.join(','),
      caption: content,
      access_token: accessToken
    })
  });
  
  const carouselData = await carouselResponse.json();
  if (carouselData.error) {
    throw new Error(`Instagram carousel creation failed: ${carouselData.error.message}`);
  }
  
  // Step 3: Publish carousel
  const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: carouselData.id,
      access_token: accessToken
    })
  });
  
  return publishResponse.json();
}

// Wait for Instagram media processing (for videos)
async function waitForMediaProcessing(igUserId: string, containerId: string, accessToken: string, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const statusResponse = await fetch(
      `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusResponse.json();
    
    if (statusData.status_code === 'FINISHED') {
      return;
    }
    
    if (statusData.status_code === 'ERROR') {
      throw new Error('Instagram media processing failed');
    }
    
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Instagram media processing timeout');
}

// ============ TIKTOK PUBLISHING ============
async function publishToTikTok(accessToken: string, content: string, mediaUrls?: string[]) {
  console.log('Publishing to TikTok');
  
  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error('TikTok requires a video');
  }
  
  const videoUrl = mediaUrls[0];
  
  // Step 1: Initialize video upload
  const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      post_info: {
        title: content.substring(0, 150), // TikTok title limit
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl
      }
    })
  });
  
  const initData = await initResponse.json();
  
  if (initData.error) {
    throw new Error(`TikTok publish failed: ${initData.error.message || JSON.stringify(initData.error)}`);
  }
  
  return {
    id: initData.data?.publish_id,
    status: 'processing'
  };
}

// ============ LINKEDIN PUBLISHING ============
async function publishToLinkedIn(userId: string, accessToken: string, content: string, mediaUrls?: string[]) {
  console.log(`Publishing to LinkedIn for user: ${userId}`);
  
  const author = `urn:li:person:${userId}`;
  
  // Text-only post
  if (!mediaUrls || mediaUrls.length === 0) {
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    });
    
    return response.json();
  }
  
  // Post with image(s)
  // Step 1: Register image upload
  const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: author,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent'
        }]
      }
    })
  });
  
  const registerData = await registerResponse.json();
  
  if (registerData.serviceErrorCode) {
    throw new Error(`LinkedIn image registration failed: ${registerData.message}`);
  }
  
  const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
  const asset = registerData.value?.asset;
  
  if (!uploadUrl || !asset) {
    throw new Error('LinkedIn image registration incomplete');
  }
  
  // Step 2: Upload image (fetch from URL and upload to LinkedIn)
  const imageResponse = await fetch(mediaUrls[0]);
  const imageBlob = await imageResponse.blob();
  
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: imageBlob
  });
  
  // Step 3: Create post with image
  const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'IMAGE',
          media: [{
            status: 'READY',
            media: asset
          }]
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    })
  });
  
  return postResponse.json();
}

// ============ MAIN HANDLER ============
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate postId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid post ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate request using JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    let authenticatedUserId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: claims, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && claims?.user) {
        authenticatedUserId = claims.user.id;
      }
    }

    // Get post data
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('Post not found:', postId, postError);
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If authenticated, verify ownership
    if (authenticatedUserId && post.user_id !== authenticatedUserId) {
      console.error('Unauthorized access attempt:', authenticatedUserId, post.user_id);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (post.status !== 'scheduled') {
      return new Response(
        JSON.stringify({ error: `Post is not in scheduled status (current: ${post.status})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Publishing post ${postId} to networks:`, post.networks);

    // Get user's social connections for the specified networks
    const { data: connections, error: connError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', post.user_id)
      .in('network', post.networks);

    if (connError) {
      console.error('Error fetching connections:', connError);
      throw connError;
    }

    const results: any[] = [];
    let successCount = 0;
    let failCount = 0;

    // Publish to each network
    for (const network of post.networks) {
      const connection = connections?.find(c => c.network === network);
      
      if (!connection) {
        console.error(`No connection found for network: ${network}`);
        
        await supabase.from('post_logs').insert({
          post_id: postId,
          network,
          status: 'failed',
          error_message: 'No connection found for this network',
          error_code: 'NO_CONNECTION'
        });
        
        results.push({
          network,
          status: 'failed',
          error: 'No connection found for this network'
        });
        failCount++;
        continue;
      }

      // Check if token is expired
      if (isTokenExpired(connection.token_expires_at)) {
        console.error(`Token expired for network: ${network}`);
        
        await supabase.from('post_logs').insert({
          post_id: postId,
          network,
          status: 'failed',
          error_message: 'Access token has expired. Please reconnect your account.',
          error_code: 'TOKEN_EXPIRED'
        });
        
        results.push({
          network,
          status: 'failed',
          error: 'Access token has expired'
        });
        failCount++;
        continue;
      }

      try {
        const accessToken = decryptToken(connection.access_token_encrypted);
        let result;

        switch (network) {
          case 'facebook':
            if (!connection.page_id) {
              throw new Error('Facebook page not configured');
            }
            result = await publishToFacebook(connection.page_id, accessToken, post.content, post.media_urls);
            break;
            
          case 'instagram':
            result = await publishToInstagram(connection.account_id, accessToken, post.content, post.media_urls || []);
            break;
            
          case 'tiktok':
            result = await publishToTikTok(accessToken, post.content, post.media_urls);
            break;
            
          case 'linkedin':
            result = await publishToLinkedIn(connection.account_id, accessToken, post.content, post.media_urls);
            break;
            
          default:
            throw new Error(`Unsupported network: ${network}`);
        }

        // Check for API errors
        if (result.error) {
          throw new Error(result.error.message || JSON.stringify(result.error));
        }

        console.log(`Successfully published to ${network}:`, result.id || result.data?.id);

        // Log success
        await supabase.from('post_logs').insert({
          post_id: postId,
          network,
          status: 'published',
          external_post_id: result.id || result.data?.id || result.publish_id,
          published_at: new Date().toISOString()
        });

        results.push({ 
          network, 
          status: 'published', 
          external_id: result.id || result.data?.id 
        });
        successCount++;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorCode = (err as any)?.code || 'PUBLISH_ERROR';
        
        console.error(`Failed to publish to ${network}:`, errorMessage);

        // Log failure
        await supabase.from('post_logs').insert({
          post_id: postId,
          network,
          status: 'failed',
          error_message: errorMessage,
          error_code: errorCode
        });

        results.push({ 
          network, 
          status: 'failed', 
          error: errorMessage 
        });
        failCount++;
      }
    }

    // Determine final post status
    let finalStatus: 'published' | 'failed';
    if (successCount > 0 && failCount === 0) {
      finalStatus = 'published';
    } else if (successCount === 0) {
      finalStatus = 'failed';
    } else {
      // Partial success - still mark as published but with logged errors
      finalStatus = 'published';
    }

    // Update post status
    await supabase
      .from('scheduled_posts')
      .update({ 
        status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    console.log(`Post ${postId} finished with status: ${finalStatus} (${successCount} success, ${failCount} failed)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: finalStatus,
        results,
        summary: {
          total: post.networks.length,
          published: successCount,
          failed: failCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Publish error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
