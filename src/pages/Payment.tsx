import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { CreditCard, ArrowLeft } from 'lucide-react';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const invoice = location.state?.invoice;

  const [user, setUser] = useState<{name: string, role: 'admin' | 'staff'} | null>(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      return {
        name: parsedUser.name || parsedUser.email?.split('@')[0] || 'User',
        role: parsedUser.role || 'staff'
      };
    }
    return null;
  });

  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    amount: invoice?.grandTotal.toFixed(2) || '0.00'
  });

  const [errors, setErrors] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    amount: ''
  });

  const validateExpiryDate = (expiry: string): boolean => {
    // Check format MM/YY
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiry)) {
      return false;
    }

    // Check if date is not expired
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year, 10);
    const expMonth = parseInt(month, 10);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false;
    }

    return true;
  };

  const validateForm = (): boolean => {
    const newErrors = {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      amount: ''
    };

    // Validate card number (basic check for 13-19 digits)
    const cardNumberClean = paymentData.cardNumber.replace(/\s/g, '');
    if (cardNumberClean.length < 13 || cardNumberClean.length > 19) {
      newErrors.cardNumber = 'Please enter a valid card number (13-19 digits)';
    }

    // Validate expiry date
    if (!validateExpiryDate(paymentData.expiryDate)) {
      newErrors.expiryDate = 'Invalid expiry date. Please check and try again.';
    }

    // Validate CVV
    if (paymentData.cvv.length < 3 || paymentData.cvv.length > 4) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    }

    // Validate amount
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid payment amount';
    } else if (amount > invoice.grandTotal) {
      newErrors.amount = `Amount cannot exceed total due ($${invoice.grandTotal.toFixed(2)})`;
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form before submitting.",
        variant: "destructive"
      });
      return;
    }

    const paymentAmount = parseFloat(paymentData.amount);
    const totalDue = invoice.grandTotal;
    
    let newStatus: 'paid' | 'partially_paid';
    let toastMessage = '';
    
    if (paymentAmount >= totalDue) {
      newStatus = 'paid';
      toastMessage = `Payment of $${paymentAmount.toFixed(2)} processed successfully. Invoice is now fully paid.`;
    } else {
      newStatus = 'partially_paid';
      const remaining = totalDue - paymentAmount;
      toastMessage = `Partial payment of $${paymentAmount.toFixed(2)} processed successfully. Outstanding balance: $${remaining.toFixed(2)}`;
    }

    toast({
      title: "Payment Successful",
      description: toastMessage,
    });

    // Navigate back to invoices page after a short delay
    setTimeout(() => {
      navigate('/invoices', { 
        state: { 
          updatedInvoiceId: invoice?.id, 
          newStatus: newStatus,
          paymentAmount: paymentAmount
        }
      });
    }, 1500);
  };

  if (!user || user.role !== 'staff') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only staff members can access the payment page.</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Invoice Selected</h2>
          <Button onClick={() => navigate('/invoices')}>Go to Invoices</Button>
        </div>
      </div>
    );
  }

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/invoices')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Invoice #{invoice.id} - {invoice.customerName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-muted p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Due Amount:</span>
                  <span className="text-2xl font-bold text-foreground">
                    ${invoice.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardName">Cardholder Name *</Label>
                  <Input
                    id="cardName"
                    value={paymentData.cardName}
                    onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={(e) => {
                      setPaymentData({ ...paymentData, cardNumber: e.target.value });
                      setErrors({ ...errors, cardNumber: '' });
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                    className="mt-1"
                  />
                  {errors.cardNumber && (
                    <p className="text-sm text-destructive mt-1">{errors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      value={paymentData.expiryDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }
                        setPaymentData({ ...paymentData, expiryDate: value });
                        setErrors({ ...errors, expiryDate: '' });
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                      className="mt-1"
                    />
                    {errors.expiryDate && (
                      <p className="text-sm text-destructive mt-1">{errors.expiryDate}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      type="text"
                      value={paymentData.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setPaymentData({ ...paymentData, cvv: value });
                        setErrors({ ...errors, cvv: '' });
                      }}
                      placeholder="123"
                      maxLength={4}
                      required
                      className="mt-1"
                    />
                    {errors.cvv && (
                      <p className="text-sm text-destructive mt-1">{errors.cvv}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Payment Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => {
                      setPaymentData({ ...paymentData, amount: e.target.value });
                      setErrors({ ...errors, amount: '' });
                    }}
                    required
                    className="mt-1"
                  />
                  {errors.amount && (
                    <p className="text-sm text-destructive mt-1">{errors.amount}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    You can pay the full amount or a partial amount.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/invoices')}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Process Payment
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
