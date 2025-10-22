import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types'; // Assuming Order type is correctly defined

// Interface for data coming FROM backend
interface BackendInvoice {
  InvoiceID: number;
  OrderID: number;
  CustomerName: string;
  TotalAmount: number | string; // Might be string
  PaymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
}

// Interface for data used IN state (ensuring numbers)
interface Invoice {
  InvoiceID: number;
  OrderID: number;
  CustomerName: string;
  TotalAmount: number; // Ensure this is a number
  PaymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
}


const Payment = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null); // Use state interface
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
      setIsLoading(false); // Stop loading if no order was passed
      toast({ title: "Error", description: "No order information found.", variant: "destructive"});
      // Optionally navigate back: navigate('/orders');
    }
  }, [location.state, navigate, toast]); // Added navigate and toast

  const fetchInvoiceForOrder = async (orderId: number) => {
    setIsLoading(true);
    setInvoice(null); // Reset invoice state
    setAmountAlreadyPaid(0);
    setPaymentAmount('');

    try {
       // --- FIX: Use relative path ---
      const response = await fetch('/api/invoices/by-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (response.ok) {
        const data: BackendInvoice = await response.json();
        
        // --- FIX: Convert TotalAmount to number ---
        const totalAmountNum = Number(data.TotalAmount);
        if (isNaN(totalAmountNum)) {
             throw new Error('Invalid TotalAmount received from server.');
        }

        // Set invoice state with ensured number type
        setInvoice({
            ...data,
            TotalAmount: totalAmountNum 
        });

        // Use the numeric totalAmountNum for calculations
        if (data.PaymentStatus === 'Partially Paid') {
            // Assuming partial is always 50% based on previous logic
            const alreadyPaid = totalAmountNum / 2; 
            const remaining = totalAmountNum - alreadyPaid;
            setAmountAlreadyPaid(alreadyPaid);
            setPaymentAmount(remaining.toString()); // Keep paymentAmount as string for input field
        } else { // Unpaid or Paid (though Paid shouldn't reach here ideally)
            setAmountAlreadyPaid(0);
            setPaymentAmount(totalAmountNum.toString()); // Set input field value
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invoice not found');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not fetch invoice.', variant: 'destructive' });
      setInvoice(null); // Ensure invoice is null on error
    } finally {
      setIsLoading(false);
    }
  };

  // --- ADDED: Formatting function ---
  const formatCurrency = (amount: number | string | undefined | null) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
        return '$--.--'; 
    }
    return `$${numericAmount.toFixed(2)}`;
  };
  // --- END ---


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
  
  const handlePayment = async () => {
    if (!invoice || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: `Please enter a valid amount.`, variant: 'destructive' });
      return;
    }

    const cardNumberValid = /^\d{16}$/.test(cardNumber.replace(/\s/g, ''));
    if (!cardNumberValid) {
        toast({ title: 'Invalid Card', description: 'Please enter a 16-digit card number.', variant: 'destructive' });
        return;
    }

    const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
    if (!expiryValid) {
        toast({ title: 'Invalid Expiry', description: 'Please use MM/YY format.', variant: 'destructive' });
        return;
    }

    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr);
    const year = parseInt(`20${yearStr}`);
    // Check expiry: Month is 1-based in UI, 0-based in Date object
    // Get the last moment of the expiry month
    const expiryDate = new Date(year, month, 0, 23, 59, 59, 999); 
    const today = new Date();
    
    if (expiryDate < today) {
         toast({ title: 'Card Expired', description: 'This card has expired.', variant: 'destructive' });
        return;
    }

    const cvcValid = /^\d{3,4}$/.test(cvc);
    if (!cvcValid) {
        toast({ title: 'Invalid CVC', description: 'Please enter a 3 or 4-digit CVC.', variant: 'destructive' });
        return;
    }

    setIsLoading(true); // Indicate processing
    try {
       // --- FIX: Use relative path ---
      const response = await fetch(`/api/invoices/${invoice.InvoiceID}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send amountPaid (camelCase) as expected by backend
        body: JSON.stringify({ amountPaid: amount }), 
      });

      const resData = await response.json();
      if (response.ok) {
        toast({ title: 'Payment Successful', description: 'Your payment has been processed.' });
        navigate('/orders'); // Redirect on success
      } else {
        throw new Error(resData.message || 'Payment failed');
      }
    } catch (error: any) {
      toast({ title: 'Payment Error', description: error.message || 'Could not process payment.', variant: 'destructive' });
    } finally {
        setIsLoading(false); // Stop loading indicator
    }
  };

  const renderContent = () => {
    // Show loading state while fetching invoice
    if (isLoading && !invoice) {
      return <p>Loading payment details...</p>;
    }

    // Handle case where order exists but invoice fetch failed or is invalid
    if (!invoice) {
      return (
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Invoice Error</h2>
          <p className="mt-2">Could not load the invoice details for this order.</p>
          <Button onClick={() => navigate('/orders')} className="mt-4">Go Back to Orders</Button>
        </div>
      );
    }
    
    // Ensure order is available (should be if invoice loaded)
     if (!order) {
       return (
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Order Error</h2>
          <p className="mt-2">Order details are missing.</p>
          <Button onClick={() => navigate('/orders')} className="mt-4">Go Back to Orders</Button>
        </div>
      );
    }


    // Use the numeric invoice.TotalAmount
    const remainingBalance = invoice.TotalAmount - amountAlreadyPaid;

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader><CardTitle>Complete Your Payment</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="flex justify-between mt-2"><span>Order ID:</span><span>ORD-{order.OrderID.toString().padStart(4, '0')}</span></div>
            {/* --- FIX: Use formatCurrency --- */}
            <div className="flex justify-between mt-1 text-gray-600"><span>Total Amount:</span><span>{formatCurrency(invoice.TotalAmount)}</span></div>
            {amountAlreadyPaid > 0 && <div className="flex justify-between mt-1 text-gray-600"><span>Already Paid:</span><span>-{formatCurrency(amountAlreadyPaid)}</span></div>}
            <div className="flex justify-between mt-2 pt-2 border-t font-bold text-lg"><span>Amount Due:</span><span>{formatCurrency(remainingBalance)}</span></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount</Label>
            <Input 
                id="paymentAmount" 
                type="number" 
                step="0.01" // Allow decimals
                value={paymentAmount} 
                onChange={(e) => setPaymentAmount(e.target.value)} 
                min="0.01" // Minimum payment
            />
          </div>
          <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Payment Information</h3>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input 
                  id="cardNumber" 
                  placeholder="**** **** **** ****"
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
                    maxLength={4} // CVC max length
                  />
                </div>
              </div>
          </div>
        </CardContent>
        <CardFooter>
            {/* --- FIX: Use formatCurrency for button text --- */}
          <Button onClick={handlePayment} className="w-full" disabled={isLoading}>
            {isLoading ? 'Processing...' : `Pay ${formatCurrency(paymentAmount || '0')}`}
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Show loading indicator until user data is resolved
  if (!user && isLoading) { 
    return <div>Loading user data...</div>;
  }
  
  // Handle case where user isn't logged in (should ideally be caught by AuthGuard)
  if (!user) {
     return <div>Please log in to make a payment.</div>; 
  }

  return (
    <Layout>
      <div className="p-4">{renderContent()}</div>
    </Layout>
  );
};

export default Payment;