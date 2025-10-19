import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { InvoiceFilters } from '@/components/InvoiceFilters';
import { InvoicesTable } from '@/components/InvoicesTable';
import { InvoiceDetailsModal } from '@/components/InvoiceDetailsModal';
import { GenerateInvoiceModal } from '@/components/GenerateInvoiceModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Invoice, Order, FrontendPaymentStatus, BackendPaymentStatus } from '@/types';

interface BackendInvoice {
  InvoiceID: number;
  OrderID: number;
  CustomerName: string;
  TotalAmount: number;
  PaymentStatus: BackendPaymentStatus;
  IssueDate: string;
  DueDate: string | null;
}

type FilterState = {
  search: string;
  paymentStatus: FrontendPaymentStatus | 'all';
  dateFrom: string;
  dateTo: string;
};

const mapBackendStatus = (status: BackendPaymentStatus): FrontendPaymentStatus => {
    switch (status) {
        case 'Paid': return 'paid';
        case 'Unpaid': return 'unpaid';
        case 'Partially Paid': return 'partially_paid';
        default: return 'unpaid';
    }
};

// --- Find and replace this function in src/pages/Invoices.tsx ---
const addMockDetailsToInvoice = (invoice: BackendInvoice): Invoice => ({
  invoiceID: invoice.InvoiceID,
  orderID: invoice.OrderID,
  customerName: invoice.CustomerName,
  totalAmount: invoice.TotalAmount,
  paymentStatus: mapBackendStatus(invoice.PaymentStatus),
  issueDate: invoice.IssueDate,
  dueDate: invoice.DueDate || new Date().toISOString(),

  // --- Mocked Details (Corrected) ---
  id: `INV-${invoice.InvoiceID.toString().padStart(3, '0')}`,
  orderId: `ORD-${invoice.OrderID.toString().padStart(3, '0')}`,
  facilityName: 'Emergency Department',
  items: [{ productId: 'P001', productName: 'Surgical Masks', quantity: 100, unitPrice: 2.25, subtotal: 225.00 }],
  tax: 0, // Tax is now zero
  grandTotal: invoice.TotalAmount, // Grand total is now the same as total amount
  amountPaid: invoice.PaymentStatus === 'Paid' ? invoice.TotalAmount : (invoice.PaymentStatus === 'Partially Paid' ? invoice.TotalAmount / 2 : 0),
  outstandingBalance: invoice.PaymentStatus === 'Paid' ? 0 : (invoice.PaymentStatus === 'Partially Paid' ? invoice.TotalAmount / 2 : invoice.TotalAmount),
  customerDetails: {
    name: invoice.CustomerName,
    address: '123 Medical Center Dr, Health City, HC 12345',
    contact: '+1 (555) 123-4567',
    email: 'billing@citygeneral.com',
  },
  paymentHistory: invoice.PaymentStatus === 'Paid' ? [{ date: '2024-01-20', amount: invoice.TotalAmount, method: 'Bank Transfer' }] : [],
});

