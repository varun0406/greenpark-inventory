import { Product, InventoryAlert } from '../types';

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateBarcode = (): string => {
  return Math.random().toString().substr(2, 12);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const checkLowStock = (products: Product[]): InventoryAlert[] => {
  const alerts: InventoryAlert[] = [];
  
  products.forEach(product => {
    if (product.quantity <= 0) {
      alerts.push({
        id: generateId(),
        productId: product.id,
        type: 'OUT_OF_STOCK',
        message: `${product.name} is out of stock`,
        isRead: false,
        createdAt: new Date(),
      });
    } else if (product.quantity <= product.minStock) {
      alerts.push({
        id: generateId(),
        productId: product.id,
        type: 'LOW_STOCK',
        message: `${product.name} is running low (${product.quantity} remaining)`,
        isRead: false,
        createdAt: new Date(),
      });
    }
  });
  
  return alerts;
};

export const calculateInventoryValue = (products: Product[]): number => {
  return products.reduce((total, product) => total + (product.quantity * product.cost), 0);
};

export const simulateBarcodeScanner = (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateBarcode());
    }, 1000);
  });
};

export const exportToCSV = (data: any[], filename: string): void => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
};