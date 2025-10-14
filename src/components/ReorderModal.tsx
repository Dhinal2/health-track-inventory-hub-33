
import React, { useState } from 'react';
import { X, Package, Calendar, Truck } from 'lucide-react';
import { InventoryItem } from '../pages/Inventory';

interface ReorderModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'staff';
}

export const ReorderModal: React.FC<ReorderModalProps> = ({
  item,
  isOpen,
  onClose,
  userRole
}) => {
  const [quantity, setQuantity] = useState(0);

  React.useEffect(() => {
    if (item) {
      // Set default quantity to bring stock up to reorder threshold + buffer
      const recommendedQuantity = Math.max(0, item.reorderThreshold - item.stockQuantity + 50);
      setQuantity(recommendedQuantity);
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally send the reorder request to the server
    console.log('Reorder request:', { item: item?.id, quantity });
    onClose();
  };

  if (!isOpen || !item) return null;

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7); // Assume 7 days delivery

  const totalCost = quantity * item.unitPrice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Reorder Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{item.name}</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current Stock:</span>
                <p className="font-medium text-red-600">{item.stockQuantity}</p>
              </div>
              <div>
                <span className="text-gray-500">Reorder Threshold:</span>
                <p className="font-medium">{item.reorderThreshold}</p>
              </div>
              <div>
                <span className="text-gray-500">Unit Price:</span>
                <p className="font-medium">${item.unitPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to Order *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: {Math.max(0, item.reorderThreshold - item.stockQuantity + 50)} units
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-gray-600">Estimated Delivery:</span>
              <span className="ml-auto font-medium">{estimatedDelivery.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-sm">
              <Truck className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-gray-600">Total Cost:</span>
              <span className="ml-auto font-medium">${totalCost.toFixed(2)}</span>
            </div>
          </div>

          {userRole === 'staff' && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                This reorder request will be sent to the administrator for approval.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {userRole === 'admin' ? 'Place Order' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
