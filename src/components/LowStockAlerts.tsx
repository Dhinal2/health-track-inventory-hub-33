
import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';

export const LowStockAlerts: React.FC = () => {
  const lowStockItems = [
    {
      name: 'Surgical Masks',
      currentStock: 45,
      threshold: 100,
      category: 'PPE',
      urgency: 'high'
    },
    {
      name: 'Antibiotics - Amoxicillin',
      currentStock: 23,
      threshold: 50,
      category: 'Medication',
      urgency: 'critical'
    },
    {
      name: 'IV Bags (500ml)',
      currentStock: 78,
      threshold: 150,
      category: 'Supplies',
      urgency: 'medium'
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
        </div>
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
          {lowStockItems.length} items
        </span>
      </div>

      <div className="space-y-3">
        {lowStockItems.map((item, index) => (
          <div key={index} className={`p-3 rounded-lg border-l-4 ${getUrgencyColor(item.urgency)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {item.currentStock} / {item.threshold}
                </p>
                <p className="text-xs text-gray-500">Current / Threshold</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
        Reorder All Critical Items
      </button>
    </div>
  );
};
