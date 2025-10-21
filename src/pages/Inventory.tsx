import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { InventoryTable } from '../components/InventoryTable';
import { InventoryFilters } from '../components/InventoryFilters';
import { ReorderModal } from '../components/ReorderModal';
import { ConfigurationModal } from '../components/ConfigurationModal';
import { Button } from '@/components/ui/button';
import { Download, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UseInventoryModal } from '@/components/UseInventoryModal';

// This is the single source of truth for the InventoryItem type
export interface InventoryItem {
  InventoryID: number;
  ProductID: number;
  Price: number;
  Name: string;
  Owner?: string;
  StockQuantity: number;
  ReorderThreshold: number;
  AutoReorder: boolean;
  id: number; // For compatibility
  name: string; // For compatibility
}

const Inventory = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: number; name: string; role: 'admin' | 'staff'; rawRole: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.UserID) {
          const mappedRole: 'admin' | 'staff' = parsedUser.Role === 'Administrator' ? 'admin' : 'staff';
          const currentUser = {
            id: parsedUser.UserID,
            name: parsedUser.Name,
            role: mappedRole,
            rawRole: parsedUser.Role
          };
          setUser(currentUser);
          fetchInventory(currentUser.id, currentUser.rawRole);
        } else {
          setIsLoading(false);
          navigate('/login');
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
        setIsLoading(false);
        navigate('/login');
      }
    } else {
      setIsLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  const fetchInventory = async (userId: number, userRole: string) => {
    setIsLoading(true);
    try {
      // --- FIX: Use the relative proxy URL ---
      const response = await fetch('/api/inventory/user-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userRole })
      });
      if (response.ok) {
        const data = await response.json();
        const mappedData = data.map((item: any) => ({ ...item, id: item.InventoryID, name: item.Name }));
        setInventoryItems(mappedData);
        setFilteredItems(mappedData);
      } else {
        setInventoryItems([]);
        setFilteredItems([]);
      }
    } catch (error) {
      toast({ title: 'Network Error', description: 'Could not connect to the server.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = (item: InventoryItem) => {
    if (user?.role === 'staff') {
      setSelectedItem(item);
      setIsReorderModalOpen(true);
    }
  };
  
  const handleConfigure = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsConfigModalOpen(true);
  };

  const handleConfigSave = async (updatedItem: InventoryItem) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/inventory/${updatedItem.InventoryID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ReorderThreshold: updatedItem.ReorderThreshold,
          AutoReorder: updatedItem.AutoReorder,
          UserID: user.id
        })
      });
      if (response.ok) {
        toast({ title: 'Configuration updated successfully' });
        fetchInventory(user.id, user.rawRole);
      } else { throw new Error('Failed to save configuration'); }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not save configuration.', variant: 'destructive' });
    } finally {
      setIsConfigModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleFilter = (filters: any) => {
    let filtered = [...inventoryItems];
    if (filters.stockLevel && filters.stockLevel !== 'all') {
      filtered = filtered.filter(item => (filters.stockLevel === 'low' ? item.StockQuantity < item.ReorderThreshold : item.StockQuantity >= item.ReorderThreshold));
    }
    if (filters.search) {
      filtered = filtered.filter(item => item.Name.toLowerCase().includes(filters.search.toLowerCase()));
    }
    setFilteredItems(filtered);
  };
  
  const handleReorderSubmit = async (item: InventoryItem, quantity: number) => {
    if (!user) return;
    const orderData = {
      userId: user.id,
      items: [{ ProductID: item.ProductID, Quantity: quantity, UnitPrice: item.Price || 0 }],
      totalAmount: quantity * (item.Price || 0)
    };
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (response.ok) {
        toast({ title: "Reorder Request Submitted" });
      } else { throw new Error('Failed to create reorder request'); }
    } catch (error) {
      toast({ title: "Error", description: "Could not submit reorder request.", variant: "destructive" });
    } finally {
      setIsReorderModalOpen(false);
    }
  };

  const handleConfirmUse = (inventoryId: number, quantityUsed: number) => {
    if (!user) return;

    fetch('/api/inventory/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventoryId, quantityUsed, userId: user.id }),
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Success", description: "Inventory stock has been updated." });
        // --- FIX: Use the correct state variable 'inventoryItems' ---
        const updatedInventory = inventoryItems.map(item => 
          item.InventoryID === inventoryId 
            ? { ...item, StockQuantity: item.StockQuantity - quantityUsed }
            : item
        );
        // --- FIX: Use the correct state setters ---
        setInventoryItems(updatedInventory);
        setFilteredItems(updatedInventory); // Also update the filtered list
        setIsUseModalOpen(false);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update inventory');
      }
    })
    .catch(error => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    });
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }
  
  if (!user) {
    return null; // Or a message telling the user they need to log in
  }
  
  return (
    // --- FIX: Remove the incorrect props from Layout ---
    <Layout>
      <UseInventoryModal 
        isOpen={isUseModalOpen}
        onClose={() => setIsUseModalOpen(false)}
        onConfirm={handleConfirmUse}
        inventoryList={inventoryItems}
      />
      {isReorderModalOpen && (
        <ReorderModal
          item={selectedItem}
          isOpen={isReorderModalOpen}
          onClose={() => setIsReorderModalOpen(false)}
          onReorderSubmit={handleReorderSubmit}
        />
      )}
      {isConfigModalOpen && (
        <ConfigurationModal
          item={selectedItem}
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onSave={handleConfigSave}
        />
      )}

      {/* --- FIX: Correct the JSX structure by removing one outer div --- */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground mt-2">
              Track and manage your personal or department's medical supply stock.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsUseModalOpen(true)} className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Use Inventory
            </Button>
          </div>
        </div>

        <InventoryFilters onFilter={handleFilter} />
        
        <InventoryTable
          items={filteredItems}
          userRole={user.role}
          onReorder={handleReorder}
          onConfigure={handleConfigure}
        />
      </div>
    </Layout>
  );
};

export default Inventory;