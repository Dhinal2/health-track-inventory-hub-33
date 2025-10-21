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
  const [amountAlreadyPaid, setAmountAlreadyPaid] = useState(0);

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

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

        if (data.PaymentStatus === 'Partially Paid') {
            const alreadyPaid = data.TotalAmount / 2;
            const remaining = data.TotalAmount - alreadyPaid;
            setAmountAlreadyPaid(alreadyPaid);
            setPaymentAmount(remaining.toString());
        } else {
            setAmountAlreadyPaid(0);
            setPaymentAmount(data.TotalAmount.toString());
        }
      } else {
        throw new Error('Invoice not found');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not fetch invoice for this order.', variant: 'destructive' });
      setInvoice(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: Formatting functions ---

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const formatCvc = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 4);
  };
  
  // --- End of formatting functions ---

  const handlePayment = async () => {
    if (!invoice || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: `Please enter a valid amount.`, variant: 'destructive' });
      return;
    }

    // --- Updated card validation (removes spaces first) ---
    const cardNumberValid = /^\d{16}$/.test(cardNumber.replace(/\s/g, ''));
    if (!cardNumberValid) {
        toast({ title: 'Invalid Card', description: 'Please enter a 16-digit card number.', variant: 'destructive' });
        return;
    }

    // Expiry validation remains the same as our format matches MM/YY
    const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
    if (!expiryValid) {
        toast({ title: 'Invalid Expiry', description: 'Please use MM/YY format.', variant: 'destructive' });
        return;
    }

    const [month, year] = expiry.split('/');
    const expiryDate = new Date(parseInt(`20${year}`), parseInt(month), 0); 
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    if (expiryDate < today) {
         toast({ title: 'Card Expired', description: 'This card has expired.', variant: 'destructive' });
        return;
    }

    // CVC validation remains the same
    const cvcValid = /^\d{3,4}$/.test(cvc);
    if (!cvcValid) {
        toast({ title: 'Invalid CVC', description: 'Please enter a 3 or 4-digit CVC.', variant: 'destructive' });
        return;
    }
    // --- End of validation ---

    try {
      const response = await fetch(`http://localhost:3001/api/invoices/${invoice.InvoiceID}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaid: amount }),
      });

      const resData = await response.json();
      if (response.ok) {
        toast({ title: 'Payment Successful', description: 'Your payment has been processed.' });
        navigate('/orders');
      } else {
        throw new Error(resData.message || 'Payment failed');
      }
    } catch (error: any) {
      toast({ title: 'Payment Error', description: error.message || 'Could not process your payment.', variant: 'destructive' });
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

    const remainingBalance = invoice.TotalAmount - amountAlreadyPaid;

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader><CardTitle>Complete Your Payment</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="flex justify-between mt-2"><span>Order ID:</span><span>ORD-{order.OrderID.toString().padStart(4, '0')}</span></div>
            <div className="flex justify-between mt-1 text-gray-600"><span>Total Amount:</span><span>${invoice.TotalAmount.toFixed(2)}</span></div>
            {amountAlreadyPaid > 0 && <div className="flex justify-between mt-1 text-gray-600"><span>Already Paid:</span><span>-${amountAlreadyPaid.toFixed(2)}</span></div>}
            <div className="flex justify-between mt-2 pt-2 border-t font-bold text-lg"><span>Amount Due:</span><span>${remainingBalance.toFixed(2)}</span></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount</Label>
            <Input id="paymentAmount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
          </div>
          <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Payment Information</h3>
              {/* --- UPDATED: Connect inputs to state and formatting functions --- */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input 
                  id="cardNumber" 
                  placeholder="**** **** **** ****" // Updated placeholder
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} 
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input 
                    id="expiry" 
                    placeholder="MM/YY" 
                    value={expiry} 
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input 
                    id="cvc" 
                    placeholder="123" 
                    value={cvc} 
                    onChange={(e) => setCvc(formatCvc(e.target.value))} 
                  />
                </div>
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
    <Layout>
      <div className="p-4">{renderContent()}</div>
    </Layout>
  );
};

export default Payment;