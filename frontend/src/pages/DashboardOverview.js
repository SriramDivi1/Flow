import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ListTodo, FileText, PenSquare, CheckCircle2, Clock, Pin, Send, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Skeleton } from '../components/ui/Skeleton';

export default function DashboardOverview() {
  usePageTitle('Dashboard');
  const { api, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard stats. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = useMemo(() => [
    {
      title: 'Total Tasks',
      value: stats?.tasks?.total || 0,
      icon: ListTodo,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      link: '/dashboard/tasks'
    },
    {
      title: 'Completed',
      value: stats?.tasks?.completed || 0,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      link: '/dashboard/tasks?status=completed'
    },
    {
      title: 'In Progress',
      value: stats?.tasks?.in_progress || 0,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      link: '/dashboard/tasks?status=in_progress'
    },
    {
      title: 'Total Notes',
      value: stats?.notes?.total || 0,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      link: '/dashboard/notes'
    },
    {
      title: 'Pinned Notes',
      value: stats?.notes?.pinned || 0,
      icon: Pin,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      link: '/dashboard/notes?pinned=true'
    },
    {
      title: 'Total Posts',
      value: stats?.posts?.total || 0,
      icon: PenSquare,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      link: '/dashboard/posts'
    },
    {
      title: 'Published',
      value: stats?.posts?.published || 0,
      icon: Send,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      link: '/dashboard/posts?published=true'
    }
  ], [stats]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm h-32 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4" data-testid="error-state">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard-overview">
      {/* Welcome Section */}
      <div className="bg-card border border-border rounded-xl p-6 md:p-8">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
          Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
        </h2>
        <p className="mt-2 text-muted-foreground">
          Here's what's happening with your productivity today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
            data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s/g, '-')}`}
          >
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/dashboard/tasks" data-testid="quick-tasks">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer bg-indigo-500/5 border-indigo-500/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-indigo-500/10">
                <ListTodo className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Manage Tasks</h3>
                <p className="text-sm text-muted-foreground">Create and track your tasks</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/notes" data-testid="quick-notes">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer bg-purple-500/5 border-purple-500/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Take Notes</h3>
                <p className="text-sm text-muted-foreground">Capture your thoughts</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/posts" data-testid="quick-posts">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer bg-cyan-500/5 border-cyan-500/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <PenSquare className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Write Posts</h3>
                <p className="text-sm text-muted-foreground">Create and publish content</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
