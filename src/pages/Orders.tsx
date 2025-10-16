import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { OrderFilters } from '@/components/OrderFilters';
import { OrdersTable } from '@/components/OrdersTable';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { useToast } from '@/hooks/use-toast';

// Data types to match the backend
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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      // Ensure UserID exists before proceeding
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
        setOrders(await response.json());
      } else {
        // This toast will now correctly show if there are no orders or an error
        toast({ title: "Info", description: "No orders found or failed to fetch data.", variant: "default" });
        setOrders([]); // Set to empty array on failure
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', dateFrom: '', dateTo: '' });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // --- FULL FUNCTION DEFINITIONS ---
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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchMatch = filters.search 
        ? order.OrderID.toString().includes(filters.search) || order.PlacedBy.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const statusMatch = filters.status !== 'all' ? order.Status === filters.status : true;
      return searchMatch && statusMatch;
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
          {user.role === 'admin' && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        <OrderFilters filters={filters} onFiltersChange={setFilters} userRole={user.role} />

        <OrdersTable
          orders={filteredOrders}
          userRole={user.role}
          onStatusUpdate={handleStatusUpdate}
          onViewDetails={handleViewDetails}
        />

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