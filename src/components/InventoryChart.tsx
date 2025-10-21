import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'; // Import icons for change

interface ChartData {
  day: string;
  usage: number;
}

interface InventoryChartProps {
  data: ChartData[];
  usageChange: string; // Expect the calculated change string e.g., "+8.2%"
  usageChangeType: 'positive' | 'negative' | 'neutral'; // Expect the type
}

export const InventoryChart: React.FC<InventoryChartProps> = ({
    data = [],
    usageChange = "0.0%", // Default value
    usageChangeType = 'neutral' // Default value
 }) => {
  // Safely calculate total usage and find the maximum usage for scaling the bars
  const totalUsage = data.reduce((sum, item) => sum + (Number(item.usage) || 0), 0);
  const maxUsage = Math.max(...data.map(item => Number(item.usage) || 0), 1); // Use 1 as a minimum

  // Choose icon and color based on change type
  const ChangeIcon = usageChangeType === 'positive' ? TrendingUp : usageChangeType === 'negative' ? TrendingDown : Minus;
  const changeColor = usageChangeType === 'positive' ? 'text-green-600' : usageChangeType === 'negative' ? 'text-red-600' : 'text-gray-600';


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Weekly Stock Usage</CardTitle>
            <CardDescription>Inventory consumption trends</CardDescription>
          </div>
           {/* Display dynamic change */}
          <div className={`flex items-center space-x-1 ${changeColor}`}>
            <ChangeIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{usageChange}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="text-xs font-medium text-gray-600 w-8">{item.day}</span>
              <div className="flex-1 flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((Number(item.usage) || 0) / maxUsage) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-900 w-8 text-right">{item.usage}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Usage This Week</span>
            <span className="font-semibold text-gray-900">{totalUsage} items</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};