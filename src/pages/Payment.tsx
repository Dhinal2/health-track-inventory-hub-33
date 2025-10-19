import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types';

interface Invoice {
  InvoiceID: number;
  OrderID: number;
  CustomerName: string;
  TotalAmount: number;
  PaymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
}

const Payment = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [user, setUser] = useState<{ id: number; name: string; role: 'admin' | 'staff' } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const mappedRole = parsedUser.Role === 'Administrator' ? 'admin' : 'staff';
      setUser({ id: parsedUser.UserID, name: parsedUser.Name, role: mappedRole });
    }

    if (location.state && location.state.order) {
      const passedOrder = location.state.order as Order;
      setOrder(passedOrder);
      fetchInvoiceForOrder(passedOrder.OrderID);
    } else {
      setIsLoading(false);
    }
  }, [location.state]);

  const fetchInvoiceForOrder = async (orderId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/invoices/by-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (response.ok) {
        const data: Invoice = await response.json();
        setInvoice(data);

        // --- LOGIC FIX: Set payment amount to remaining balance ---
        if (data.PaymentStatus === 'Partially Paid') {
          const remainingAmount = data.TotalAmount / 2;
          setPaymentAmount(remainingAmount.toString());
        } else {
          setPaymentAmount(data.TotalAmount.toString());
        }
        // --- END FIX ---
      } else {
        throw new Error('Invoice not found');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not fetch invoice for this order.',
        variant: 'destructive',
      });
      setInvoice(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!invoice || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: `Please enter a valid amount.`, variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/invoices/${invoice.InvoiceID}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaid: amount }),
      });

      const resData = await response.json();
      if (response.ok) {
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed.',
        });
        navigate('/orders');
      } else {
        throw new Error(resData.message || 'Payment failed');
      }
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'Could not process your payment.',
        variant: 'destructive',
      });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p>Loading payment details...</p>;
    }

    if (!order || !invoice) {
      return (
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Invalid Access</h2>
          <p className="mt-2">No order or invoice was found. Please go back.</p>
          <Button onClick={() => navigate('/orders')} className="mt-4">Go to Orders</Button>
        </div>
      );
    }

    const remainingBalance = invoice.PaymentStatus === 'Partially Paid' ? invoice.TotalAmount / 2 : invoice.TotalAmount;

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader><CardTitle>Complete Your Payment</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="flex justify-between mt-2"><span>Order ID:</span><span>ORD-{order.OrderID.toString().padStart(4, '0')}</span></div>
            <div className="flex justify-between mt-1"><span>Total Amount Due:</span><span className="font-bold text-lg">${remainingBalance.toFixed(2)}</span></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount</Label>
            <Input id="paymentAmount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
          </div>
          <div className="space-y-4 pt-4 border-t">
             <h3 className="font-semibold">Payment Information</h3>
             <div className="space-y-2"><Label htmlFor="cardNumber">Card Number</Label><Input id="cardNumber" placeholder="**** **** **** 1234" /></div>
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="expiry">Expiry</Label><Input id="expiry" placeholder="MM/YY" /></div>
                <div className="space-y-2"><Label htmlFor="cvc">CVC</Label><Input id="cvc" placeholder="123" /></div>
             </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handlePayment} className="w-full">Pay ${parseFloat(paymentAmount || '0').toFixed(2)}</Button>
        </CardFooter>
      </Card>
    );
  };
  
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="p-4">{renderContent()}</div>
    </Layout>
  );
};

export default Payment;