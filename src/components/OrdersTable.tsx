import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

// Use the correct types that match the parent component
type OrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'Delivered';

interface Order {
  OrderID: number;
  PlacedBy: string;
  UserID: number;
  Status: OrderStatus;
  TotalAmount: number;
  OrderDate: string;
}

interface OrdersTableProps {
  orders: Order[];
  userRole: 'admin' | 'staff';
  onStatusUpdate: (orderId: number, newStatus: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ orders, userRole, onStatusUpdate, onViewDetails }) => {
    const getStatusBadgeVariant = (status: OrderStatus) => {
        switch (status) {
          case 'Pending': return 'secondary';
          case 'Approved': return 'default';
          case 'Rejected': return 'destructive';
          case 'Delivered': return 'secondary'; // Or a custom 'success' color
          default: return 'secondary';
        }
    };
    
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        {/* ... table head is unchanged ... */}
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.OrderID} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">ORD-{order.OrderID}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.PlacedBy}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.OrderDate).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusBadgeVariant(order.Status)}>{order.Status}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.TotalAmount.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(order)}>View Details</Button>
                  {userRole === 'admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onStatusUpdate(order.OrderID, 'Approved')}>Approve</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusUpdate(order.OrderID, 'Rejected')}>Reject</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};