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
import { Order, OrderStatus } from '@/types';

interface OrdersTableProps {
  orders: Order[];
  userRole: 'admin' | 'staff';
  onStatusUpdate: (orderId: number, newStatus: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  userRole,
  onStatusUpdate,
  onViewDetails,
}) => {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'Approved': 
      case 'Awaiting Payment':
        return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'Rejected': return 'text-red-700 bg-red-100 border-red-300';
      case 'Delivered':
      case 'Received':
      case 'Completed':
      case 'Pending Final Payment':
        return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">Order ID</TableHead>
            <TableHead className="font-semibold">Placed By</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Total Amount</TableHead>
            <TableHead className="font-semibold">Order Date</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.OrderID} className="hover:bg-gray-50">
              <TableCell className="font-medium">ORD-{order.OrderID.toString().padStart(4, '0')}</TableCell>
              <TableCell>{order.PlacedBy}</TableCell>
              <TableCell>
                <Badge 
                  variant="outline"
                  className={`${getStatusColor(order.Status)} border`}
                >
                  {order.Status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(order.TotalAmount)}</TableCell>
              <TableCell>{formatDate(order.OrderDate)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(order)}
                    className="hover:bg-blue-50"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {userRole === 'admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {order.Status === 'Pending' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => onStatusUpdate(order.OrderID, 'Approved')}
                              className="cursor-pointer"
                            >
                              <Check className="w-4 h-4 mr-2 text-green-600" />
                              Approve Order
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onStatusUpdate(order.OrderID, 'Rejected')}
                              className="cursor-pointer"
                            >
                              <X className="w-4 h-4 mr-2 text-red-600" />
                              Reject Order
                            </DropdownMenuItem>
                          </>
                        )}
                        {order.Status === 'Approved' && (
                          <DropdownMenuItem 
                            onClick={() => onStatusUpdate(order.OrderID, 'Delivered')}
                            className="cursor-pointer"
                          >
                            <Truck className="w-4 h-4 mr-2 text-blue-600" />
                            Mark as Delivered
                          </DropdownMenuItem>
                        )}
                        {order.Status === 'Delivered' && (
                          <DropdownMenuItem className="cursor-pointer">
                            <FileText className="w-4 h-4 mr-2 text-gray-600" />
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
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No orders found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};