import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { AppState } from '../types';
import { TrendingUp, Users, Warehouse, Package, DollarSign, Wallet } from 'lucide-react';

interface DashboardProps {
  state: AppState;
}

export const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const totalSales = state.sales.reduce((sum, s) => sum + s.total, 0);
  const totalReceived = state.receivables.reduce((sum, r) => sum + r.amount, 0);
  const totalFarms = state.farms.length;
  const totalCustomers = state.customers.length;
  
  const totalChickensInitial = state.farms.reduce((sum, f) => sum + f.initialStock, 0);
  const totalChickensSold = state.sales.reduce((sum, s) => sum + s.chickens, 0);
  const chickensLeft = totalChickensInitial - totalChickensSold;

  // Prepare Chart Data
  const monthlyData: Record<string, { name: string; Sales: number; Received: number }> = {};
  
  state.sales.forEach(s => {
    const month = s.date.slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) monthlyData[month] = { name: month, Sales: 0, Received: 0 };
    monthlyData[month].Sales += s.total;
  });
  
  state.receivables.forEach(r => {
    const month = r.date.slice(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { name: month, Sales: 0, Received: 0 };
    monthlyData[month].Received += r.amount;
  });

  const barChartData = Object.values(monthlyData).sort((a, b) => a.name.localeCompare(b.name));

  const farmStockData = state.farms.map(f => {
    const sold = state.sales.filter(s => s.farmId === f.id).reduce((sum, s) => sum + s.chickens, 0);
    return { name: f.name, value: Math.max(0, f.initialStock - sold) };
  }).filter(d => d.value > 0);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color} text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Sales" 
          value={`$${totalSales.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Total Received" 
          value={`$${totalReceived.toLocaleString()}`} 
          icon={<Wallet size={24} />} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Outstanding" 
          value={`$${(totalSales - totalReceived).toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          color="bg-red-500" 
        />
        <StatCard 
          title="Active Farms" 
          value={totalFarms} 
          icon={<Warehouse size={24} />} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Customers" 
          value={totalCustomers} 
          icon={<Users size={24} />} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Stock Available" 
          value={chickensLeft.toLocaleString()} 
          icon={<Package size={24} />} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Financial Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                <YAxis fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="Sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Received" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Live Stock Distribution</h3>
          <div className="h-80">
            {farmStockData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={farmStockData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {farmStockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No stock data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
