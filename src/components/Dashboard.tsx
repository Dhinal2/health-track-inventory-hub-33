
import React from 'react';
import { StatsCard } from './StatsCard';
import { InventoryChart } from './InventoryChart';
import { RecentOrders } from './RecentOrders';
import { LowStockAlerts } from './LowStockAlerts';
import { Package2, AlertTriangle, ShoppingCart, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  const statsData = [
    {
      title: 'Total Products',
      value: '1,234',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Package2,
      color: 'blue' as const
    },
    {
      title: 'Low Stock Items',
      value: '23',
      change: '+5%',
      changeType: 'negative' as const,
      icon: AlertTriangle,
      color: 'red' as const
    },
    {
      title: 'Orders Today',
      value: '87',
      change: '+8%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
      color: 'green' as const
    },
    {
      title: 'Savings This Month',
      value: '$45,678',
      change: '+15%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'purple' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryChart />
        <RecentOrders />
      </div>

      {/* Low Stock Alerts */}
      <LowStockAlerts />
    </div>
  );
};
