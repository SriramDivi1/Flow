import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, X, Tag as TagIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const tagColors = [
  { value: 'default', label: 'Gray', class: 'bg-slate-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
];

export function TagBadge({ tag, onRemove, size = 'sm' }) {
  const colorClass = tagColors.find(c => c.value === tag.color)?.class || 'bg-slate-500';
  
  return (
    <Badge 
      variant="secondary" 
      className={`${colorClass} text-white ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} flex items-center gap-1`}
    >
      {tag.name}
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(tag.id); }} className="hover:bg-white/20 rounded-full p-0.5">
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

export function TagSelector({ selectedTags = [], onChange, availableTags = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tagId => {
          const tag = availableTags.find(t => t.id === tagId);
          if (!tag) return null;
          return <TagBadge key={tag.id} tag={tag} onRemove={() => toggleTag(tag.id)} />;
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="h-6 text-xs"
        >
          <TagIcon className="h-3 w-3 mr-1" />
          Add Tag
        </Button>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Tags</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 py-4">
            {availableTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags available. Create some in Settings.</p>
            ) : (
              availableTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`transition-transform ${selectedTags.includes(tag.id) ? 'scale-110 ring-2 ring-primary ring-offset-2' : ''}`}
                >
                  <TagBadge tag={tag} size="md" />
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TagManager() {
  const { api } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: 'default' });
  const [formLoading, setFormLoading] = useState(false);
  
  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      setTags(response.data);
    } catch (error) {
      toast.error('Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }
    setFormLoading(true);
    try {
      await api.post('/tags', formData);
      toast.success('Tag created');
      setIsCreateOpen(false);
      setFormData({ name: '', color: 'default' });
      fetchTags();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create tag');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDelete = async (tagId) => {
    try {
      await api.delete(`/tags/${tagId}`);
      toast.success('Tag deleted');
      fetchTags();
    } catch (error) {
      toast.error('Failed to delete tag');
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Your Tags</h3>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Tag
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet. Create your first tag!</p>
        ) : (
          tags.map(tag => (
            <TagBadge key={tag.id} tag={tag} onRemove={handleDelete} size="md" />
          ))
        )}
      </div>
      
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Tag name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="tag-name-input"
              />
            </div>
            <div className="space-y-2">
              <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {tagColors.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.class}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function useTags() {
  const { api } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.get('/tags');
        setTags(response.data);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, [api]);
  
  return { tags, loading, refetch: async () => {
    const response = await api.get('/tags');
    setTags(response.data);
  }};
}
