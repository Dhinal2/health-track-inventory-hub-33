import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

// Use the correct types that match the parent component
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

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  userRole: 'admin' | 'staff';
  onStatusUpdate: (orderId: number, newStatus: OrderStatus) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, userRole, onStatusUpdate }) => {
    // ... getStatusBadgeVariant function is the same ...
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details: ORD-{order.OrderID}</DialogTitle>
        </DialogHeader>
        {/* ... rest of the modal is unchanged, but now uses correct props like order.OrderID ... */}
        {userRole === 'admin' && order.Status === 'Pending' && (
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="destructive" onClick={() => onStatusUpdate(order.OrderID, 'Rejected')}>Reject Order</Button>
            <Button onClick={() => onStatusUpdate(order.OrderID, 'Approved')}>Approve Order</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};