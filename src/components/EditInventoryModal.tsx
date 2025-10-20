import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { InventoryItem } from '../pages/Inventory';

interface EditInventoryModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave
}) => {
  // The state correctly uses PascalCase to match the InventoryItem type
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    Name: '',
    StockQuantity: 0,
    ReorderThreshold: 0,
    AutoReorder: false
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        Name: '',
        StockQuantity: 0,
        ReorderThreshold: 0,
        AutoReorder: false
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- THIS IS THE FIX ---
    // We now construct a complete InventoryItem object by spreading the original item's properties
    // and then overwriting them with the updated form data.
    const itemToSave: InventoryItem = {
      ...(item!), // Copies all original properties like id, ProductID, Price, etc.
      Name: formData.Name || '',
      StockQuantity: formData.StockQuantity || 0,
      ReorderThreshold: formData.ReorderThreshold || 0,
      AutoReorder: formData.AutoReorder || false,
      // Ensure lowercase versions are also present if the type requires them
      id: item?.id || 0,
      name: formData.Name || '',
    };
    
    onSave(itemToSave);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : name === 'StockQuantity' || name === 'ReorderThreshold'
        ? parseFloat(value) || 0 
        : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {item ? 'Configure Inventory Item' : 'Add New Inventory Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="Name"
                value={formData.Name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock Quantity *
              </label>
              <input
                type="number"
                name="StockQuantity"
                value={formData.StockQuantity}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Threshold *
              </label>
              <input
                type="number"
                name="ReorderThreshold"
                value={formData.ReorderThreshold}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="AutoReorder"
                checked={formData.AutoReorder}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Enable Auto Reorder
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{item ? 'Update' : 'Add'} Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};