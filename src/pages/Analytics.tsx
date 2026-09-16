import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DollarSign, Package, TrendingDown, AlertTriangle, ArrowRight, Activity, Users, Truck, Briefcase, ChevronRight, Clock, Target, TrendingUp } from 'lucide-react';
import { formatCurrency, exportToCSV } from '../utils/helpers';
import { api } from '../utils/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics/${activeTab}`);
        setData(res);
      } catch (e) {
        console.error('Failed to fetch', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <Activity size={18} /> },
    { id: 'financial', name: 'Financials', icon: <DollarSign size={18} /> },
    { id: 'supply-chain', name: 'Supply Chain', icon: <Truck size={18} /> },
    { id: 'operations', name: 'Operations', icon: <Briefcase size={18} /> },
    { id: 'staff', name: 'Staff & Productivity', icon: <Users size={18} /> },
  ];

  return (
    <div className="flex h-[calc(100vh-6rem)] -m-6">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col space-y-2 overflow-y-auto">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Dashboards</h2>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-50 text-blue-700 font-bold' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
            }`}
          >
            {tab.icon}
            <span>{tab.name}</span>
            {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50/50 p-8 overflow-y-auto custom-scrollbar">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 capitalize">{activeTab.replace('-', ' ')} Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Advanced reporting and insights for enterprise scale.</p>
        </div>

        {loading || !data ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'financial' && <FinancialsTab data={data} />}
            {activeTab === 'supply-chain' && <SupplyChainTab data={data} />}
            {activeTab === 'operations' && <OperationsTab data={data} />}
            {activeTab === 'staff' && <StaffTab data={data} />}
          </div>
        )}
      </div>
    </div>
  );
}

const OverviewTab = ({ data }: { data: any }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KPICard title="Total Capital" value={formatCurrency(data.totalValue)} icon={<DollarSign/>} color="blue" />
      <KPICard title="Total SKUs" value={data.totalProducts} icon={<Package/>} color="green" />
      <KPICard title="Low Stock" value={data.lowStockCount} icon={<TrendingDown/>} color="orange" />
      <KPICard title="Dead Stock" value={data.deadStockCount} icon={<AlertTriangle/>} color="red" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-6">Capital by Godown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data.godownValueDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
              {data.godownValueDistribution.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-6">Category Valuation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.categoryChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </>
);

const FinancialsTab = ({ data }: { data: any }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KPICard title="Gross Margin (30d)" value={formatCurrency(data.grossMargin)} icon={<TrendingUp/>} color="green" />
      <KPICard title="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={<DollarSign/>} color="blue" />
      <KPICard title="COGS" value={formatCurrency(data.totalCogs)} icon={<Package/>} color="purple" />
      <KPICard title="Dead Stock Penalty" value={formatCurrency(data.deadStockCost)} icon={<AlertTriangle/>} color="red" subtitle="5% Holding Cost" />
    </div>

    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold mb-6">30-Day Margin Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data.marginTrends}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Area type="monotone" dataKey="margin" stroke="#10B981" fill="#D1FAE5" />
        </AreaChart>
      </ResponsiveContainer>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4">Top Profitable SKUs</h3>
        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
          {data.topProfitableSKUs.map((sku: any, i: number) => (
            <div key={sku.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
              <div>
                <p className="font-bold text-gray-900">{sku.name}</p>
                <p className="text-xs text-gray-500">{sku.category}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">+{formatCurrency(sku.margin)}</p>
                <p className="text-xs text-gray-500">{sku.quantity} sold</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-6">Revenue by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data.revenueByCategory} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value">
              {data.revenueByCategory.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </>
);

const SupplyChainTab = ({ data }: { data: any }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <KPICard title="Overstocked Items (>180d coverage)" value={data.overstockCount} icon={<Package/>} color="orange" />
      <KPICard title="Total Shrinkage/Adjustments" value={data.totalAdjustments} icon={<AlertTriangle/>} color="red" subtitle="Units lost/damaged" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Restock Recommendations</h3>
        <p className="text-sm text-gray-500 mb-4">Items predicted to run out in &lt;7 days based on current velocity.</p>
        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {data.restockRecommendations.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
              <div>
                <p className="font-bold text-gray-900">{item.name}</p>
                <p className="text-xs text-red-500 font-semibold">{item.daysRemaining} days remaining</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{item.currentStock} units left</p>
                <p className="text-xs text-gray-500">{item.dailyVelocity} sales/day</p>
              </div>
            </div>
          ))}
          {data.restockRecommendations.length === 0 && <p className="text-gray-500 text-sm">No immediate restocks needed.</p>}
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Frequent Stockouts (Past Year)</h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {data.frequentStockouts.map((item: any, i: number) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center font-bold">{i+1}</div>
                 <p className="font-bold text-gray-900">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600">{item.count} stockouts</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

const OperationsTab = ({ data }: { data: any }) => (
  <>
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h3 className="text-lg font-bold mb-6">Peak Operational Hours</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data.peakHours}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="hour" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Movements" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-6">Godown Storage Utilization</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.storageUtilization} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
            <Tooltip />
            <Bar dataKey="totalUnits" fill="#3B82F6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-6">Inbound vs Outbound per Godown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.ioRatio}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="godownName" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="inbound" fill="#10B981" name="IN" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outbound" fill="#EF4444" name="OUT" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </>
);

const StaffTab = ({ data }: { data: any }) => (
  <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2">
        <h3 className="text-lg font-bold mb-4">Staff Productivity Leaderboard</h3>
        <div className="space-y-4 custom-scrollbar max-h-[300px] overflow-y-auto">
          {data.leaderboard.map((user: any, i: number) => (
            <div key={user.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">{i+1}</div>
                 <div>
                   <p className="font-bold text-gray-900">{user.name}</p>
                   <p className="text-xs text-gray-500 font-semibold">{user.role}</p>
                 </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{user.movementsCount}</p>
                <p className="text-xs text-gray-500">Total operations</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-6">Operations by Role</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={data.roleProductivity} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
              {data.roleProductivity.map((e: any, i: number) => <Cell key={i} fill={i===0?'#3B82F6':'#F59E0B'} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold mb-6">Global Movement Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.movementBreakdown} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
          <Tooltip />
          <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </>
);

const KPICard = ({ title, value, icon, color, subtitle }: any) => {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50', green: 'bg-green-50', orange: 'bg-orange-50', red: 'bg-red-50', purple: 'bg-purple-50'
  };
  const textColors: Record<string, string> = {
    blue: 'text-blue-600', green: 'text-green-600', orange: 'text-orange-500', red: 'text-red-500', purple: 'text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transform transition hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${textColors[color]}`}>{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${bgColors[color]} p-3 rounded-lg ${textColors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};