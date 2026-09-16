import { useCallback } from 'react';
import { useInventory } from '../context/InventoryContext';
import { api } from '../utils/api';

export const useInventoryOperations = () => {
  const { refreshData } = useInventory();

  const addProduct = useCallback(async (productData: any) => {
    try {
      const product = await api.post('/products', productData);
      await refreshData();
      return product;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  }, [refreshData]);

  const updateProduct = useCallback(async (productId: string, productData: any) => {
    try {
      const product = await api.put(`/products/${productId}`, productData);
      await refreshData();
      return product;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  }, [refreshData]);

  const addStockMovement = useCallback(async (productId: string, godownId: string, type: string, quantity: number, reason: string) => {
    try {
      const movement = await api.post('/movements', {
        productId, godownId, type, quantity, reason
      });
      await refreshData();
      return movement;
    } catch (error) {
      console.error('Failed to record stock movement:', error);
      throw error;
    }
  }, [refreshData]);

  const addGodown = useCallback(async (godownData: any) => {
    try {
      const godown = await api.post('/godowns', godownData);
      await refreshData();
      return godown;
    } catch (error) {
      console.error('Failed to create godown:', error);
      throw error;
    }
  }, [refreshData]);

  return {
    addProduct,
    updateProduct,
    addStockMovement,
    addGodown
  };
};