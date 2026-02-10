import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { CheckCircle2, FileText, ListTodo, Sun, Moon, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: ListTodo,
      title: 'Task Management',
      description: 'Organize your tasks with priorities, statuses, and due dates. Stay on top of your work.',
      color: 'bg-indigo-500/10 text-indigo-500'
    },
    {
      icon: FileText,
      title: 'Notes',
      description: 'Capture your thoughts and ideas. Pin important notes for quick access.',
      color: 'bg-purple-500/10 text-purple-500'
    },
    {
      icon: CheckCircle2,
      title: 'Posts',
      description: 'Create and manage your content. Publish when you\'re ready to share.',
      color: 'bg-emerald-500/10 text-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo className="w-8 h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label="Toggle theme"
              data-testid="theme-toggle-btn"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="btn-primary" data-testid="go-to-dashboard-btn">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" data-testid="login-btn">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="btn-primary" data-testid="register-btn">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Organize Your <span className="text-primary">Productivity</span>
            </h1>
            <p className="mt-6 text-base lg:text-lg text-muted-foreground max-w-lg">
              A scalable dashboard to manage your tasks, notes, and posts. Built with security and simplicity in mind.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                <Button className="btn-primary flex items-center gap-2" data-testid="hero-cta-btn">
                  {isAuthenticated ? 'Open Dashboard' : 'Start Free'} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="btn-secondary" data-testid="hero-login-btn">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-700 ease-out">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full transform -translate-y-1/2 translate-x-1/2"></div>
              <img 
                src="/hero.svg" 
                alt="Flow Dashboard Preview" 
                className="relative z-10 w-full h-auto object-cover rounded-2xl border border-white/10 shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8 lg:px-12 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit to boost your productivity and keep your work organized.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`feature-card-${index}`}
              >
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="mt-6 font-heading text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of users who trust our platform for their productivity needs.
          </p>
          <Link to="/register">
            <Button className="btn-primary mt-8" data-testid="cta-register-btn">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Flow. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Built with React & FastAPI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
