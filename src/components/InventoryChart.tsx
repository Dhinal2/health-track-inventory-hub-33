
import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

export const InventoryChart: React.FC = () => {
  // Mock data for the chart
  const chartData = [
    { day: 'Mon', usage: 65, stock: 320 },
    { day: 'Tue', usage: 78, stock: 285 },
    { day: 'Wed', usage: 52, stock: 310 },
    { day: 'Thu', usage: 91, stock: 275 },
    { day: 'Fri', usage: 67, stock: 295 },
    { day: 'Sat', usage: 43, stock: 315 },
    { day: 'Sun', usage: 38, stock: 325 }
  ];

  const maxUsage = Math.max(...chartData.map(d => d.usage));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Weekly Stock Usage</h3>
          <p className="text-sm text-gray-600">Inventory consumption trends</p>
        </div>
        <div className="flex items-center space-x-2 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+8.2%</span>
        </div>
      </div>

      <div className="space-y-4">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <span className="text-xs font-medium text-gray-600 w-8">{item.day}</span>
            <div className="flex-1 flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(item.usage / maxUsage) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-900 w-8">{item.usage}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Usage This Week</span>
          <span className="font-semibold text-gray-900">434 items</span>
        </div>
      </div>
    </div>
  );
};
