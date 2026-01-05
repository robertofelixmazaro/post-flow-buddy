import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMediaFiles, useUploadMedia, useDeleteMedia, MediaFile } from '@/hooks/useMediaFiles';
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
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('Todos');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: mediaFiles = [], isLoading } = useMediaFiles();
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();

  const filteredFiles = mediaFiles.filter(file => {
    const matchesFolder = selectedFolder === 'Todos' || file.folder === selectedFolder;
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const imageCount = mediaFiles.filter(f => f.type === 'image').length;
  const videoCount = mediaFiles.filter(f => f.type === 'video').length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadMedia.mutateAsync({ file: selectedFile, folder: uploadFolder });
      toast({
        title: "Upload concluído!",
        description: "Arquivo enviado com sucesso",
      });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadFolder('Todos');
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo",
        variant: "destructive",
      });
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const content = (
    <div className={cn("p-4 md:p-6 lg:p-8", selectionMode && "p-0")}>
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
                  onCopyUrl={handleCopyUrl}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onSelect={selectionMode ? handleSelectMedia : undefined}
                  onUseInPost={!selectionMode ? handleUseInPost : undefined}
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
                  onCopyUrl={handleCopyUrl}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onSelect={selectionMode ? handleSelectMedia : undefined}
                  onUseInPost={!selectionMode ? handleUseInPost : undefined}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredFiles.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum arquivo encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Tente buscar com outros termos ou faça upload de novos arquivos
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
            {selectedFile && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatSize(selectedFile.size)}
                </p>
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
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={uploadMedia.isPending}
              >
                {uploadMedia.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
  onCopyUrl: (url: string) => void;
  onDownload: (url: string, name: string) => void;
  onDelete: (file: MediaFile) => void;
  onSelect?: (file: MediaFile) => void;
  onUseInPost?: (file: MediaFile) => void;
}

function MediaCard({ file, formatSize, onCopyUrl, onDownload, onDelete, onSelect, onUseInPost }: MediaCardProps) {
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
          <video 
            src={file.url} 
            className="w-full h-full object-cover"
            muted
          />
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onUseInPost && (
                <DropdownMenuItem className="gap-2" onClick={() => onUseInPost(file)}>
                  <Plus className="w-4 h-4" /> Usar em post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-2" onClick={() => onCopyUrl(file.url)}>
                <Copy className="w-4 h-4" /> Copiar URL
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => onDownload(file.url, file.name)}>
                <Download className="w-4 h-4" /> Download
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => onDelete(file)}>
                <Trash2 className="w-4 h-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

interface MediaListItemProps {
  file: MediaFile;
  isLast: boolean;
  formatSize: (bytes: number) => string;
  onCopyUrl: (url: string) => void;
  onDownload: (url: string, name: string) => void;
  onDelete: (file: MediaFile) => void;
  onSelect?: (file: MediaFile) => void;
  onUseInPost?: (file: MediaFile) => void;
}

function MediaListItem({ file, isLast, formatSize, onCopyUrl, onDownload, onDelete, onSelect, onUseInPost }: MediaListItemProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors",
        !isLast && "border-b border-border",
        onSelect && "cursor-pointer"
      )}
      onClick={() => onSelect?.(file)}
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        {file.type === 'video' ? (
          <video src={file.url} className="w-full h-full object-cover" muted />
        ) : (
          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{file.name}</p>
        <p className="text-sm text-muted-foreground">
          {file.folder} • {formatSize(file.size)}
        </p>
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
            <DropdownMenuItem className="gap-2" onClick={() => onCopyUrl(file.url)}>
              <Copy className="w-4 h-4" /> Copiar URL
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => onDownload(file.url, file.name)}>
              <Download className="w-4 h-4" /> Download
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => onDelete(file)}>
              <Trash2 className="w-4 h-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
