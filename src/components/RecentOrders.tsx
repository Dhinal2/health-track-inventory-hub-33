
import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const RecentOrders: React.FC = () => {
  const recentOrders = [
    {
      id: 'ORD-2024-001',
      supplier: 'MedSupply Co.',
      items: 15,
      amount: '$2,450.00',
      status: 'pending',
      date: '2024-01-15'
    },
    {
      id: 'ORD-2024-002',
      supplier: 'Healthcare Plus',
      items: 8,
      amount: '$1,230.00',
      status: 'fulfilled',
      date: '2024-01-14'
    },
    {
      id: 'ORD-2024-003',
      supplier: 'Medical Depot',
      items: 22,
      amount: '$3,890.00',
      status: 'pending',
      date: '2024-01-13'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'fulfilled':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'fulfilled':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {recentOrders.map((order) => (
          <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              {getStatusIcon(order.status)}
              <div>
                <p className="font-medium text-gray-900">{order.id}</p>
                <p className="text-sm text-gray-600">{order.supplier}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">{order.amount}</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
