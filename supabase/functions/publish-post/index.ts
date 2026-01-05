import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENCRYPTION_KEY = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-key-change-in-production';

function decryptToken(encryptedToken: string): string {
  const encoder = new TextEncoder();
  const key = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const encrypted = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
  
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ key[i % key.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

async function publishToFacebook(pageId: string, accessToken: string, content: string, mediaUrls?: string[]) {
  let endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
  const params: any = {
    message: content,
    access_token: accessToken
  };

  // If there's media, use photos endpoint
  if (mediaUrls && mediaUrls.length > 0) {
    endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`;
    params.url = mediaUrls[0];
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  return response.json();
}

async function publishToInstagram(igUserId: string, accessToken: string, content: string, mediaUrls: string[]) {
  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error('Instagram requires at least one image');
  }

  // Step 1: Create media container
  const containerUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
  const containerResponse = await fetch(containerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: mediaUrls[0],
      caption: content,
      access_token: accessToken
    })
  });

  const containerData = await containerResponse.json();
  if (containerData.error) {
    throw new Error(containerData.error.message);
  }

  // Step 2: Publish the media
  const publishUrl = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
  const publishResponse = await fetch(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: accessToken
    })
  });

  return publishResponse.json();
}

async function publishToTwitter(accessToken: string, content: string) {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: content })
  });

  return response.json();
}

async function publishToLinkedIn(userId: string, accessToken: string, content: string) {
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author: `urn:li:person:${userId}`,
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId } = await req.json();

    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get post data
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      throw new Error('Post not found');
    }

    if (post.status !== 'scheduled') {
      return new Response(
        JSON.stringify({ error: 'Post is not in scheduled status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's social connections
    const { data: connections, error: connError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', post.user_id)
      .in('network', post.networks);

    if (connError) {
      throw connError;
    }

    const results: any[] = [];
    let hasSuccess = false;
    let hasFailed = false;

    // Publish to each network
    for (const network of post.networks) {
      const connection = connections?.find(c => c.network === network);
      
      if (!connection) {
        results.push({
          network,
          status: 'failed',
          error: 'No connection found for this network'
        });
        hasFailed = true;
        continue;
      }

      try {
        const accessToken = decryptToken(connection.access_token_encrypted);
        let result;

        switch (network) {
          case 'facebook':
            result = await publishToFacebook(connection.page_id!, accessToken, post.content, post.media_urls);
            break;
          case 'instagram':
            result = await publishToInstagram(connection.account_id, accessToken, post.content, post.media_urls || []);
            break;
          case 'twitter':
            result = await publishToTwitter(accessToken, post.content);
            break;
          case 'linkedin':
            result = await publishToLinkedIn(connection.account_id, accessToken, post.content);
            break;
        }

        if (result.error) {
          throw new Error(result.error.message || JSON.stringify(result.error));
        }

        // Log success
        await supabase.from('post_logs').insert({
          post_id: postId,
          network,
          status: 'published',
          external_post_id: result.id || result.data?.id,
          published_at: new Date().toISOString()
        });

        results.push({ network, status: 'published', external_id: result.id });
        hasSuccess = true;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorCode = (err as any)?.code;
        
        // Log failure
        await supabase.from('post_logs').insert({
          post_id: postId,
          network,
          status: 'failed',
          error_message: errorMessage,
          error_code: errorCode
        });

        results.push({ network, status: 'failed', error: errorMessage });
        hasFailed = true;
      }
    }

    // Update post status
    const finalStatus = hasSuccess && !hasFailed ? 'published' : hasFailed && !hasSuccess ? 'failed' : 'published';
    await supabase
      .from('scheduled_posts')
      .update({ status: finalStatus })
      .eq('id', postId);

    return new Response(
      JSON.stringify({ success: true, results }),
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
