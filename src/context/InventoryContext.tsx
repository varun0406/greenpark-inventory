import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { Product, StockMovement, InventoryAlert, Godown } from '../types';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

interface InventoryState {
  products: Product[];
  stockMovements: StockMovement[];
  alerts: InventoryAlert[];
  godowns: Godown[];
  loading: boolean;
}

type InventoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_GODOWNS'; payload: Godown[] }
  | { type: 'SET_MOVEMENTS'; payload: StockMovement[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_STOCK_MOVEMENT'; payload: StockMovement }
  | { type: 'ADD_ALERT'; payload: InventoryAlert }
  | { type: 'MARK_ALERT_READ'; payload: string }
  | { type: 'LOGOUT_RESET' };

const initialState: InventoryState = {
  products: [],
  stockMovements: [],
  alerts: [],
  godowns: [],
  loading: false,
};

const inventoryReducer = (state: InventoryState, action: InventoryAction): InventoryState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_GODOWNS':
      return { ...state, godowns: action.payload };
    case 'SET_MOVEMENTS':
      return { ...state, stockMovements: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload)
      };
    case 'ADD_STOCK_MOVEMENT':
      return { ...state, stockMovements: [action.payload, ...state.stockMovements] };
    case 'ADD_ALERT':
      return { ...state, alerts: [...state.alerts, action.payload] };
    case 'MARK_ALERT_READ':
      return {
        ...state,
        alerts: state.alerts.map(a => a.id === action.payload ? { ...a, isRead: true } : a)
      };
    case 'LOGOUT_RESET':
      return initialState;
    default:
      return state;
  }
};

const InventoryContext = createContext<{
  state: InventoryState;
  dispatch: React.Dispatch<InventoryAction>;
  refreshData: () => Promise<void>;
} | null>(null);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);
  const { isAuthenticated } = useAuth();

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [godowns, movements] = await Promise.all([
        api.get('/godowns'),
        api.get('/movements')
      ]);
      dispatch({ type: 'SET_GODOWNS', payload: godowns });
      dispatch({ type: 'SET_MOVEMENTS', payload: movements });
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      dispatch({ type: 'LOGOUT_RESET' });
    }
  }, [isAuthenticated, refreshData]);

  return (
    <InventoryContext.Provider value={{ state, dispatch, refreshData }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};