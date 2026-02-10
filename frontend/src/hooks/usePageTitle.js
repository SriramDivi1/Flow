import { useEffect } from 'react';

/**
 * Sets the document title for the current page.
 * Usage: usePageTitle('Tasks') → "Tasks — Flow"
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — Flow` : 'Flow';
    return () => { document.title = 'Flow'; };
  }, [title]);
}
