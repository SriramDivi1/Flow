import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination component.
 * @param {number} page - Current page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Called with new page number
 */
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4" data-testid="pagination">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        data-testid="pagination-prev"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Prev
      </Button>
      <span className="text-sm text-muted-foreground px-3">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        data-testid="pagination-next"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
