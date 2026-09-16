export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Godown {
  id: string;
  name: string;
  location: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
  stocks?: GodownStock[];
}

export interface GodownStock {
  id: string;
  godownId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  godown?: Godown;
  product?: Product;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  description: string;
  price: number;
  cost: number;
  quantity: number; // Computed globally
  minStock: number;
  maxStock: number;
  createdAt: Date;
  updatedAt: Date;
  stocks?: GodownStock[];
}

export interface StockMovement {
  id: string;
  productId: string;
  godownId: string;
  userId: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  reference: string;
  createdAt: Date;
  product?: Partial<Product>;
  godown?: Partial<Godown>;
  user?: Partial<User>;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  godownDistribution: Array<{
    name: string;
    value: number;
  }>;
}