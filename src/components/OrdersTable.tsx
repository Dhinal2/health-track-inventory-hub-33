
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, MoreHorizontal, Check, X, Truck, FileText } from 'lucide-react';

type OrderStatus = 'pending' | 'approved' | 'rejected' | 'delivered';

interface Order {
  id: string;
  placedBy: string;
  userId: string;
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

interface OrdersTableProps {
  orders: Order[];
  userRole: 'admin' | 'staff';
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
  getStatusBadgeVariant: (status: OrderStatus) => string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  userRole,
  onStatusUpdate,
  onViewDetails,
  getStatusBadgeVariant
}) => {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'approved': return 'text-blue-600 bg-blue-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Placed By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.placedBy}</TableCell>
              <TableCell>
                <Badge 
                  variant={getStatusBadgeVariant(order.status) as any}
                  className={getStatusColor(order.status)}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
              <TableCell>{formatDate(order.orderDate)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(order)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {userRole === 'admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {order.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'approved')}>
                              <Check className="w-4 h-4 mr-2" />
                              Approve Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'rejected')}>
                              <X className="w-4 h-4 mr-2" />
                              Reject Order
                            </DropdownMenuItem>
                          </>
                        )}
                        {order.status === 'approved' && (
                          <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'delivered')}>
                            <Truck className="w-4 h-4 mr-2" />
                            Mark as Delivered
                          </DropdownMenuItem>
                        )}
                        {order.status === 'delivered' && (
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Invoice
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No orders found matching your criteria.
        </div>
      )}
    </div>
  );
};
