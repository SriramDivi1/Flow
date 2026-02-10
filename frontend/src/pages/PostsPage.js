import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/use-debounce';
import Pagination from '../components/Pagination';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { TagSelector, TagBadge, useTags } from '../components/TagComponents';
import RichTextEditor from '../components/RichTextEditor';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Send,
  Eye,
  EyeOff,
  Filter,
  X,
  PenSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { usePageTitle } from '../hooks/usePageTitle';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

export default function PostsPage() {
  usePageTitle('Posts');
  const { api } = useAuth();
  const [searchParams] = useSearchParams();
  const { tags: availableTags } = useTags();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const search = useDebounce(searchInput);
  const [publishedFilter, setPublishedFilter] = useState(searchParams.get('published') === 'true');
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_published: false,
    tag_ids: []
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (publishedFilter) params.append('is_published', 'true');
      if (tagFilter && tagFilter !== 'all') params.append('tag_id', tagFilter);
      params.append('limit', PAGE_SIZE);
      params.append('offset', (page - 1) * PAGE_SIZE);

      const response = await api.get(`/posts?${params.toString()}`);
      setPosts(response.data);
      setTotalCount(parseInt(response.headers['x-total-count'] || '0', 10));
    } catch (error) {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, publishedFilter, tagFilter, page]);

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setFormLoading(true);
    try {
      await api.post('/posts', formData);
      toast.success('Post created successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
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
      await api.put(`/posts/${selectedPost.id}`, formData);
      toast.success('Post updated successfully');
      setIsEditOpen(false);
      resetForm();
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update post');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/posts/${selectedPost.id}`);
      toast.success('Post deleted successfully');
      setIsDeleteOpen(false);
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setFormLoading(false);
    }
  };

  const togglePublish = async (post) => {
    try {
      await api.put(`/posts/${post.id}`, { is_published: !post.is_published });
      toast.success(post.is_published ? 'Post unpublished' : 'Post published');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const openEdit = (post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      content: post.content || '',
      is_published: post.is_published,
      tag_ids: post.tags?.map(t => t.id) || []
    });
    setIsEditOpen(true);
  };

  const openDelete = (post) => {
    setSelectedPost(post);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      is_published: false,
      tag_ids: []
    });
    setSelectedPost(null);
  };

  const clearFilters = () => {
    setSearchInput('');
    setPublishedFilter(false);
    setTagFilter('');
    setPage(1);
  };

  const hasFilters = search || publishedFilter || tagFilter;

  // Strip HTML for preview
  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="posts-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Posts</h2>
          <p className="text-muted-foreground">Create and manage your content with rich text</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="btn-primary" data-testid="create-post-btn">
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            data-testid="search-posts-input"
          />
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-full sm:w-36" data-testid="tag-filter">
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
          variant={publishedFilter ? 'default' : 'outline'}
          onClick={() => setPublishedFilter(!publishedFilter)}
          className={publishedFilter ? 'btn-primary' : ''}
          data-testid="published-filter-btn"
        >
          <Send className="h-4 w-4 mr-2" />
          Published
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} data-testid="clear-filters-btn">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={PenSquare}
          title="No posts found"
          description={hasFilters ? "Try adjusting your filters" : "Share your thoughts with the world. Create a post to get started."}
          actionLabel={!hasFilters ? "Create your first post" : undefined}
          onAction={!hasFilters ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="card-post animate-slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              data-testid={`post-card-${post.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{post.title}</h3>
                    <Badge variant={post.is_published ? 'default' : 'secondary'} className={post.is_published ? 'bg-emerald-500' : ''}>
                      {post.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  {post.content && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {stripHtml(post.content)}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {post.tags?.map(tag => (
                      <TagBadge key={tag.id} tag={tag} />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Created: {format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                    {post.published_at && (
                      <span>Published: {format(new Date(post.published_at), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0" data-testid={`post-menu-${post.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => togglePublish(post)} data-testid={`publish-post-${post.id}`}>
                      {post.is_published ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {post.is_published ? 'Unpublish' : 'Publish'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(post)} data-testid={`edit-post-${post.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDelete(post)}
                      className="text-destructive focus:text-destructive"
                      data-testid={`delete-post-${post.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="post-dialog">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Post' : 'Create Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Post title"
                data-testid="post-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Write your post content..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagSelector
                selectedTags={formData.tag_ids}
                onChange={(tags) => setFormData({ ...formData, tag_ids: tags })}
                availableTags={availableTags}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                data-testid="post-publish-switch"
              />
              <Label className="cursor-pointer">
                {formData.is_published ? 'Published' : 'Save as draft'}
              </Label>
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
              data-testid="post-submit-btn"
            >
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditOpen ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent data-testid="delete-post-dialog">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={formLoading}
              data-testid="confirm-delete-post-btn"
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
