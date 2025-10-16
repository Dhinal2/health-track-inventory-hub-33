import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { Invoice, FrontendPaymentStatus, BackendPaymentStatus } from '@/types'; // Import our types

// Helper function to map backend status to frontend status
const mapBackendStatus = (status: BackendPaymentStatus): FrontendPaymentStatus => {
  switch (status) {
    case 'Paid': return 'paid';
    case 'Unpaid': return 'unpaid';
    case 'Partially Paid': return 'partially_paid';
    default: return 'unpaid';
  }
};

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // The invoice object passed from the Invoices page (already mapped with camelCase properties)
  const invoice: Invoice | undefined = location.state?.invoice;

  const [user, setUser] = useState<{ name: string; role: 'admin' | 'staff' } | null>(null);
  
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      // Ensure we use the correct casing from localStorage
      const mappedRole: 'admin' | 'staff' = (parsedUser.Role === 'Administrator' || parsedUser.role === 'admin') ? 'admin' : 'staff';
      setUser({ name: parsedUser.Name || parsedUser.name, role: mappedRole });
    }
  }, []);

  const [paymentData, setPaymentData] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    // Use grandTotal which includes tax, and is from our mapped Invoice object
    amount: invoice?.grandTotal.toFixed(2) || '0.00'
  });

  const [errors, setErrors] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    amount: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const validateExpiryDate = (expiry: string): boolean => {
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiry)) return false;

    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year, 10);
    const expMonth = parseInt(month, 10);

    return !(expYear < currentYear || (expYear === currentYear && expMonth < currentMonth));
  };

  const validateForm = (): boolean => {
    if (!invoice) return false;
    const newErrors = { cardNumber: '', expiryDate: '', cvv: '', amount: '' };
    const cardNumberClean = paymentData.cardNumber.replace(/\s/g, '');

    if (cardNumberClean.length < 13 || cardNumberClean.length > 19) {
      newErrors.cardNumber = 'Card number must be 13-19 digits.';
    }
    if (!validateExpiryDate(paymentData.expiryDate)) {
      newErrors.expiryDate = 'Invalid expiry date (MM/YY).';
    }
    if (paymentData.cvv.length < 3 || paymentData.cvv.length > 4) {
      newErrors.cvv = 'CVV must be 3 or 4 digits.';
    }
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount.';
    } else if (amount > invoice.grandTotal) {
      newErrors.amount = `Amount cannot exceed the total due of $${invoice.grandTotal.toFixed(2)}.`;
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const paymentAmount = parseFloat(paymentData.amount);

    try {
      // Use camelCase invoiceID from our unified Invoice type
      const response = await fetch(`http://localhost:3001/api/invoices/${invoice.invoiceID}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaid: paymentAmount }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Payment Successful",
          description: result.message || `Payment of $${paymentAmount.toFixed(2)} processed.`,
        });

        setTimeout(() => {
          navigate('/invoices', { 
            state: { 
              updatedInvoiceId: invoice.id, 
              newStatus: mapBackendStatus(result.newStatus),
              paymentAmount: paymentAmount
            }
          });
        }, 1500);
      } else {
        throw new Error(result.message || 'Payment processing failed');
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Could not process payment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Invalid Access</h2>
          <p>No invoice was selected. Please go back.</p>
          <Button onClick={() => navigate('/invoices')} className="mt-4">Go to Invoices</Button>
        </div>
      </div>
    );
  }

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Invoices
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><CreditCard className="w-5 h-5 mr-2" /> Payment Details</CardTitle>
            <CardDescription>Invoice #{invoice.id} for {invoice.customerName}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-muted p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Due Amount:</span>
                  <span className="text-2xl font-bold text-foreground">${invoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardName">Cardholder Name *</Label>
                  <Input id="cardName" value={paymentData.cardName} onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })} placeholder="John Doe" required />
                </div>
                <div>
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input id="cardNumber" value={paymentData.cardNumber} onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })} placeholder="1234 5678 9012 3456" required />
                  {errors.cardNumber && <p className="text-sm text-destructive mt-1">{errors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input id="expiryDate" value={paymentData.expiryDate} onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })} placeholder="MM/YY" maxLength={5} required />
                    {errors.expiryDate && <p className="text-sm text-destructive mt-1">{errors.expiryDate}</p>}
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input id="cvv" type="text" value={paymentData.cvv} onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })} placeholder="123" maxLength={4} required />
                    {errors.cvv && <p className="text-sm text-destructive mt-1">{errors.cvv}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="amount">Payment Amount *</Label>
                  <Input id="amount" type="number" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} required />
                  {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount}</p>}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Process Payment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Payment;
