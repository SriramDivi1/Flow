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
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import { TagSelector, TagBadge, useTags } from '../components/TagComponents';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
  Filter,
  X,
  GripVertical,
  ListTodo,
  Circle,
  CheckCircle2,
  Timer
} from 'lucide-react';

import { toast } from 'sonner';
import { format } from 'date-fns';
import { usePageTitle } from '../hooks/usePageTitle';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';


const statusOptions = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-500' }
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-slate-400' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-400' },
  { value: 'high', label: 'High', color: 'bg-rose-500' }
];

function SortableTaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'in_progress': return <Timer className="h-4 w-4 text-amber-500" />;
      default: return <Circle className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-task animate-slide-in flex items-start gap-3 group ${task.status === 'completed' ? 'opacity-75' : ''}`}
      data-testid={`task-card-${task.id}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        data-testid={`drag-handle-${task.id}`}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-semibold text-foreground truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </h3>
          
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 border-dashed"
                  data-testid={`status-trigger-${task.id}`}
                >
                  {getStatusIcon(task.status)}
                  <span className="ml-2 text-xs font-medium">
                    {statusOptions.find(s => s.value === task.status)?.label}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {statusOptions.map((option) => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => onStatusChange(task, option.value)}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${option.color}`} />
                    {option.label}
                    {task.status === option.value && <div className="ml-auto w-1 h-1 bg-current rounded-full" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant="outline" className="text-xs">
              {priorityOptions.find(p => p.value === task.priority)?.label}
            </Badge>
          </div>
        </div>
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {task.tags?.map(tag => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
          {task.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0" data-testid={`task-menu-${task.id}`}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(task)} data-testid={`edit-task-${task.id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(task)}
            className="text-destructive focus:text-destructive"
            data-testid={`delete-task-${task.id}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function TasksPage() {
  usePageTitle('Tasks');
  const { api } = useAuth();
  const [searchParams] = useSearchParams();
  const { tags: availableTags } = useTags();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const search = useDebounce(searchInput);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: null,
    tag_ids: []
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter && priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (tagFilter && tagFilter !== 'all') params.append('tag_id', tagFilter);
      params.append('limit', PAGE_SIZE);
      params.append('offset', (page - 1) * PAGE_SIZE);
      
      const response = await api.get(`/tasks?${params.toString()}`);
      setTasks(response.data);
      setTotalCount(parseInt(response.headers['x-total-count'] || '0', 10));
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, priorityFilter, tagFilter, page]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);
      
      try {
        await api.post('/tasks/reorder', { task_ids: newTasks.map(t => t.id) });
      } catch (error) {
        toast.error('Failed to reorder tasks');
        fetchTasks();
      }
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setFormLoading(true);
    try {
      await api.post('/tasks', {
        ...formData,
        due_date: formData.due_date?.toISOString()
      });
      toast.success('Task created successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
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
      await api.put(`/tasks/${selectedTask.id}`, {
        ...formData,
        due_date: formData.due_date?.toISOString()
      });
      toast.success('Task updated successfully');
      setIsEditOpen(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      toast.success('Task deleted successfully');
      setIsDeleteOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleQuickUpdate = async (task, newStatus) => {
    if (task.status === newStatus) return;
    
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      toast.success('Status updated');
      fetchTasks(); // Refresh to ensure consistency
    } catch (error) {
      toast.error('Failed to update status');
      setTasks(previousTasks); // Revert on error
    }
  };

  const openEdit = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date) : null,
      tag_ids: task.tags?.map(t => t.id) || []
    });
    setIsEditOpen(true);
  };

  const openDelete = (task) => {
    setSelectedTask(task);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: null,
      tag_ids: []
    });
    setSelectedTask(null);
  };

  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setPriorityFilter('');
    setTagFilter('');
    setPage(1);
  };

  const hasFilters = search || statusFilter || priorityFilter || tagFilter;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="tasks-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Tasks</h2>
          <p className="text-muted-foreground">Drag to reorder, manage your tasks</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="btn-primary" data-testid="create-task-btn">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            data-testid="search-tasks-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36" data-testid="status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-36" data-testid="priority-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {priorityOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} data-testid="clear-filters-btn">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card-task flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-md" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks found"
          description={hasFilters ? "Try adjusting your filters" : "Get started by creating a new task to track your work."}
          actionLabel={!hasFilters ? "Create your first task" : undefined}
          onAction={!hasFilters ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  onStatusChange={handleQuickUpdate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Pagination page={page} totalPages={Math.ceil(totalCount / PAGE_SIZE)} onPageChange={setPage} />

      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-lg" data-testid="task-dialog">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Task' : 'Create Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
                data-testid="task-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description (optional)"
                rows={3}
                data-testid="task-description-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger data-testid="task-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger data-testid="task-priority-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="task-due-date-btn">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(formData.due_date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => setFormData({ ...formData, due_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
              data-testid="task-submit-btn"
            >
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditOpen ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent data-testid="delete-task-dialog">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete "{selectedTask?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={formLoading}
              data-testid="confirm-delete-task-btn"
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
