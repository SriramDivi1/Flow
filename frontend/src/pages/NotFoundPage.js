import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Ghost, ArrowLeft, Home } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page Not Found');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center animate-fade-in" data-testid="not-found-page">
      <div className="p-6 rounded-full bg-muted mb-6 animate-pulse-slow">
        <Ghost className="h-16 w-16 text-muted-foreground" />
      </div>
      
      <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-4">
        404
      </h1>
      
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
        Page not found
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" onClick={() => navigate(-1)} data-testid="go-back-btn">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        
        <Link to="/dashboard">
          <Button className="btn-primary" data-testid="go-home-btn">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
