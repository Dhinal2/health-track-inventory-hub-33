import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Download, Plus } from 'lucide-react';
import { OrderFilters } from '@/components/OrderFilters';
import { OrdersTable } from '@/components/OrdersTable';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { useToast } from '@/hooks/use-toast';

type OrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'Delivered';

interface OrderItem {
  OrderItemID: number;
  ProductID: number;
  ProductName: string;
  Quantity: number;
  UnitPrice: number;
}

interface Order {
  OrderID: number;
  PlacedBy: string;
  UserID: number;
  Status: OrderStatus;
  TotalAmount: number;
  OrderDate: string;
  Items: OrderItem[];
}

type FilterState = {
  search: string;
  status: OrderStatus | 'all';
  dateFrom: string;
  dateTo: string;
};

const Orders = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: number; name: string; role: 'admin' | 'staff'; rawRole: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', dateFrom: '', dateTo: '' });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
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
        fetchOrders(currentUser.id, currentUser.rawRole);
      } else {
        toast({ title: "Login Error", description: "User ID not found. Please log out and log back in.", variant: "destructive"});
        setIsLoading(false);
      }
    } else {
        setIsLoading(false);
    }
  }, []);

  const fetchOrders = async (userId: number, userRole: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/orders/user-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userRole }),
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        toast({ title: "Info", description: "No orders found or failed to fetch data.", variant: "default" });
        setOrders([]);
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus) => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        toast({ title: "Order Updated", description: `Order status changed to ${newStatus}.` });
        fetchOrders(user.id, user.rawRole);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not update order status.", variant: "destructive" });
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleOrderCreate = () => {
    if (user) {
      fetchOrders(user.id, user.rawRole);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Placed By', 'Status', 'Total Amount', 'Order Date'];
    const csvData = filteredOrders.map(order => [
      `ORD-${order.OrderID.toString().padStart(4, '0')}`,
      order.PlacedBy,
      order.Status,
      order.TotalAmount.toFixed(2),
      new Date(order.OrderDate).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Orders have been exported to CSV.",
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      const searchMatch = filters.search 
        ? order.OrderID.toString().includes(filters.search) || 
          order.PlacedBy.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      
      // Status filter
      const statusMatch = filters.status !== 'all' ? order.Status === filters.status : true;
      
      // Date from filter
      const dateFromMatch = filters.dateFrom 
        ? new Date(order.OrderDate) >= new Date(filters.dateFrom)
        : true;
      
      // Date to filter
      const dateToMatch = filters.dateTo 
        ? new Date(order.OrderDate) <= new Date(filters.dateTo)
        : true;
      
      return searchMatch && statusMatch && dateFromMatch && dateToMatch;
    });
  }, [orders, filters]);

  if (isLoading || !user) {
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
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <div className="flex items-center space-x-3">
            {user.role === 'admin' && (
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
            {user.role === 'staff' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            )}
          </div>
        </div>

        <OrderFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
          userRole={user.role} 
        />

        <OrdersTable
          orders={filteredOrders}
          userRole={user.role}
          onStatusUpdate={handleStatusUpdate}
          onViewDetails={handleViewDetails}
        />

        {user.role === 'staff' && (
          <CreateOrderModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onOrderCreate={handleOrderCreate}
            userId={user.id}
          />
        )}

        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          order={selectedOrder}
          userRole={user.role}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </Layout>
  );
};

export default Orders;