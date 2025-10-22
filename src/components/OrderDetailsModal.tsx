import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // --- FIX: Added missing Badge import ---
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

// Interface for data coming FROM the backend (might have strings for numbers)
interface BackendPaymentDetails {
    totalAmount: number | string;
    amountPaid: number | string;
    amountRemaining: number | string;
}

// Interface for data stored IN the state (ensured numbers)
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
      // Fetch details only if the order is past the initial stages
      const shouldFetchDetails = ![
        'Pending', 
        'Rejected', 
        // 'Approved' - might not have payment details yet
      ].includes(order.Status);

      if (shouldFetchDetails) {
        // Use relative path
        fetch(`/api/invoices/payment-details/${order.OrderID}`) 
          .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch payment details'))
          .then((data: BackendPaymentDetails) => {
             // Convert potential strings to numbers when setting state
             setPaymentDetails({
                 totalAmount: Number(data.totalAmount),
                 amountPaid: Number(data.amountPaid),
                 amountRemaining: Number(data.amountRemaining)
             });
          })
          .catch((err) => {
              console.error("Error fetching payment details:", err);
              setPaymentDetails(null); // Reset on error
          });
      } else {
        setPaymentDetails(null); // Reset if not fetching
      }
    } else {
         setPaymentDetails(null); // Reset on close or if no order
    }
  }, [isOpen, order]);

  if (!order) return null;

  // --- FIX: Ensure amount is treated as a number BEFORE formatting ---
  const formatCurrency = (amount: number | string | undefined | null) => {
    const numericAmount = Number(amount); // Handles string/null/undefined
    if (isNaN(numericAmount)) {
        return '$--.--'; // Placeholder for invalid values
    }
    return `$${numericAmount.toFixed(2)}`;
  };
  // --- END OF FIX ---

  const formatDate = (dateString: string | undefined | null) => {
     if (!dateString) return 'N/A';
     const date = new Date(dateString);
     if (isNaN(date.getTime())) return 'Invalid Date';
     // Using localeString for better readability
     return date.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Expanded based on types.ts
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'Approved': // Added Approved
      case 'Awaiting Payment': 
        return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'Rejected': return 'text-red-700 bg-red-100 border-red-300';
      case 'Dispatched':
      case 'In transit': // Added In transit
        return 'text-purple-700 bg-purple-100 border-purple-300'; // Example color
      case 'Delivered': 
      case 'Received':
      case 'Completed':
      case 'Pending Final Payment':
        return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  // Expanded based on types.ts
 const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return <Package className="w-4 h-4" />;
      case 'Approved': // Added Approved
      case 'Awaiting Payment': 
        return <Check className="w-4 h-4" />; 
      case 'Rejected': return <X className="w-4 h-4" />;
      case 'Dispatched':
      case 'In transit': // Added In transit
      case 'Delivered':
        return <Truck className="w-4 h-4" />;
      case 'Received':
      case 'Pending Final Payment':
         return <CreditCard className="w-4 h-4" />; // Icon for payment stages
      case 'Completed':
        return <Check className="w-4 h-4 text-green-700" />; 
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
          {/* Changed back to using Badge component as intended */}
          <DialogTitle className="flex items-center justify-between flex-wrap gap-2"> 
            <span>Order Details - ORD-{order.OrderID.toString().padStart(4, '0')}</span>
            <Badge 
                variant="outline"
                className={`${getStatusColor(order.Status)} border px-3 py-1 text-sm flex items-center gap-1.5`} 
            >
                {getStatusIcon(order.Status)}
                {order.Status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Order & Payment Information</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Order ID:</span><span className="font-medium">ORD-{order.OrderID.toString().padStart(4, '0')}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Placed By:</span><span className="font-medium">{order.PlacedBy}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Order Date:</span><span className="font-medium">{formatDate(order.OrderDate)}</span></div>
                <div className="flex justify-between border-t pt-3"><span className="text-gray-600 font-medium">Total Amount:</span><span className="font-bold text-base">{formatCurrency(order.TotalAmount)}</span></div>
                
                {paymentDetails && paymentDetails.amountPaid > 0 && (
                    <>
                        <div className="flex justify-between text-green-600 pt-2"> 
                            <span className="font-medium">Amount Paid:</span>
                            <span className="font-medium">{formatCurrency(paymentDetails.amountPaid)}</span>
                        </div>
                        {paymentDetails.amountRemaining > 0.001 && ( // Check if remaining > 0
                            <div className="flex justify-between text-red-600 border-t pt-2">
                                <span className="font-bold">Amount Remaining:</span>
                                <span className="font-bold">{formatCurrency(paymentDetails.amountRemaining)}</span>
                            </div>
                        )}
                    </>
                )}
                 {paymentDetails && paymentDetails.amountPaid <= 0 && order.Status !== 'Rejected' && (
                     <div className="flex justify-between text-red-600 border-t pt-2">
                        <span className="font-bold">Status:</span>
                        <span className="font-bold">Unpaid</span>
                    </div>
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
                  {/* Simplified message for admin */}
                   {(['Awaiting Payment', 'Dispatched', 'In transit', 'Delivered', 'Received', 'Pending Final Payment', 'Completed'].includes(order.Status)) && (
                     <div className="text-center text-gray-500 py-4">
                       <p>Order is past the initial approval stage.</p>
                       <p className="text-sm">Manage shipment status via the Shipments page if applicable.</p>
                     </div>
                  )}
                  {order.Status === 'Rejected' && (<div className="text-center text-red-600 py-4 font-medium"><p>This order has been rejected.</p></div>)}
                  {/* Add Invoice Generation trigger if needed */}
                  {/* {order.Status === 'Completed' && ( <Button variant="outline" className="w-full"><FileText className="w-4 h-4 mr-2" />Generate Invoice</Button>)} */}
                </CardContent>
              </Card>
            )}

            {userRole === 'staff' && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Order Progress</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center py-4">
                     {/* Using Badge here too for consistency */}
                     <Badge 
                        variant="outline"
                        className={`${getStatusColor(order.Status)} border px-4 py-1.5 text-base flex items-center gap-2 justify-center`} 
                    >
                        {getStatusIcon(order.Status)}
                        {order.Status}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-4">
                      {order.Status === 'Pending' && 'Your order is awaiting admin approval.'}
                      {order.Status === 'Approved' && 'Your order has been approved. Proceed to payment.'}
                      {order.Status === 'Awaiting Payment' && 'Your order is approved. Please proceed with payment.'}
                      {order.Status === 'Dispatched' && 'Your order has been dispatched and is on its way.'}
                      {order.Status === 'In transit' && 'Your order is currently in transit.'}
                      {order.Status === 'Rejected' && 'Unfortunately, your order request was not approved.'}
                      {order.Status === 'Delivered' && 'Your order has arrived. Please confirm order arrival receipt below.'}
                      {order.Status === 'Pending Final Payment' && 'Your order has been delivered. Please complete the final payment.'}
                      {order.Status === 'Received' && 'You have confirmed receipt of this order.'}
                      {order.Status === 'Completed' && 'This order is complete and items have been added to your inventory.'}
                    </p>
                    {/* Pay Now Button */}
                    {(order.Status === 'Awaiting Payment' || order.Status === 'Pending Final Payment') && (
                        <Button onClick={handlePayNow} className="mt-4"><CreditCard className="w-4 h-4 mr-2" />Pay Now</Button>
                    )}
                    {/* Receive Order Button */}
                    {order.Status === 'Delivered' && (
                         <Button onClick={() => handleStatusChange('Received')} className="mt-4"><Package className="w-4 h-4 mr-2"/>Order Arrived</Button>
                    )}
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
                    {order.Items.map((item) => (
                      <TableRow key={item.OrderItemID}>
                          <TableCell className="font-medium">{item.ProductName}</TableCell>
                          <TableCell>#{item.ProductID}</TableCell>
                          <TableCell className="text-right">{item.Quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.UnitPrice)}</TableCell>
                          {/* Ensure calculation uses numbers */}
                          <TableCell className="text-right font-medium">{formatCurrency(Number(item.UnitPrice) * item.Quantity)}</TableCell> 
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50 border-t-2">
                        <TableCell colSpan={4} className="text-right font-semibold text-gray-700">Order Total:</TableCell>
                        <TableCell className="text-right font-bold text-lg text-blue-600">{formatCurrency(order.TotalAmount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t mt-6">
            <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};