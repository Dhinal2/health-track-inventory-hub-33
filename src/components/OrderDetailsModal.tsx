import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X, Truck, FileText, Package, CreditCard } from 'lucide-react';
import { Order, OrderStatus } from '@/types';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  userRole: 'admin' | 'staff';
  onStatusUpdate: (orderId: number, newStatus: OrderStatus) => void;
}

interface PaymentDetails {
    totalAmount: number;
    amountPaid: number;
    amountRemaining: number;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  userRole,
  onStatusUpdate
}) => {
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      const shouldFetchDetails = [
        'Dispatched', 
        'Delivered', 
        'Pending Final Payment', 
        'Received', 
        'Completed'
      ].includes(order.Status);

      if (shouldFetchDetails) {
        fetch(`http://localhost:3001/api/invoices/payment-details/${order.OrderID}`)
          .then(res => res.ok ? res.json() : Promise.reject())
          .then(data => setPaymentDetails(data))
          .catch(() => setPaymentDetails(null));
      } else {
        setPaymentDetails(null);
      }
    }
  }, [isOpen, order]);

  if (!order) return null;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // --- FIX: Corrected return statements for all cases ---
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'Awaiting Payment': return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'Rejected': return 'text-red-700 bg-red-100 border-red-300';
      case 'Dispatched':
      case 'Delivered': 
      case 'Received':
      case 'Completed':
      case 'Pending Final Payment':
        return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  // --- FIX: Corrected return statements for all cases ---
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return <Package className="w-4 h-4" />;
      case 'Awaiting Payment': return <Check className="w-4 h-4" />;
      case 'Rejected': return <X className="w-4 h-4" />;
      case 'Dispatched':
      case 'Delivered':
      case 'Received':
      case 'Completed':
      case 'Pending Final Payment':
        return <Truck className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    onStatusUpdate(order.OrderID, newStatus);
    onClose();
  };

  const handlePayNow = () => {
    navigate('/payment', { state: { order } });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - ORD-{order.OrderID.toString().padStart(4, '0')}</span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(order.Status)}`}>
              {getStatusIcon(order.Status)}
              <span className="font-medium">{order.Status}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Order & Payment Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-600">Order ID:</span><span className="font-medium">ORD-{order.OrderID.toString().padStart(4, '0')}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Placed By:</span><span className="font-medium">{order.PlacedBy}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Order Date:</span><span className="font-medium">{formatDate(order.OrderDate)}</span></div>
                <div className="flex justify-between border-t pt-3"><span className="text-gray-600 font-medium">Total Amount:</span><span className="font-bold text-lg">{formatCurrency(order.TotalAmount)}</span></div>
                
                {paymentDetails && paymentDetails.amountPaid > 0 && (
                    <>
                        <div className="flex justify-between text-green-600">
                            <span className="font-medium">Amount Paid:</span>
                            <span className="font-medium">{formatCurrency(paymentDetails.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between text-red-600 border-t pt-2">
                            <span className="font-bold">Amount Remaining:</span>
                            <span className="font-bold">{formatCurrency(paymentDetails.amountRemaining)}</span>
                        </div>
                    </>
                )}
              </CardContent>
            </Card>

            {userRole === 'admin' && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Admin Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {order.Status === 'Pending' && (
                    <>
                      <Button onClick={() => handleStatusChange('Approved')} className="w-full bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-2" />Approve Order</Button>
                      <Button variant="destructive" onClick={() => handleStatusChange('Rejected')} className="w-full"><X className="w-4 h-4 mr-2" />Reject Order</Button>
                    </>
                  )}
                  {(order.Status === 'Awaiting Payment' || order.Status === 'Dispatched' || order.Status === 'Delivered') && (
                     <div className="text-center text-gray-500 py-4">
                        <p>This order is in the shipment phase.</p>
                        <p className="text-sm">Manage its status from the Shipments page.</p>
                     </div>
                  )}
                  {order.Status === 'Completed' && ( <Button variant="outline" className="w-full"><FileText className="w-4 h-4 mr-2" />Generate Invoice</Button>)}
                  {order.Status === 'Rejected' && (<div className="text-center text-gray-500 py-4"><p>This order has been rejected.</p></div>)}
                </CardContent>
              </Card>
            )}

            {userRole === 'staff' && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Order Status</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center py-4">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(order.Status)}`}>
                      {getStatusIcon(order.Status)}
                      <span className="font-medium text-lg">{order.Status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      {order.Status === 'Pending' && 'Your order is awaiting admin approval.'}
                      {order.Status === 'Awaiting Payment' && 'Your order has been approved. Please proceed with payment.'}
                      {order.Status === 'Dispatched' && 'Your order has been dispatched and is on its way.'}
                      {order.Status === 'Rejected' && 'Unfortunately, your order was not approved.'}
                      {order.Status === 'Delivered' && 'Your order has arrived. Please confirm receipt.'}
                      {order.Status === 'Pending Final Payment' && 'Your order has been delivered. Please complete the final payment.'}
                      {order.Status === 'Completed' && 'This order is complete and items are in your inventory.'}
                    </p>
                    {(order.Status === 'Awaiting Payment' || order.Status === 'Pending Final Payment') && (<Button onClick={handlePayNow} className="mt-4"><CreditCard className="w-4 h-4 mr-2" />Pay Now</Button>)}
                    {order.Status === 'Delivered' && (<Button onClick={() => onStatusUpdate(order.OrderID, 'Received')} className="mt-4">Receive Order</Button>)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Order Items ({order.Items.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader><TableRow className="bg-gray-50"><TableHead>Product Name</TableHead><TableHead>Product ID</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {order.Items.map((item) => (<TableRow key={item.OrderItemID}><TableCell className="font-medium">{item.ProductName}</TableCell><TableCell>#{item.ProductID}</TableCell><TableCell className="text-right">{item.Quantity}</TableCell><TableCell className="text-right">{formatCurrency(item.UnitPrice)}</TableCell><TableCell className="text-right font-medium">{formatCurrency(item.UnitPrice * item.Quantity)}</TableCell></TableRow>))}
                    <TableRow className="bg-blue-50 border-t-2"><TableCell colSpan={4} className="text-right font-semibold text-gray-700">Order Total:</TableCell><TableCell className="text-right font-bold text-lg text-blue-600">{formatCurrency(order.TotalAmount)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t"><Button variant="outline" onClick={onClose}>Close</Button></div>
      </DialogContent>
    </Dialog>
  );
};