
import React from 'react';
import { Edit, AlertTriangle, Calendar, RotateCcw, Settings } from 'lucide-react';
import { InventoryItem } from '../pages/Inventory';

interface InventoryTableProps {
  items: InventoryItem[];
  userRole: 'admin' | 'staff';
  onEdit: (item: InventoryItem) => void;
  onReorder: (item: InventoryItem) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ items, userRole, onEdit, onReorder }) => {
  const isLowStock = (item: InventoryItem) => item.stockQuantity < item.reorderThreshold;
  
  const isExpiringSoon = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry >= now;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              {userRole === 'admin' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto Reorder</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr 
                key={item.id} 
                className={`hover:bg-gray-50 ${isLowStock(item) ? 'bg-red-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {item.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {item.name}
                        {isLowStock(item) && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      <div className="text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${
                      isLowStock(item) ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {item.stockQuantity}
                    </span>
                    <span className="text-xs text-gray-500">
                      Reorder: {item.reorderThreshold}
                    </span>
                    {isLowStock(item) && (
                      <span className="text-xs text-red-600 font-medium">
                        Low Stock!
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div className="flex flex-col">
                      <span className={`text-sm ${
                        isExpired(item.expiryDate) ? 'text-red-600 font-medium' :
                        isExpiringSoon(item.expiryDate) ? 'text-orange-600 font-medium' :
                        'text-gray-900'
                      }`}>
                        {formatDate(item.expiryDate)}
                      </span>
                      {isExpired(item.expiryDate) && (
                        <span className="text-xs text-red-600">Expired</span>
                      )}
                      {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && (
                        <span className="text-xs text-orange-600">Expiring Soon</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.supplier}</div>
                  <div className="text-xs text-gray-500">Batch: {item.batchNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">${item.unitPrice.toFixed(2)}</div>
                </td>
                {userRole === 'admin' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.autoReorder ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.autoReorder ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {userRole === 'admin' ? (
                      <button 
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configure</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => onReorder(item)}
                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reorder</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No inventory items found</div>
        </div>
      )}
    </div>
  );
};
