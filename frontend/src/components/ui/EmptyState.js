import { FileX2 } from 'lucide-react';
import { Button } from './button';

export function EmptyState({ 
  icon: Icon = FileX2, 
  title = "No items found", 
  description = "Get started by creating a new item.",
  actionLabel,
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
      <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="btn-primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
