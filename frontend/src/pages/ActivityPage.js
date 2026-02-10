import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Loader2, ListTodo, FileText, PenSquare, User, 
  Plus, Pencil, Trash2, CheckCircle2, Send, LogIn 
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { usePageTitle } from '../hooks/usePageTitle';

const actionIcons = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  completed: CheckCircle2,
  published: Send,
  logged_in: LogIn,
  registered: User,
};

const entityIcons = {
  task: ListTodo,
  note: FileText,
  post: PenSquare,
  user: User,
  profile: User,
};

const actionColors = {
  created: 'text-emerald-500 bg-emerald-500/10',
  updated: 'text-blue-500 bg-blue-500/10',
  deleted: 'text-red-500 bg-red-500/10',
  completed: 'text-green-500 bg-green-500/10',
  published: 'text-purple-500 bg-purple-500/10',
  logged_in: 'text-cyan-500 bg-cyan-500/10',
  registered: 'text-indigo-500 bg-indigo-500/10',
};

export default function ActivityPage() {
  usePageTitle('Activity');
  const { api } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const params = filter !== 'all' ? `?entity_type=${filter}` : '';
        const response = await api.get(`/activities${params}`);
        setActivities(response.data);
      } catch (error) {
        toast.error('Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [api, filter]);

  const getActionText = (action, entityType, entityTitle) => {
    const actions = {
      created: `Created ${entityType}`,
      updated: `Updated ${entityType}`,
      deleted: `Deleted ${entityType}`,
      completed: `Completed ${entityType}`,
      published: `Published ${entityType}`,
      logged_in: 'Logged in',
      registered: 'Created account',
    };
    
    let text = actions[action] || action;
    if (entityTitle && !['logged_in', 'registered'].includes(action)) {
      text += `: "${entityTitle}"`;
    }
    return text;
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = format(new Date(activity.created_at), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(activity);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="activity-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Activity Timeline</h2>
          <p className="text-muted-foreground">Track all your actions and changes</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40" data-testid="filter-select">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="post">Posts</SelectItem>
            <SelectItem value="user">Account</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">No activities yet. Start creating tasks, notes, or posts!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div key={date}>
              <div className="sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
              </div>
              <div className="relative ml-4 border-l-2 border-border pl-6 space-y-4">
                {dayActivities.map((activity, index) => {
                  const ActionIcon = actionIcons[activity.action] || Plus;
                  const EntityIcon = entityIcons[activity.entity_type] || FileText;
                  const colorClass = actionColors[activity.action] || 'text-gray-500 bg-gray-500/10';
                  
                  return (
                    <div
                      key={activity.id}
                      className="relative animate-slide-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      data-testid={`activity-${activity.id}`}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] w-4 h-4 rounded-full ${colorClass} flex items-center justify-center`}>
                        <ActionIcon className="h-2.5 w-2.5" />
                      </div>
                      
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <EntityIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">
                                {getActionText(activity.action, activity.entity_type, activity.entity_title)}
                              </p>
                              {activity.details && (
                                <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
