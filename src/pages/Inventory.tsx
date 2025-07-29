import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { InventoryTable } from '../components/InventoryTable';
import { InventoryFilters } from '../components/InventoryFilters';
import { EditInventoryModal } from '../components/EditInventoryModal';
import { ReorderModal } from '../components/ReorderModal';
import { Plus, Download } from 'lucide-react';

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  stockQuantity: number;
  reorderThreshold: number;
  expiryDate: string;
  supplier: string;
  unitPrice: number;
  batchNumber: string;
  autoReorder?: boolean;
}

const Inventory = () => {
  const [user] = useState({
    name: 'Dr. Sarah Johnson',
    role: 'admin' as const
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: 1,
      name: 'Surgical Masks',
      sku: 'SM-001',
      category: 'PPE',
      stockQuantity: 45,
      reorderThreshold: 100,
      expiryDate: '2025-12-31',
      supplier: 'MedSupply Co.',
      unitPrice: 0.85,
      batchNumber: 'SM001-2024',
      autoReorder: true
    },
    {
      id: 2,
      name: 'Antibiotics - Amoxicillin',
      sku: 'AB-005',
      category: 'Medication',
      stockQuantity: 23,
      reorderThreshold: 50,
      expiryDate: '2024-08-15',
      supplier: 'Pharma Direct',
      unitPrice: 12.50,
      batchNumber: 'AMX240815',
      autoReorder: false
    },
    {
      id: 3,
      name: 'IV Bags (500ml)',
      sku: 'IV-500',
      category: 'Supplies',
      stockQuantity: 78,
      reorderThreshold: 150,
      expiryDate: '2026-03-20',
      supplier: 'Healthcare Plus',
      unitPrice: 3.75,
      batchNumber: 'IV500-2024',
      autoReorder: true
    },
    {
      id: 4,
      name: 'Latex Gloves (Box)',
      sku: 'LG-100',
      category: 'PPE',
      stockQuantity: 12,
      reorderThreshold: 25,
      expiryDate: '2025-06-30',
      supplier: 'MedSupply Co.',
      unitPrice: 15.99,
      batchNumber: 'LG100-2024',
      autoReorder: false
    },
    {
      id: 5,
      name: 'Insulin Syringes',
      sku: 'IS-050',
      category: 'Medical Device',
      stockQuantity: 156,
      reorderThreshold: 100,
      expiryDate: '2027-01-15',
      supplier: 'MedDevice Corp',
      unitPrice: 0.45,
      batchNumber: 'IS050-2024',
      autoReorder: true
    }
  ]);

  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(inventoryItems);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  const handleEdit = (item: InventoryItem) => {
    if (user.role === 'admin') {
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
    if (user.role === 'admin') {
      setSelectedItem(null);
      setIsModalOpen(true);
    }
  };

  const handleFilter = (filters: any) => {
    let filtered = [...inventoryItems];

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.stockLevel && filters.stockLevel !== 'all') {
      if (filters.stockLevel === 'low') {
        filtered = filtered.filter(item => item.stockQuantity < item.reorderThreshold);
      } else if (filters.stockLevel === 'normal') {
        filtered = filtered.filter(item => item.stockQuantity >= item.reorderThreshold);
      }
    }

    if (filters.expiry && filters.expiry !== 'all') {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      if (filters.expiry === 'expired') {
        filtered = filtered.filter(item => new Date(item.expiryDate) < now);
      } else if (filters.expiry === 'expiring-soon') {
        filtered = filtered.filter(item => {
          const expiryDate = new Date(item.expiryDate);
          return expiryDate >= now && expiryDate <= thirtyDaysFromNow;
        });
      } else if (filters.expiry === 'expiring-3months') {
        filtered = filtered.filter(item => {
          const expiryDate = new Date(item.expiryDate);
          return expiryDate >= now && expiryDate <= ninetyDaysFromNow;
        });
      }
    }

    if (filters.search) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.supplier.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

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
            {user.role === 'admin' && (
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

        {isModalOpen && user.role === 'admin' && (
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
