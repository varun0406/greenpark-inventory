import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import { Package, AlertTriangle, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../utils/helpers';
import { api } from '../utils/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const Dashboard: React.FC = () => {
  const { state } = useInventory();
  
  const [statsData, setStatsData] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    unreadAlerts: 0,
    categoryData: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStatsData(res);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-awwwards-primary animate-spin" />
      </div>
    );
  }

  const categoryData = statsData.categoryData || {};

  const chartData = Object.entries(categoryData).map(([category, quantity]) => ({
    category,
    quantity,
  }));

  const pieData = Object.entries(categoryData).map(([category, quantity]) => ({
    name: category,
    value: quantity,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const stats = [
    {
      title: 'Total Products',
      value: statsData.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Low Stock Items',
      value: statsData.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(statsData.totalValue),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Unread Alerts',
      value: statsData.unreadAlerts,
      icon: TrendingUp,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold text-awwwards-text tracking-tight">Dashboard</h1>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} variants={itemVariants} className="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-[0.03] rounded-bl-full -mr-4 -mt-4`}></div>
            <div className="flex items-center">
              <div className={`${stat.color} p-4 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] text-white`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-semibold text-awwwards-textMuted uppercase tracking-wide">{stat.title}</p>
                <p className="text-3xl font-extrabold text-awwwards-text mt-1">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <h2 className="text-lg font-bold text-awwwards-text mb-6">Stock by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#111827', fontWeight: 'bold' }}
              />
              <Bar dataKey="quantity" fill="url(#colorUv)" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <h2 className="text-lg font-bold text-awwwards-text mb-6">Category Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#111827', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 24 }}
        className="glass-panel rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-awwwards-border">
          <h2 className="text-lg font-bold text-awwwards-text">Recent Stock Movements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-awwwards-border">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-awwwards-textMuted uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-awwwards-border">
              {state.stockMovements.slice(-5).reverse().map((movement: any) => {
                const productName = movement.product?.name || state.products.find(p => p.id === movement.productId)?.name || 'Unknown Product';
                return (
                  <tr key={movement.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-awwwards-text">
                      {productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                        movement.type === 'IN' ? 'bg-green-100 text-green-700' :
                        movement.type === 'OUT' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {movement.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-awwwards-text">
                      {movement.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-awwwards-textMuted">
                      {new Date(movement.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;