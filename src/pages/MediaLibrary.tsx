import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mediaFiles, MediaFile } from '@/data/mockData';
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
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const folders = ['Todos', 'Banners', 'Equipe', 'Produtos', 'Promoções', 'Vídeos', 'Backgrounds', 'Logos', 'Templates'];

export default function MediaLibrary() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolder, setSelectedFolder] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = mediaFiles.filter(file => {
    const matchesFolder = selectedFolder === 'Todos' || file.folder === selectedFolder;
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const imageCount = mediaFiles.filter(f => f.type === 'image').length;
  const videoCount = mediaFiles.filter(f => f.type === 'video').length;

  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Biblioteca de Mídia
            </h1>
            <p className="text-muted-foreground">
              {imageCount} imagens • {videoCount} vídeos
            </p>
          </div>
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </Button>
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

            {/* Files grid/list */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFiles.map(file => (
                  <MediaCard key={file.id} file={file} />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {filteredFiles.map((file, index) => (
                  <MediaListItem key={file.id} file={file} isLast={index === filteredFiles.length - 1} />
                ))}
              </div>
            )}

            {filteredFiles.length === 0 && (
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
                <Button className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function MediaCard({ file }: { file: MediaFile }) {
  return (
    <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-200">
      <div className="aspect-square relative">
        <img 
          src={file.url} 
          alt={file.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {file.type === 'video' && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-background/80 text-xs font-medium text-foreground flex items-center gap-1">
            <Video className="w-3 h-3" />
            Vídeo
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{file.size}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="secondary" 
              size="icon" 
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2">
              <Copy className="w-4 h-4" /> Copiar URL
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Download className="w-4 h-4" /> Download
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive">
              <Trash2 className="w-4 h-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function MediaListItem({ file, isLast }: { file: MediaFile; isLast: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors",
      !isLast && "border-b border-border"
    )}>
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{file.name}</p>
        <p className="text-sm text-muted-foreground">
          {file.folder} • {file.size}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="gap-2">
            <Copy className="w-4 h-4" /> Copiar URL
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <Download className="w-4 h-4" /> Download
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 text-destructive">
            <Trash2 className="w-4 h-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
