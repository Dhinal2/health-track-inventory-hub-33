
import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { OrderFilters } from '@/components/OrderFilters';
import { OrdersTable } from '@/components/OrdersTable';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { useToast } from '@/hooks/use-toast';

type OrderStatus = 'pending' | 'approved' | 'rejected' | 'delivered';

interface Order {
  id: string;
  placedBy: string;
  userId: string;
  department: string;
  status: OrderStatus;
  totalAmount: number;
  orderDate: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

type FilterState = {
  search: string;
  status: OrderStatus | 'all';
  department: string;
  dateFrom: string;
  dateTo: string;
};

const Orders = () => {
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

  const { toast } = useToast();

  // Mock orders data with proper typing
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-001',
      placedBy: 'Dr. Emily Chen',
      userId: 'user123',
      department: 'Emergency',
      status: 'pending' as OrderStatus,
      totalAmount: 245.50,
      orderDate: '2024-01-15',
      items: [
        {
          productId: 'P001',
          productName: 'Surgical Masks',
          quantity: 100,
          unitPrice: 2.25,
          total: 225.00
        },
        {
          productId: 'P002',
          productName: 'Hand Sanitizer',
          quantity: 2,
          unitPrice: 10.25,
          total: 20.50
        }
      ]
    },
    {
      id: 'ORD-002',  
      placedBy: 'Nurse John Davis',
      userId: 'user456',
      department: 'ICU',
      status: 'approved' as OrderStatus,
      totalAmount: 150.00,
      orderDate: '2024-01-14',
      items: [
        {
          productId: 'P003',
          productName: 'IV Bags',
          quantity: 20,
          unitPrice: 7.50,
          total: 150.00
        }
      ]
    },
    {
      id: 'ORD-003',
      placedBy: 'Dr. Sarah Johnson',
      userId: 'user789',
      department: 'Surgery',
      status: 'delivered' as OrderStatus,
      totalAmount: 89.99,
      orderDate: '2024-01-13',
      items: [
        {
          productId: 'P004',
          productName: 'Disposable Gloves',
          quantity: 5,
          unitPrice: 17.99,
          total: 89.95
        }
      ]
    }
  ]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    department: '',
    dateFrom: '',
    dateTo: ''
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));

    toast({
      title: "Order Updated",
      description: `Order ${orderId} has been ${newStatus}.`,
    });
  };

  const handleOrderCreate = (orderData: { department: string; items: any[] }) => {
    const newOrder: Order = {
      id: `ORD-${(orders.length + 1).toString().padStart(3, '0')}`,
      placedBy: user?.name || 'User',
      userId: 'current-user',
      department: orderData.department,
      status: 'pending' as OrderStatus,
      totalAmount: orderData.items.reduce((sum, item) => sum + item.total, 0),
      orderDate: new Date().toISOString().split('T')[0],
      items: orderData.items
    };

    setOrders(prev => [newOrder, ...prev]);
    
    toast({
      title: "Order Created",
      description: `Order ${newOrder.id} has been submitted for approval.`,
    });
  };

  const filteredOrders = useMemo(() => {
    let filtered = user?.role === 'staff' 
      ? orders.filter(order => order.userId === 'current-user')
      : orders;

    if (filters.search) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.placedBy.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.department) {
      filtered = filtered.filter(order => order.department === filters.department);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(order => order.orderDate >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(order => order.orderDate <= filters.dateTo);
    }

    return filtered;
  }, [orders, filters, user?.role]);

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Placed By', 'Department', 'Status', 'Total Amount', 'Order Date'];
    const csvData = filteredOrders.map(order => [
      order.id,
      order.placedBy,
      order.department,
      order.status,
      order.totalAmount.toFixed(2),
      order.orderDate
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders-export.csv';
    a.click();

    toast({
      title: "Export Complete",
      description: "Orders have been exported to CSV.",
    });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'delivered': return 'secondary';
      default: return 'secondary';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <div className="flex items-center space-x-3">
            {user?.role === 'admin' && (
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
            {user?.role === 'staff' && (
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
          getStatusBadgeVariant={getStatusBadgeVariant}
        />

        <CreateOrderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onOrderCreate={handleOrderCreate}
        />

        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          order={selectedOrder}
          userRole={user.role}
          onStatusUpdate={handleStatusUpdate}
          getStatusBadgeVariant={getStatusBadgeVariant}
        />
      </div>
    </Layout>
  );
};

export default Orders;
