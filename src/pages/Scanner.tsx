import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useInventoryOperations } from '../hooks/useInventoryOperations';
import { Scan, Package, Plus, Minus, X, Loader2 } from 'lucide-react';
import { simulateBarcodeScanner } from '../utils/helpers';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { api } from '../utils/api';

const Scanner: React.FC = () => {
  const { state } = useInventory();
  const { addStockMovement } = useInventoryOperations();
  const [scanning, setScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [operation, setOperation] = useState<'IN' | 'OUT'>('IN');
  const [godownId, setGodownId] = useState('');

  const handleScan = async () => {
    setScanning(true);
    try {
      let barcode = '';
      if (Capacitor.isNativePlatform()) {
        await BarcodeScanner.checkPermission({ force: true });
        BarcodeScanner.hideBackground();
        document.body.classList.add('scanner-active');
        
        const result = await BarcodeScanner.startScan();
        if (result.hasContent) {
          barcode = result.content;
        }
      } else {
        barcode = await simulateBarcodeScanner();
      }
      
      if (barcode) {
        setScannedBarcode(barcode);
        try {
          const product = await api.get(`/products/barcode/${barcode}`);
          setFoundProduct(product);
        } catch (error) {
          console.error('Product not found for barcode:', error);
          setFoundProduct(null);
        }
      }
    } catch (error) {
      console.error('Scanning failed:', error);
      alert('Scanning failed or permission denied.');
    } finally {
      stopNativeScan();
    }
  };

  const stopNativeScan = () => {
    if (Capacitor.isNativePlatform()) {
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
      document.body.classList.remove('scanner-active');
    }
    setScanning(false);
  };

  const handleStockUpdate = () => {
    if (foundProduct) {
      if (!godownId && state.godowns.length > 0) {
        alert('Please select a godown');
        return;
      }
      const actualGodownId = godownId || state.godowns[0]?.id;
      const reason = operation === 'IN' ? 'Stock received via scanner' : 'Stock issued via scanner';
      addStockMovement(foundProduct.id, actualGodownId, operation, quantity, reason);
      
      // Reset form
      setScannedBarcode('');
      setFoundProduct(null);
      setQuantity(1);
    }
  };

  const handleManualBarcode = async (barcode: string) => {
    setScannedBarcode(barcode);
    if (!barcode) {
      setFoundProduct(null);
      return;
    }
    try {
      const product = await api.get(`/products/barcode/${barcode}`);
      setFoundProduct(product);
    } catch (error) {
      console.error('Product not found for barcode:', error);
      setFoundProduct(null);
    }
  };

  return (
    <div className={`space-y-6 ${scanning && Capacitor.isNativePlatform() ? 'hidden' : ''}`}>
      <h1 className="text-3xl font-bold text-gray-900">Barcode Scanner</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan Product</h2>
          
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
              {scanning ? (
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              ) : (
                <Scan size={64} className="text-gray-400" />
              )}
            </div>
            
            <button
              onClick={handleScan}
              disabled={scanning}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? 'Scanning...' : 'Start Scan'}
            </button>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter barcode manually:
            </label>
            <input
              type="text"
              value={scannedBarcode}
              onChange={(e) => handleManualBarcode(e.target.value)}
              placeholder="Enter barcode..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Product Info Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Information</h2>
          
          {scannedBarcode && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Scanned Barcode:</label>
                <p className="text-lg font-mono bg-gray-100 p-2 rounded">{scannedBarcode}</p>
              </div>

              {foundProduct ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Package className="text-green-600" size={20} />
                    <span className="text-green-600 font-medium">Product Found!</span>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900">{foundProduct.name}</h3>
                    <p className="text-sm text-gray-600">SKU: {foundProduct.sku}</p>
                    <p className="text-sm text-gray-600">Category: {foundProduct.category}</p>
                    <p className="text-sm text-gray-600">Current Stock: {foundProduct.quantity}</p>
                  </div>

                  {/* Stock Operation */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Godown:</label>
                      <select 
                        value={godownId} 
                        onChange={e => setGodownId(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Godown</option>
                        {state.godowns.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Operation:</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setOperation('IN')}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                            operation === 'IN' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          <Plus size={16} />
                          <span>Stock In</span>
                        </button>
                        <button
                          onClick={() => setOperation('OUT')}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                            operation === 'OUT' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          <Minus size={16} />
                          <span>Stock Out</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity:</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      onClick={handleStockUpdate}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                      Update Stock
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto text-gray-400 mb-2" size={48} />
                  <p className="text-gray-500">Product not found in inventory</p>
                  <p className="text-sm text-gray-400">Check the barcode or add this product first</p>
                </div>
              )}
            </div>
          )}

          {!scannedBarcode && (
            <div className="text-center py-8">
              <Scan className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-500">Scan or enter a barcode to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Scanner Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.stockMovements
                .filter(movement => movement.reason.includes('scanner'))
                .slice(-10)
                .reverse()
                .map((movement) => {
                  const product = state.products.find(p => p.id === movement.productId);
                  return (
                    <tr key={movement.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product?.name || 'Unknown Product'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          movement.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {movement.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.createdAt.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Native Scanner Overlay */}
      {scanning && Capacitor.isNativePlatform() && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-20 pointer-events-none">
           <div className="w-64 h-64 border-2 border-green-500 rounded-lg mb-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
           <button 
             onClick={stopNativeScan}
             className="pointer-events-auto bg-red-600 text-white px-8 py-3 rounded-full flex items-center space-x-2 shadow-lg"
           >
             <X size={24} />
             <span className="font-bold">Stop Scan</span>
           </button>
        </div>
      )}
    </div>
  );
};

export default Scanner;