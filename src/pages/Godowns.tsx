import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import { useInventoryOperations } from '../hooks/useInventoryOperations';
import { Plus, MapPin, Package } from 'lucide-react';

const Godowns: React.FC = () => {
  const { state } = useInventory();
  const { addGodown } = useInventoryOperations();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '', capacity: 10000 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addGodown(formData);
    setShowModal(false);
    setFormData({ name: '', location: '', capacity: 10000 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Godowns</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage physical storage locations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
        >
          <Plus size={20} />
          <span className="font-semibold">Add Godown</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.godowns.map((godown) => {
          const totalItems = godown.stocks?.reduce((acc, s) => acc + s.quantity, 0) || 0;
          const capacity = godown.capacity || 10000;
          const usagePercent = Math.min((totalItems / capacity) * 100, 100);
          
          let progressColor = 'bg-blue-500';
          if (usagePercent > 90) progressColor = 'bg-red-500';
          else if (usagePercent > 75) progressColor = 'bg-orange-500';

          return (
            <motion.div
              key={godown.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <MapPin size={24} />
                </div>
                <span className="text-sm font-medium bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">
                  {totalItems} items
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{godown.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center mb-6">
                <MapPin size={14} className="mr-1" /> {godown.location}
              </p>

              {/* Capacity Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-500">Capacity Usage</span>
                  <span className={usagePercent > 90 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}>
                    {usagePercent.toFixed(1)}% ({totalItems} / {capacity})
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${progressColor} transition-all duration-500 ease-out`} 
                    style={{ width: `${usagePercent}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add New Godown</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Godown Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Main Warehouse"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location Address</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Sector 12, New Delhi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maximum Capacity (Units)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="10000"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/30 transition-all"
                >
                  Create Godown
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Godowns;