const Invoices = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<{ id: number; name: string; role: 'admin' | 'staff'; rawRole: string } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ 
    search: '', 
    paymentStatus: 'all', 
    dateFrom: '', 
    dateTo: '' 
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.UserID) {
        const mappedRole: 'admin' | 'staff' = parsedUser.Role === 'Administrator' ? 'admin' : 'staff';
        const currentUser = {
          id: parsedUser.UserID,
          name: parsedUser.Name,
          role: mappedRole,
          rawRole: parsedUser.Role,
        };
        setUser(currentUser);
        fetchInvoices(currentUser.id, currentUser.rawRole);
      }
    } else {
      setIsLoading(false);
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    const state = location.state as { updatedInvoiceId?: string; newStatus?: FrontendPaymentStatus; paymentAmount?: number } | undefined;
    if (state?.updatedInvoiceId && state?.newStatus) {
      setInvoices(prev => prev.map(inv => inv.id === state.updatedInvoiceId ? {...inv, paymentStatus: state.newStatus!} : inv));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchInvoices = async (userId: number, userRole: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/invoices/user-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userRole }),
      });
      if (response.ok) {
        const data: BackendInvoice[] = await response.json();
        setInvoices(data.map(addMockDetailsToInvoice));
      } else {
        setInvoices([]);
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePaymentStatusUpdate = (invoiceId: string, newStatus: FrontendPaymentStatus) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, paymentStatus: newStatus }
        : invoice
    ));
    toast({ title: "Status Updated", description: `Invoice ${invoiceId} marked as ${newStatus}.` });
  };
  
  const handleInvoiceGenerate = (invoiceData: any) => {
    const newInvoice: Invoice = {
      ...addMockDetailsToInvoice({
        InvoiceID: invoices.length + 10,
        OrderID: parseInt(invoiceData.orderId.replace('ORD-', '')),
        CustomerName: invoiceData.customerName,
        TotalAmount: invoiceData.grandTotal,
        PaymentStatus: 'Unpaid',
        IssueDate: new Date().toISOString(),
        DueDate: invoiceData.dueDate,
      }),
      ...invoiceData,
    };
    setInvoices(prev => [newInvoice, ...prev]);
    toast({ title: "Invoice Generated", description: `Invoice ${newInvoice.id} has been created.` });
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const searchMatch = filters.search
        ? invoice.id.toLowerCase().includes(filters.search.toLowerCase()) || 
          invoice.customerName.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const statusMatch = filters.paymentStatus !== 'all' ? invoice.paymentStatus === filters.paymentStatus : true;
      return searchMatch && statusMatch;
    });
  }, [invoices, filters]);

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
  };
  
  // --- CORRECTED NAVIGATION LOGIC ---
  const handlePayNow = async (invoice: Invoice) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/orders/user-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user!.id, userRole: user!.rawRole }),
      });
      if (!response.ok) throw new Error("Failed to fetch orders to find match.");
      
      const orders: Order[] = await response.json();
      const fullOrder = orders.find(o => o.OrderID === invoice.orderID);

      if (fullOrder) {
          // The payment page expects a full Order object in the state
          navigate('/payment', { state: { order: fullOrder } });
      } else {
          throw new Error("Could not find the original order for this invoice.");
      }
    } catch (error: any) {
        toast({
            title: "Navigation Error",
            description: error.message || "Could not proceed to the payment page.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDownloadPDF = (invoice: Invoice) => {
    toast({ title: "PDF Downloaded", description: `Invoice ${invoice.id}.pdf has been saved.` });
  };

  const getPaymentStatusBadgeVariant = (status: FrontendPaymentStatus) => {
    switch (status) {
        case 'paid': return 'default';
        case 'unpaid': return 'destructive';
        case 'partially_paid': return 'secondary';
        case 'overdue': return 'destructive';
        default: return 'secondary';
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">...Loading</div>;
  }

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Invoices Management</h1>
          <div className="flex space-x-2">
            {user.role === 'admin' && <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>}
            <Button onClick={() => setIsGenerateModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Generate Invoice</Button>
          </div>
        </div>

        <InvoiceFilters filters={filters} onFiltersChange={setFilters} />

        <InvoicesTable
          invoices={filteredInvoices}
          userRole={user.role}
          onViewDetails={handleViewDetails}
          onPayNow={handlePayNow}
          onDownloadPDF={handleDownloadPDF}
          onPaymentStatusUpdate={handlePaymentStatusUpdate}
          getPaymentStatusBadgeVariant={getPaymentStatusBadgeVariant}
        />

        <GenerateInvoiceModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          onInvoiceGenerate={handleInvoiceGenerate}
        />

        <InvoiceDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          invoice={selectedInvoice}
          onPaymentStatusUpdate={handlePaymentStatusUpdate}
          onDownloadPDF={handleDownloadPDF}
          getPaymentStatusBadgeVariant={getPaymentStatusBadgeVariant}
        />
      </div>
    </Layout>
  );
};

export default Invoices;