import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import { useInventoryOperations } from '../hooks/useInventoryOperations';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency, generateBarcode } from '../utils/helpers';
import { api } from '../utils/api';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
};

const Products: React.FC = () => {
  const { state } = useInventory();
  const { addProduct, updateProduct } = useInventoryOperations();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGodown, setFilterGodown] = useState('');
  
  // Server-side pagination state
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    description: '',
    price: 0,
    cost: 0,
    quantity: 0,
    minStock: 0,
    maxStock: 0,
  });

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filterCategory, filterGodown]);

  // Fetch paginated products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?page=${page}&limit=${limit}&search=${searchTerm}&category=${filterCategory}&godownId=${filterGodown}`);
      setProducts(res.data);
      setTotalItems(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, filterCategory, filterGodown]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: '',
      description: '',
      price: 0,
      cost: 0,
      quantity: 0,
      minStock: 0,
      maxStock: 0,
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      description: product.description,
      price: product.price,
      cost: product.cost,
      quantity: product.quantity,
      minStock: product.minStock,
      maxStock: product.maxStock,
    });
    setShowModal(true);
  };

  const generateNewBarcode = () => {
    setFormData({ ...formData, barcode: generateBarcode() });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-awwwards-text tracking-tight">Products</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-awwwards-primary hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 shadow-[0_4px_15px_rgba(99,102,241,0.4)] transition-all transform hover:-translate-y-1"
        >
          <Plus size={20} />
          <span className="font-bold">Add Product</span>
        </button>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="glass-panel rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-awwwards-border bg-white dark:bg-gray-800">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 pr-4 py-3 w-full bg-gray-50 dark:bg-gray-900 border border-awwwards-border text-awwwards-text rounded-xl focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
              />
            </div>
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Filter by Category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 w-full bg-gray-50 dark:bg-gray-900 border border-awwwards-border text-awwwards-text rounded-xl focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="w-full md:w-64">
              <select
                value={filterGodown}
                onChange={(e) => setFilterGodown(e.target.value)}
                className="px-4 py-3 w-full bg-gray-50 dark:bg-gray-900 border border-awwwards-border text-awwwards-text rounded-xl focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all appearance-none"
              >
                <option value="">All Godowns</option>
                {state.godowns.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-awwwards-border">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-awwwards-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-awwwards-textMuted font-bold">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-awwwards-textMuted font-bold">
                    No products found.
                  </td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-bold text-awwwards-text">{product.name}</div>
                      <div className="text-sm font-medium text-awwwards-textMuted">{product.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-awwwards-text">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-awwwards-textMuted">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-awwwards-text">{product.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-awwwards-text">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                      product.quantity <= 0 ? 'bg-red-100 text-red-700' :
                      product.quantity <= product.minStock ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {product.quantity <= 0 ? 'Out of Stock' :
                       product.quantity <= product.minStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 bg-indigo-50 text-awwwards-primary rounded-lg hover:bg-indigo-100 mr-2 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-awwwards-border flex items-center justify-between bg-gray-50/30">
          <div className="text-sm text-awwwards-textMuted font-medium">
            Showing <span className="font-bold text-awwwards-text">{products.length}</span> of <span className="font-bold text-awwwards-text">{totalItems}</span> products
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg border border-awwwards-border bg-white text-awwwards-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="py-2 px-4 rounded-lg bg-indigo-50 text-awwwards-primary font-bold text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 rounded-lg border border-awwwards-border bg-white text-awwwards-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </motion.div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-xl border border-awwwards-border rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <h2 className="text-2xl font-extrabold text-awwwards-text mb-6 tracking-tight">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Barcode</label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="flex-1 w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={generateNewBarcode}
                    className="px-5 py-3 bg-gray-100 text-awwwards-textMuted font-bold rounded-xl hover:bg-gray-200 transition-colors shrink-0"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  />
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Godown</label>
                    <select
                      onChange={(e) => setFormData({ ...formData, godownId: e.target.value } as any)}
                      className="w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select Initial Godown</option>
                      {state.godowns.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Min Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                    className="w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Max Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.maxStock}
                    onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) })}
                    className="w-full bg-white border border-awwwards-border text-awwwards-text rounded-xl px-4 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-awwwards-border">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 bg-gray-100 text-awwwards-textMuted font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-awwwards-primary text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(99,102,241,0.4)] hover:bg-indigo-600 transition-all transform hover:-translate-y-0.5"
                >
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Products;