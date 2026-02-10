import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

const STATUS_COLORS = { todo: '#64748b', in_progress: '#f59e0b', completed: '#10b981' };
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#fbbf24', high: '#f43f5e' };
const NOTE_COLORS = { default: '#94a3b8', yellow: '#fbbf24', green: '#34d399', blue: '#60a5fa', purple: '#a78bfa', pink: '#f472b6' };

export default function AnalyticsPage() {
  usePageTitle('Analytics');
  const { api } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/analytics?days=${days}`);
        setAnalytics(response.data);
      } catch (error) {
        toast.error('Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [api, days]);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await api.post('/export', { entity_type: 'all', format }, { responseType: 'blob' });
      const filename = format === 'json' ? 'flow_export.json' : 'flow_export.csv';
      saveAs(new Blob([response.data]), filename);
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Transform data for Recharts
  const activityData = (analytics?.activity_over_time || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    count: d.count,
  }));

  const completedData = (analytics?.tasks_completed_over_time || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    count: d.count,
  }));

  const statusData = Object.entries(analytics?.tasks_by_status || {}).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
    fill: STATUS_COLORS[name] || '#8884d8',
  }));

  const priorityData = Object.entries(analytics?.tasks_by_priority || {}).map(([name, value]) => ({
    name,
    value,
    fill: PRIORITY_COLORS[name] || '#8884d8',
  }));

  const noteColorData = Object.entries(analytics?.notes_by_color || {}).map(([name, value]) => ({
    name,
    value,
    fill: NOTE_COLORS[name] || '#8884d8',
  }));

  return (
    <div className="space-y-6 animate-fade-in" data-testid="analytics-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Analytics</h2>
          <p className="text-muted-foreground">Track your productivity and progress</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32" data-testid="days-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('csv')} disabled={exporting} data-testid="export-csv-btn">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')} disabled={exporting} data-testid="export-json-btn">
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {/* Productivity Score */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">Productivity Score</p>
            <p className="text-4xl font-bold text-foreground">{analytics?.productivity_score || 0}%</p>
            <p className="text-sm text-muted-foreground mt-1">Based on completed tasks</p>
          </div>
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Over Time</CardTitle>
          <CardDescription>Your daily activity for the last {Math.min(parseInt(days), 14)} days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Charts Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Tasks by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
            )}
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {priorityData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
            )}
          </CardContent>
        </Card>

        {/* Notes by Color */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Notes by Color</CardTitle>
          </CardHeader>
          <CardContent>
            {noteColorData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={noteColorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {noteColorData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No notes yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks Completed Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tasks Completed</CardTitle>
          <CardDescription>Daily task completion rate</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={completedData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
