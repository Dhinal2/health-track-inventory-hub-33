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
import { Order, OrderStatus } from '@/types'; // Assuming OrderStatus is correctly defined in types.ts

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
  
  // --- THIS IS THE FIX ---
  // Ensure the amount is treated as a number before formatting
  const formatCurrency = (amount: number | string) => {
    // Convert amount to a number using parseFloat before calling toFixed
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    // Handle cases where conversion might fail (NaN)
    if (isNaN(numericAmount)) {
        return '$--.--'; 
    }
    return `$${numericAmount.toFixed(2)}`;
  };
  // --- END OF FIX ---

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Add checks for invalid date if necessary
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
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
      // Added missing statuses from types.ts
      case 'Dispatched':
      case 'In transit': 
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
            <TableHead className="font-semibold text-right">Actions</TableHead> {/* Added text-right */}
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
                  // Added some padding for better looks
                  className={`${getStatusColor(order.Status)} border px-2 py-0.5`} 
                >
                  {order.Status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(order.TotalAmount)}</TableCell>
              <TableCell>{formatDate(order.OrderDate)}</TableCell>
              {/* Added text-right to align actions */}
              <TableCell className="text-right"> 
                <div className="flex items-center justify-end gap-2"> {/* Added justify-end */}
                  <Button
                    variant="ghost"
                    size="icon" // Make it an icon button
                    onClick={() => onViewDetails(order)}
                    className="hover:bg-blue-50 h-8 w-8" // Adjusted size
                  >
                    <Eye className="w-4 h-4" />
                     <span className="sr-only">View Details</span> {/* Accessibility */}
                  </Button>
                  
                  {userRole === 'admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100 h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                           <span className="sr-only">More Actions</span> {/* Accessibility */}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Simplified status update logic based on backend */}
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
                        {/* Add other admin actions if needed, e.g., Mark Delivered if backend logic changes */}
                         {(order.Status === 'Dispatched' || order.Status === 'In transit') && (
                            <DropdownMenuItem 
                                onClick={() => onStatusUpdate(order.OrderID, 'Delivered')} // Assuming 'Delivered' is the correct status to send
                                className="cursor-pointer"
                            >
                                <Truck className="w-4 h-4 mr-2 text-blue-600" />
                                Mark as Delivered
                           </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                   {/* Staff action: Mark as Received */}
                  {userRole === 'staff' && order.Status === 'Delivered' && (
                     <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onStatusUpdate(order.OrderID, 'Received')}
                     >
                        Mark as Received
                    </Button>
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