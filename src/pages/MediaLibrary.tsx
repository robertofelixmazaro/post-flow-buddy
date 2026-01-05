import { useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  useMediaFiles, 
  useUploadMedia, 
  useUploadMultipleMedia,
  useDeleteMedia, 
  useUpdateMediaTags, 
  useReplaceMediaFile, 
  useRenameMedia,
  MediaFile 
} from '@/hooks/useMediaFiles';
import { VideoPreviewDialog } from '@/components/media/VideoPreviewDialog';
import { ImageEditorDialog } from '@/components/media/ImageEditorDialog';
import { TagsManager, TagsFilter } from '@/components/media/TagsManager';
import { 
  Search, 
  Upload, 
  Grid, 
  List, 
  FolderOpen, 
  Image as ImageIcon, 
  Video,
  MoreVertical,
  Trash2,
  Download,
  Copy,
  Loader2,
  Check,
  Plus,
  Play,
  Edit,
  Tag,
  FileUp,
  Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const folders = ['Todos', 'Banners', 'Equipe', 'Produtos', 'Promoções', 'Vídeos', 'Backgrounds', 'Logos', 'Templates'];

interface MediaLibraryProps {
  selectionMode?: boolean;
  onSelect?: (url: string) => void;
  onClose?: () => void;
}

export default function MediaLibrary({ selectionMode = false, onSelect, onClose }: MediaLibraryProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolder, setSelectedFolder] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('Banners');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  
  // Video preview state
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<MediaFile | null>(null);
  
  // Image editor state
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<MediaFile | null>(null);

  // Rename state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingFile, setRenamingFile] = useState<MediaFile | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const { data: mediaFiles = [], isLoading } = useMediaFiles();
  const uploadMedia = useUploadMedia();
  const uploadMultiple = useUploadMultipleMedia();
  const deleteMedia = useDeleteMedia();
  const updateTags = useUpdateMediaTags();
  const replaceMedia = useReplaceMediaFile();
  const renameMedia = useRenameMedia();

  // Get all unique tags from media files
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    mediaFiles.forEach(file => {
      file.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [mediaFiles]);

  const filteredFiles = mediaFiles.filter(file => {
    const matchesFolder = selectedFolder === 'Todos' || file.folder === selectedFolder;
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => file.tags?.includes(tag));
    return matchesFolder && matchesSearch && matchesTags;
  });

  const imageCount = mediaFiles.filter(f => f.type === 'image').length;
  const videoCount = mediaFiles.filter(f => f.type === 'video').length;

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (files.length > 0) {
      setSelectedFiles(files);
      setUploadDialogOpen(true);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploadProgress(0);
      
      if (selectedFiles.length === 1) {
        await uploadMedia.mutateAsync({ file: selectedFiles[0], folder: uploadFolder });
      } else {
        // Simulate progress for multiple files
        const interval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        
        await uploadMultiple.mutateAsync({ files: selectedFiles, folder: uploadFolder });
        
        clearInterval(interval);
        setUploadProgress(100);
      }
      
      toast({
        title: "Upload concluído!",
        description: `${selectedFiles.length} arquivo(s) enviado(s) com sucesso`,
      });
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadFolder('Banners');
      setUploadProgress(0);
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar os arquivos",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada!",
      description: "Link copiado para a área de transferência",
    });
  };

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (file: MediaFile) => {
    try {
      await deleteMedia.mutateAsync({ id: file.id, filePath: file.file_path });
      toast({
        title: "Arquivo excluído",
        description: "Arquivo removido com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover o arquivo",
        variant: "destructive",
      });
    }
  };

  const handleSelectMedia = (file: MediaFile) => {
    if (selectionMode && onSelect) {
      onSelect(file.url);
      onClose?.();
    }
  };

  const handleUseInPost = (file: MediaFile) => {
    navigate(`/criar-post?media=${encodeURIComponent(file.url)}`);
  };

  const handleVideoPreview = (file: MediaFile) => {
    setPreviewVideo(file);
    setVideoPreviewOpen(true);
  };

  const handleEditImage = (file: MediaFile) => {
    setEditingImage(file);
    setImageEditorOpen(true);
  };

  const handleSaveEditedImage = async (blob: Blob) => {
    if (!editingImage) return;
    
    try {
      await replaceMedia.mutateAsync({
        id: editingImage.id,
        file: blob,
        oldFilePath: editingImage.file_path,
      });
      toast({
        title: "Imagem atualizada!",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTags = async (file: MediaFile, newTags: string[]) => {
    try {
      await updateTags.mutateAsync({ id: file.id, tags: newTags });
    } catch (error) {
      toast({
        title: "Erro ao atualizar tags",
        description: "Não foi possível atualizar as tags",
        variant: "destructive",
      });
    }
  };

  const handleOpenRename = (file: MediaFile) => {
    setRenamingFile(file);
    setNewFileName(file.name);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!renamingFile || !newFileName.trim()) return;
    
    try {
      await renameMedia.mutateAsync({ id: renamingFile.id, newName: newFileName.trim() });
      toast({
        title: "Arquivo renomeado",
        description: "Nome atualizado com sucesso",
      });
      setRenameDialogOpen(false);
      setRenamingFile(null);
      setNewFileName('');
    } catch (error) {
      toast({
        title: "Erro ao renomear",
        description: "Não foi possível renomear o arquivo",
        variant: "destructive",
      });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isUploading = uploadMedia.isPending || uploadMultiple.isPending;

  const content = (
    <div 
      className={cn("p-4 md:p-6 lg:p-8 min-h-full", selectionMode && "p-0")}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="border-2 border-dashed border-primary rounded-2xl p-12 bg-card/50">
            <div className="text-center">
              <FileUp className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Solte os arquivos aqui
              </h3>
              <p className="text-muted-foreground">
                Imagens e vídeos serão enviados automaticamente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {selectionMode ? 'Selecionar Mídia' : 'Biblioteca de Mídia'}
          </h1>
          <p className="text-muted-foreground">
            {imageCount} imagens • {videoCount} vídeos
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-4 h-fit">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Pastas
            </h3>
            <div className="space-y-1">
              {folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedFolder === folder
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {folder}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4 h-fit">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              <TagsFilter 
                allTags={allTags} 
                selectedTags={selectedTags} 
                onSelectedTagsChange={setSelectedTags} 
              />
            </div>
          )}
        </div>

        {/* Main content */}
        <div>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <div className="flex items-center border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Files grid/list */}
          {!isLoading && viewMode === 'grid' && filteredFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map(file => (
                <MediaCard 
                  key={file.id} 
                  file={file} 
                  formatSize={formatSize}
                  allTags={allTags}
                  onCopyUrl={handleCopyUrl}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onSelect={selectionMode ? handleSelectMedia : undefined}
                  onUseInPost={!selectionMode ? handleUseInPost : undefined}
                  onVideoPreview={handleVideoPreview}
                  onEditImage={handleEditImage}
                  onUpdateTags={handleUpdateTags}
                  onRename={handleOpenRename}
                />
              ))}
            </div>
          )}
          
          {!isLoading && viewMode === 'list' && filteredFiles.length > 0 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {filteredFiles.map((file, index) => (
                <MediaListItem 
                  key={file.id} 
                  file={file} 
                  isLast={index === filteredFiles.length - 1}
                  formatSize={formatSize}
                  allTags={allTags}
                  onCopyUrl={handleCopyUrl}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onSelect={selectionMode ? handleSelectMedia : undefined}
                  onUseInPost={!selectionMode ? handleUseInPost : undefined}
                  onVideoPreview={handleVideoPreview}
                  onEditImage={handleEditImage}
                  onUpdateTags={handleUpdateTags}
                  onRename={handleOpenRename}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredFiles.length === 0 && (
            <div 
              className={cn(
                "text-center py-16 border-2 border-dashed rounded-2xl transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum arquivo encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Arraste arquivos aqui ou clique para fazer upload
              </p>
              <Button className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Mídia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFiles.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg flex items-center gap-3">
                    {file.type.startsWith('video/') ? (
                      <Video className="w-8 h-8 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatSize(file.size)}
                        {file.type.startsWith('image/') && file.type !== 'image/gif' && (
                          <span className="text-primary ml-2">• Será comprimido</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Enviando...</span>
                  <span className="text-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Pasta de destino
              </label>
              <Select value={uploadFolder} onValueChange={setUploadFolder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folders.filter(f => f !== 'Todos').map(folder => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Enviar {selectedFiles.length > 1 ? `(${selectedFiles.length})` : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Arquivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Novo nome
              </label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Digite o novo nome..."
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={!newFileName.trim() || renameMedia.isPending}>
              {renameMedia.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Pencil className="w-4 h-4 mr-2" />
              )}
              Renomear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Preview Dialog */}
      {previewVideo && (
        <VideoPreviewDialog
          open={videoPreviewOpen}
          onOpenChange={setVideoPreviewOpen}
          videoUrl={previewVideo.url}
          videoName={previewVideo.name}
        />
      )}

      {/* Image Editor Dialog */}
      {editingImage && (
        <ImageEditorDialog
          open={imageEditorOpen}
          onOpenChange={setImageEditorOpen}
          imageUrl={editingImage.url}
          imageName={editingImage.name}
          onSave={handleSaveEditedImage}
        />
      )}
    </div>
  );

  if (selectionMode) {
    return content;
  }

  return <Layout>{content}</Layout>;
}

interface MediaCardProps {
  file: MediaFile;
  formatSize: (bytes: number) => string;
  allTags: string[];
  onCopyUrl: (url: string) => void;
  onDownload: (url: string, name: string) => void;
  onDelete: (file: MediaFile) => void;
  onSelect?: (file: MediaFile) => void;
  onUseInPost?: (file: MediaFile) => void;
  onVideoPreview: (file: MediaFile) => void;
  onEditImage: (file: MediaFile) => void;
  onUpdateTags: (file: MediaFile, tags: string[]) => void;
  onRename: (file: MediaFile) => void;
}

function MediaCard({ 
  file, 
  formatSize, 
  allTags,
  onCopyUrl, 
  onDownload, 
  onDelete, 
  onSelect, 
  onUseInPost,
  onVideoPreview,
  onEditImage,
  onUpdateTags,
  onRename
}: MediaCardProps) {
  return (
    <div 
      className={cn(
        "group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-200",
        onSelect && "cursor-pointer"
      )}
      onClick={() => onSelect?.(file)}
    >
      <div className="aspect-square relative">
        {file.type === 'video' ? (
          <>
            <video 
              src={file.url} 
              className="w-full h-full object-cover"
              muted
            />
            <button
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onVideoPreview(file); }}
            >
              <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                <Play className="w-6 h-6 text-foreground ml-0.5" />
              </div>
            </button>
          </>
        ) : (
          <img 
            src={file.url} 
            alt={file.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {file.type === 'video' && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-background/80 text-xs font-medium text-foreground flex items-center gap-1">
            <Video className="w-3 h-3" />
            Vídeo
          </div>
        )}

        {/* Tags display */}
        {file.tags && file.tags.length > 0 && (
          <div className="absolute bottom-12 left-2 right-2 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {file.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {file.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{file.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
        </div>

        {onSelect ? (
          <Button 
            variant="secondary" 
            size="icon" 
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onSelect(file); }}
          >
            <Check className="w-4 h-4" />
          </Button>
        ) : (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <TagsManager
              tags={file.tags || []}
              onTagsChange={(tags) => onUpdateTags(file, tags)}
              availableTags={allTags}
              compact
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onUseInPost && (
                  <DropdownMenuItem className="gap-2" onClick={() => onUseInPost(file)}>
                    <Plus className="w-4 h-4" /> Usar em post
                  </DropdownMenuItem>
                )}
                {file.type === 'image' && (
                  <DropdownMenuItem className="gap-2" onClick={() => onEditImage(file)}>
                    <Edit className="w-4 h-4" /> Editar imagem
                  </DropdownMenuItem>
                )}
                {file.type === 'video' && (
                  <DropdownMenuItem className="gap-2" onClick={() => onVideoPreview(file)}>
                    <Play className="w-4 h-4" /> Reproduzir
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="gap-2" onClick={() => onRename(file)}>
                  <Pencil className="w-4 h-4" /> Renomear
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onClick={() => onCopyUrl(file.url)}>
                  <Copy className="w-4 h-4" /> Copiar URL
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => onDownload(file.url, file.name)}>
                  <Download className="w-4 h-4" /> Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-destructive" onClick={() => onDelete(file)}>
                  <Trash2 className="w-4 h-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

interface MediaListItemProps {
  file: MediaFile;
  isLast: boolean;
  formatSize: (bytes: number) => string;
  allTags: string[];
  onCopyUrl: (url: string) => void;
  onDownload: (url: string, name: string) => void;
  onDelete: (file: MediaFile) => void;
  onSelect?: (file: MediaFile) => void;
  onUseInPost?: (file: MediaFile) => void;
  onVideoPreview: (file: MediaFile) => void;
  onEditImage: (file: MediaFile) => void;
  onUpdateTags: (file: MediaFile, tags: string[]) => void;
  onRename: (file: MediaFile) => void;
}

function MediaListItem({ 
  file, 
  isLast, 
  formatSize, 
  allTags,
  onCopyUrl, 
  onDownload, 
  onDelete, 
  onSelect, 
  onUseInPost,
  onVideoPreview,
  onEditImage,
  onUpdateTags,
  onRename
}: MediaListItemProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors",
        !isLast && "border-b border-border",
        onSelect && "cursor-pointer"
      )}
      onClick={() => onSelect?.(file)}
    >
      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        {file.type === 'video' ? (
          <>
            <video src={file.url} className="w-full h-full object-cover" muted />
            <button
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              onClick={(e) => { e.stopPropagation(); onVideoPreview(file); }}
            >
              <Play className="w-6 h-6 text-white" />
            </button>
          </>
        ) : (
          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{file.name}</p>
        <p className="text-sm text-muted-foreground">
          {file.folder} • {formatSize(file.size)}
        </p>
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {file.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {onSelect ? (
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8"
          onClick={(e) => { e.stopPropagation(); onSelect(file); }}
        >
          <Check className="w-4 h-4" />
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <TagsManager
            tags={file.tags || []}
            onTagsChange={(tags) => onUpdateTags(file, tags)}
            availableTags={allTags}
            compact
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onUseInPost && (
                <DropdownMenuItem className="gap-2" onClick={() => onUseInPost(file)}>
                  <Plus className="w-4 h-4" /> Usar em post
                </DropdownMenuItem>
              )}
              {file.type === 'image' && (
                <DropdownMenuItem className="gap-2" onClick={() => onEditImage(file)}>
                  <Edit className="w-4 h-4" /> Editar imagem
                </DropdownMenuItem>
              )}
              {file.type === 'video' && (
                <DropdownMenuItem className="gap-2" onClick={() => onVideoPreview(file)}>
                  <Play className="w-4 h-4" /> Reproduzir
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-2" onClick={() => onRename(file)}>
                <Pencil className="w-4 h-4" /> Renomear
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2" onClick={() => onCopyUrl(file.url)}>
                <Copy className="w-4 h-4" /> Copiar URL
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => onDownload(file.url, file.name)}>
                <Download className="w-4 h-4" /> Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => onDelete(file)}>
                <Trash2 className="w-4 h-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
