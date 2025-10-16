import React, { useState, useEffect } from 'react';
import { StatsCard } from './StatsCard';
import { InventoryChart } from './InventoryChart';
import { RecentOrders } from './RecentOrders';
import { LowStockAlerts } from './LowStockAlerts';
import { Package2, AlertTriangle, ShoppingCart, DollarSign } from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    ordersToday: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch dashboard stats');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statsData = [
    {
      title: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      change: '',
      changeType: 'positive' as const,
      icon: Package2,
      color: 'blue' as const
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockCount.toLocaleString(),
      change: '',
      changeType: 'negative' as const,
      icon: AlertTriangle,
      color: 'red' as const
    },
    {
      title: 'Orders Today',
      value: stats.ordersToday.toLocaleString(),
      change: '',
      changeType: 'positive' as const,
      icon: ShoppingCart,
      color: 'green' as const
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: '',
      changeType: 'positive' as const,
      icon: DollarSign,
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