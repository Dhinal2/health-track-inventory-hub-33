import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, ShoppingCart } from 'lucide-react';
import { InventoryItem } from '../pages/Inventory';

interface InventoryTableProps {
  items: InventoryItem[];
  userRole: 'admin' | 'staff';
  onReorder: (item: InventoryItem) => void;
  onConfigure: (item: InventoryItem) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  userRole,
  onReorder,
  onConfigure,
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white rounded-xl shadow-sm border">
        <p>No inventory items found.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
            {userRole === 'admin' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Threshold</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto-Reorder</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.InventoryID} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">{item.Name}</td>
              {userRole === 'admin' && <td className="px-6 py-4">{item.Owner}</td>}
              <td className="px-6 py-4">
                <Badge variant={item.StockQuantity < item.ReorderThreshold ? 'destructive' : 'secondary'}>
                  {item.StockQuantity} units
                </Badge>
              </td>
              <td className="px-6 py-4">{item.ReorderThreshold}</td>
              <td className="px-6 py-4">
                <Badge variant={item.AutoReorder ? 'default' : 'secondary'}>
                  {item.AutoReorder ? 'Enabled' : 'Disabled'}
                </Badge>
              </td>
              <td className="px-6 py-4 text-right">
                {userRole === 'staff' && (
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onConfigure(item)}>
                      <Settings className="w-4 h-4 mr-2" /> Configure
                    </Button>
                    <Button size="sm" onClick={() => onReorder(item)}>
                      <ShoppingCart className="w-4 h-4 mr-2" /> Reorder
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};