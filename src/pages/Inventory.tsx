import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { InventoryTable } from '../components/InventoryTable';
import { InventoryFilters } from '../components/InventoryFilters';
import { EditInventoryModal } from '../components/EditInventoryModal';
import { ReorderModal } from '../components/ReorderModal';
import { Plus, Download } from 'lucide-react';

export interface InventoryItem {
  id: number;
  name: string;
  stockQuantity: number;
  reorderThreshold: number;
  unitPrice: number;
  autoReorder?: boolean;
}

const Inventory = () => {
  const [user, setUser] = useState<{name: string, role: 'admin' | 'staff'} | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: parsedUser.name || parsedUser.email?.split('@')[0] || 'User',
        role: parsedUser.role || 'staff'
      });
    }
  }, []);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: 1,
      name: 'Surgical Masks',
      stockQuantity: 45,
      reorderThreshold: 100,
      unitPrice: 0.85,
      autoReorder: true
    },
    {
      id: 2,
      name: 'Antibiotics - Amoxicillin',
      stockQuantity: 23,
      reorderThreshold: 50,
      unitPrice: 12.50,
      autoReorder: false
    },
    {
      id: 3,
      name: 'IV Bags (500ml)',
      stockQuantity: 78,
      reorderThreshold: 150,
      unitPrice: 3.75,
      autoReorder: true
    },
    {
      id: 4,
      name: 'Latex Gloves (Box)',
      stockQuantity: 12,
      reorderThreshold: 25,
      unitPrice: 15.99,
      autoReorder: false
    },
    {
      id: 5,
      name: 'Insulin Syringes',
      stockQuantity: 156,
      reorderThreshold: 100,
      unitPrice: 0.45,
      autoReorder: true
    }
  ]);

  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(inventoryItems);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  const handleEdit = (item: InventoryItem) => {
    if (user?.role === 'admin') {
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };

  const handleReorder = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsReorderModalOpen(true);
  };

  const handleSave = (updatedItem: InventoryItem) => {
    setInventoryItems(prev => 
      prev.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
    setFilteredItems(prev => 
      prev.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleAddNew = () => {
    if (user?.role === 'admin') {
      setSelectedItem(null);
      setIsModalOpen(true);
    }
  };

  const handleFilter = (filters: any) => {
    let filtered = [...inventoryItems];

    if (filters.stockLevel && filters.stockLevel !== 'all') {
      if (filters.stockLevel === 'low') {
        filtered = filtered.filter(item => item.stockQuantity < item.reorderThreshold);
      } else if (filters.stockLevel === 'normal') {
        filtered = filtered.filter(item => item.stockQuantity >= item.reorderThreshold);
      }
    }

    if (filters.search) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <div className="flex items-center space-x-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            {user?.role === 'admin' && (
              <button 
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            )}
          </div>
        </div>

        <InventoryFilters onFilter={handleFilter} />
        
        <InventoryTable 
          items={filteredItems}
          userRole={user.role}
          onEdit={handleEdit}
          onReorder={handleReorder}
        />

        {isModalOpen && user?.role === 'admin' && (
          <EditInventoryModal
            item={selectedItem}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
          />
        )}

        {isReorderModalOpen && (
          <ReorderModal
            item={selectedItem}
            isOpen={isReorderModalOpen}
            onClose={() => setIsReorderModalOpen(false)}
            userRole={user.role}
          />
        )}
      </div>
    </Layout>
  );
};

export default Inventory;
