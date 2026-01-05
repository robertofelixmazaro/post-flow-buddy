import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crop as CropIcon, 
  Palette, 
  RotateCcw, 
  Check, 
  X,
  Sun,
  Contrast,
  Droplets
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageName: string;
  onSave: (editedBlob: Blob) => void;
}

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  blur: number;
}

const defaultFilters: Filters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0,
};

const presetFilters: { name: string; filters: Filters }[] = [
  { name: 'Original', filters: defaultFilters },
  { name: 'Vintage', filters: { ...defaultFilters, sepia: 50, contrast: 110, saturation: 80 } },
  { name: 'B&W', filters: { ...defaultFilters, grayscale: 100 } },
  { name: 'Warm', filters: { ...defaultFilters, sepia: 20, saturation: 120 } },
  { name: 'Cold', filters: { ...defaultFilters, saturation: 80, brightness: 110 } },
  { name: 'High Contrast', filters: { ...defaultFilters, contrast: 140, saturation: 110 } },
];

export function ImageEditorDialog({ 
  open, 
  onOpenChange, 
  imageUrl, 
  imageName,
  onSave 
}: ImageEditorDialogProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [activeTab, setActiveTab] = useState('crop');
  const [isSaving, setIsSaving] = useState(false);

  const getFilterStyle = useCallback(() => {
    return {
      filter: `
        brightness(${filters.brightness}%) 
        contrast(${filters.contrast}%) 
        saturate(${filters.saturation}%) 
        grayscale(${filters.grayscale}%) 
        sepia(${filters.sepia}%)
        blur(${filters.blur}px)
      `,
    };
  }, [filters]);

  const handleReset = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setFilters(defaultFilters);
  };

  const applyPreset = (preset: Filters) => {
    setFilters(preset);
  };

  const handleSave = async () => {
    if (!imgRef.current) return;
    setIsSaving(true);

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate dimensions based on crop or use original
      let sourceX = 0, sourceY = 0, sourceWidth = image.naturalWidth, sourceHeight = image.naturalHeight;
      
      if (completedCrop && completedCrop.width && completedCrop.height) {
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        sourceX = completedCrop.x * scaleX;
        sourceY = completedCrop.y * scaleY;
        sourceWidth = completedCrop.width * scaleX;
        sourceHeight = completedCrop.height * scaleY;
      }

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      // Apply filters
      ctx.filter = `
        brightness(${filters.brightness}%) 
        contrast(${filters.contrast}%) 
        saturate(${filters.saturation}%) 
        grayscale(${filters.grayscale}%) 
        sepia(${filters.sepia}%)
        blur(${filters.blur}px)
      `;

      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      canvas.toBlob((blob) => {
        if (blob) {
          onSave(blob);
          onOpenChange(false);
        }
        setIsSaving(false);
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error saving image:', error);
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate">{imageName}</span>
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Resetar
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="crop" className="gap-2">
              <CropIcon className="w-4 h-4" />
              Recortar
            </TabsTrigger>
            <TabsTrigger value="filters" className="gap-2">
              <Palette className="w-4 h-4" />
              Filtros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crop" className="flex-1 overflow-auto mt-4">
            <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[300px]">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-[400px]"
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt={imageName}
                  style={getFilterStyle()}
                  className="max-h-[400px] object-contain"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Clique e arraste para selecionar a área de recorte
            </p>
          </TabsContent>

          <TabsContent value="filters" className="flex-1 overflow-auto mt-4 space-y-6">
            {/* Image Preview */}
            <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4">
              <img
                src={imageUrl}
                alt={imageName}
                style={getFilterStyle()}
                className="max-h-[250px] object-contain rounded"
                crossOrigin="anonymous"
              />
            </div>

            {/* Preset Filters */}
            <div>
              <h4 className="text-sm font-medium mb-3">Presets</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {presetFilters.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.filters)}
                    className={cn(
                      "flex-shrink-0 p-2 rounded-lg border transition-colors",
                      JSON.stringify(filters) === JSON.stringify(preset.filters)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div 
                      className="w-16 h-16 rounded overflow-hidden mb-1"
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: `
                          brightness(${preset.filters.brightness}%) 
                          contrast(${preset.filters.contrast}%) 
                          saturate(${preset.filters.saturation}%) 
                          grayscale(${preset.filters.grayscale}%) 
                          sepia(${preset.filters.sepia}%)
                        `,
                      }}
                    />
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Adjustments */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Ajustes</h4>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Sun className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm w-20">Brilho</span>
                  <Slider
                    value={[filters.brightness]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(v) => setFilters(f => ({ ...f, brightness: v[0] }))}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{filters.brightness}%</span>
                </div>

                <div className="flex items-center gap-4">
                  <Contrast className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm w-20">Contraste</span>
                  <Slider
                    value={[filters.contrast]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(v) => setFilters(f => ({ ...f, contrast: v[0] }))}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{filters.contrast}%</span>
                </div>

                <div className="flex items-center gap-4">
                  <Droplets className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm w-20">Saturação</span>
                  <Slider
                    value={[filters.saturation]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(v) => setFilters(f => ({ ...f, saturation: v[0] }))}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{filters.saturation}%</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Check className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Aplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
