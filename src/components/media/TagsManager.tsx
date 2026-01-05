import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tag, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagsManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: string[];
  compact?: boolean;
}

export function TagsManager({ 
  tags, 
  onTagsChange, 
  availableTags = [],
  compact = false 
}: TagsManagerProps) {
  const [newTag, setNewTag] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const suggestedTags = availableTags.filter(
    tag => !tags.includes(tag) && tag.includes(newTag.toLowerCase())
  ).slice(0, 5);

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Tag className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nova tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm"
              />
              <Button size="sm" className="h-8" onClick={handleAddTag}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="gap-1 text-xs"
                  >
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-destructive" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {suggestedTags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sugestões:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="cursor-pointer text-xs hover:bg-primary/10"
                      onClick={() => onTagsChange([...tags, tag])}
                    >
                      + {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Adicionar tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleAddTag}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="gap-1"
            >
              {tag}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleRemoveTag(tag)}
              />
            </Badge>
          ))}
        </div>
      )}

      {suggestedTags.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Sugestões:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => onTagsChange([...tags, tag])}
              >
                + {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TagsFilterProps {
  allTags: string[];
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
}

export function TagsFilter({ allTags, selectedTags, onSelectedTagsChange }: TagsFilterProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onSelectedTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onSelectedTagsChange([...selectedTags, tag]);
    }
  };

  if (allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map(tag => (
        <Badge
          key={tag}
          variant={selectedTags.includes(tag) ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-colors",
            selectedTags.includes(tag) 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-primary/10"
          )}
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </Badge>
      ))}
      {selectedTags.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 text-xs"
          onClick={() => onSelectedTagsChange([])}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
