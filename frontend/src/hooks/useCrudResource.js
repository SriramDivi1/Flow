import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

/**
 * Reusable hook for CRUD list pages.
 *
 * @param {string} endpoint - API endpoint (e.g. '/tasks')
 * @param {object} filters - Object of filter key/value pairs (those with falsy values are omitted)
 * @param {object} options
 * @param {string} options.entityName - Entity display name (e.g. 'task')
 * @param {number} options.pageSize - Items per page (default 20)
 */
export function useCrudResource(endpoint, filters = {}, options = {}) {
  const { api } = useAuth();
  const { entityName = 'item', pageSize = 20 } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });
      params.append('limit', pageSize);
      params.append('offset', (page - 1) * pageSize);

      const response = await api.get(`${endpoint}?${params.toString()}`);
      setItems(response.data);
      setTotalCount(parseInt(response.headers['x-total-count'] || '0', 10));
    } catch (error) {
      toast.error(`Failed to fetch ${entityName}s`);
    } finally {
      setLoading(false);
    }
  }, [api, endpoint, JSON.stringify(filters), page, pageSize, entityName]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const createItem = async (data) => {
    const response = await api.post(endpoint, data);
    toast.success(`${entityName} created successfully`);
    fetchItems();
    return response.data;
  };

  const updateItem = async (id, data) => {
    const response = await api.put(`${endpoint}/${id}`, data);
    toast.success(`${entityName} updated successfully`);
    fetchItems();
    return response.data;
  };

  const deleteItem = async (id) => {
    await api.delete(`${endpoint}/${id}`);
    toast.success(`${entityName} deleted successfully`);
    fetchItems();
  };

  const resetPage = () => setPage(1);

  return {
    items,
    loading,
    page,
    totalPages,
    totalCount,
    setPage,
    resetPage,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
}
