import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/use-debounce';
import Pagination from '../components/Pagination';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Switch } from '../components/ui/switch';
import { TagSelector, TagBadge, useTags } from '../components/TagComponents';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Pin,
  PinOff,
  Filter,
  X,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { usePageTitle } from '../hooks/usePageTitle';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';


const colorOptions = [
  { value: 'default', label: 'Default', color: 'bg-card border-border' },
  { value: 'yellow', label: 'Yellow', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  { value: 'green', label: 'Green', color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
  { value: 'pink', label: 'Pink', color: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800' }
];

export default function NotesPage() {
  usePageTitle('Notes');
  const { api } = useAuth();
  const [searchParams] = useSearchParams();
  const { tags: availableTags } = useTags();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const search = useDebounce(searchInput);
  const [pinnedFilter, setPinnedFilter] = useState(searchParams.get('pinned') === 'true');
  const [colorFilter, setColorFilter] = useState(searchParams.get('color') || '');
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'default',
    is_pinned: false,
    tag_ids: []
  });

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (pinnedFilter) params.append('is_pinned', 'true');
      if (colorFilter && colorFilter !== 'all') params.append('color', colorFilter);
      if (tagFilter && tagFilter !== 'all') params.append('tag_id', tagFilter);
      params.append('limit', PAGE_SIZE);
      params.append('offset', (page - 1) * PAGE_SIZE);

      const response = await api.get(`/notes?${params.toString()}`);
      setNotes(response.data);
      setTotalCount(parseInt(response.headers['x-total-count'] || '0', 10));
    } catch (error) {
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pinnedFilter, colorFilter, tagFilter, page]);

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setFormLoading(true);
    try {
      await api.post('/notes', formData);
      toast.success('Note created successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchNotes();
    } catch (error) {
      toast.error('Failed to create note');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setFormLoading(true);
    try {
      await api.put(`/notes/${selectedNote.id}`, formData);
      toast.success('Note updated successfully');
      setIsEditOpen(false);
      resetForm();
      fetchNotes();
    } catch (error) {
      toast.error('Failed to update note');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/notes/${selectedNote.id}`);
      toast.success('Note deleted successfully');
      setIsDeleteOpen(false);
      setSelectedNote(null);
      fetchNotes();
    } catch (error) {
      toast.error('Failed to delete note');
    } finally {
      setFormLoading(false);
    }
  };

  const togglePin = async (note) => {
    try {
      await api.put(`/notes/${note.id}`, { is_pinned: !note.is_pinned });
      toast.success(note.is_pinned ? 'Note unpinned' : 'Note pinned');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const openEdit = (note) => {
    setSelectedNote(note);
    setFormData({
      title: note.title,
      content: note.content || '',
      color: note.color,
      is_pinned: note.is_pinned,
      tag_ids: note.tags?.map(t => t.id) || []
    });
    setIsEditOpen(true);
  };

  const openDelete = (note) => {
    setSelectedNote(note);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      color: 'default',
      is_pinned: false,
      tag_ids: []
    });
    setSelectedNote(null);
  };

  const clearFilters = () => {
    setSearchInput('');
    setPinnedFilter(false);
    setColorFilter('');
    setTagFilter('');
    setPage(1);
  };

  const hasFilters = search || pinnedFilter || colorFilter || tagFilter;

  const getCardColor = (color) => {
    return colorOptions.find(c => c.value === color)?.color || colorOptions[0].color;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="notes-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Notes</h2>
          <p className="text-muted-foreground">Capture your thoughts and ideas</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="btn-primary" data-testid="create-note-btn">
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            data-testid="search-notes-input"
          />
        </div>
        <Select value={colorFilter} onValueChange={setColorFilter}>
          <SelectTrigger className="w-full sm:w-32" data-testid="color-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colors</SelectItem>
            {colorOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-full sm:w-32" data-testid="tag-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {availableTags.map(tag => (
              <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={pinnedFilter ? 'default' : 'outline'}
          onClick={() => setPinnedFilter(!pinnedFilter)}
          className={pinnedFilter ? 'btn-primary' : ''}
          data-testid="pinned-filter-btn"
        >
          <Pin className="h-4 w-4 mr-2" />
          Pinned
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} data-testid="clear-filters-btn">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes found"
          description={hasFilters ? "Try adjusting your filters" : "Capture your ideas and thoughts. Create a note to get started."}
          actionLabel={!hasFilters ? "Create your first note" : undefined}
          onAction={!hasFilters ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note, index) => (
            <div
              key={note.id}
              className={`card-note ${getCardColor(note.color)} animate-fade-in relative`}
              style={{ animationDelay: `${index * 0.05}s` }}
              data-testid={`note-card-${note.id}`}
            >
              {note.is_pinned && (
                <Pin className="absolute top-4 right-4 h-4 w-4 text-primary" />
              )}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground line-clamp-1 pr-8">{note.title}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-2" data-testid={`note-menu-${note.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => togglePin(note)} data-testid={`pin-note-${note.id}`}>
                      {note.is_pinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                      {note.is_pinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(note)} data-testid={`edit-note-${note.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDelete(note)}
                      className="text-destructive focus:text-destructive"
                      data-testid={`delete-note-${note.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {note.content && (
                <p className="text-sm text-muted-foreground line-clamp-4 flex-1">{note.content}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {note.tags?.map(tag => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-auto pt-2">
                {format(new Date(note.updated_at), 'MMM d, yyyy')}
              </p>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(totalCount / PAGE_SIZE)} onPageChange={setPage} />

      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-lg" data-testid="note-dialog">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Note' : 'Create Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Note title"
                data-testid="note-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your note..."
                rows={6}
                data-testid="note-content-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger data-testid="note-color-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pin Note</Label>
                <div className="flex items-center h-10">
                  <Switch
                    checked={formData.is_pinned}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                    data-testid="note-pin-switch"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formData.is_pinned ? 'Pinned' : 'Not pinned'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagSelector
                selectedTags={formData.tag_ids}
                onChange={(tags) => setFormData({ ...formData, tag_ids: tags })}
                availableTags={availableTags}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setIsEditOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={isEditOpen ? handleUpdate : handleCreate}
              disabled={formLoading}
              className="btn-primary"
              data-testid="note-submit-btn"
            >
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditOpen ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent data-testid="delete-note-dialog">
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete "{selectedNote?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={formLoading}
              data-testid="confirm-delete-note-btn"
            >
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
