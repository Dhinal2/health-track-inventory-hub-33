import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/Layout';
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
  }, [navigate]);

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
      const response = await fetch('/api/invoices/user-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userRole }),
      });
      if (response.ok) {
        const data: BackendInvoice[] = await response.json();
        const formattedInvoices: Invoice[] = data.map((invoice) => {
          const grandTotal = invoice.TotalAmount;
          const amountPaid = invoice.PaymentStatus === 'Paid' ? grandTotal : (invoice.PaymentStatus === 'Partially Paid' ? grandTotal / 2 : 0);
          return {
            invoiceID: invoice.InvoiceID,
            orderID: invoice.OrderID,
            customerName: invoice.CustomerName,
            totalAmount: invoice.TotalAmount,
            paymentStatus: mapBackendStatus(invoice.PaymentStatus),
            issueDate: invoice.IssueDate,
            dueDate: invoice.DueDate || new Date().toISOString(),
            id: `INV-${invoice.InvoiceID.toString().padStart(3, '0')}`,
            orderId: `ORD-${invoice.OrderID.toString().padStart(3, '0')}`,
            facilityName: '',
            items: [],
            tax: 0,
            grandTotal,
            amountPaid,
            outstandingBalance: grandTotal - amountPaid,
            customerDetails: { name: invoice.CustomerName, address: '', contact: '', email: '' },
            paymentHistory: [],
          };
        });
        setInvoices(formattedInvoices);
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
        invoiceID: invoices.length + 100,
        orderID: parseInt(invoiceData.orderId.replace('ORD-', '')),
        customerName: invoiceData.customerName,
        totalAmount: invoiceData.totalAmount,
        paymentStatus: 'unpaid',
        issueDate: new Date().toISOString(),
        dueDate: invoiceData.dueDate,
        id: `INV-${(invoices.length + 100).toString().padStart(3, '0')}`,
        orderId: invoiceData.orderId,
        facilityName: '',
        items: invoiceData.items,
        tax: invoiceData.tax,
        grandTotal: invoiceData.grandTotal,
        amountPaid: 0,
        outstandingBalance: invoiceData.grandTotal,
        customerDetails: invoiceData.customerDetails,
        paymentHistory: [],
        notes: invoiceData.notes,
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

  const handleViewDetails = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.invoiceID}`);
      if(response.ok) {
        const details = await response.json();
        const detailedInvoice: Invoice = {
            ...invoice,
            customerDetails: {
                name: details.CustomerName,
                address: details.CustomerAddress || '',
                contact: details.CustomerContact || 'N/A',
                email: details.CustomerEmail || 'N/A',
            },
            items: details.Items.map((item: any) => ({
                productId: item.ProductID,
                productName: item.ProductName,
                quantity: item.Quantity,
                unitPrice: item.UnitPrice,
                subtotal: item.Quantity * item.UnitPrice,
            })),
            paymentHistory: details.PaymentHistory.map((p: any) => ({
                PaymentID: p.PaymentID,
                amount: p.Amount || 0,
                date: p.PaymentDate,
                method: p.PaymentMethod
            })),
        };
        setSelectedInvoice(detailedInvoice);
        setIsDetailsModalOpen(true);
      } else {
        throw new Error("Failed to fetch invoice details.");
      }
    } catch(error) {
        toast({ title: "Error", description: "Could not fetch invoice details.", variant: "destructive" });
    }
  };

  const handlePayNow = async (invoice: Invoice) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders/user-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user!.id, userRole: user!.rawRole }),
      });
      if (!response.ok) throw new Error("Failed to fetch orders to find match.");

      const orders: Order[] = await response.json();
      const fullOrder = orders.find(o => o.OrderID === invoice.orderID);

      if (fullOrder) {
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
    <Layout>
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
          onDownloadPDF={handleViewDetails} 
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
          getPaymentStatusBadgeVariant={getPaymentStatusBadgeVariant}
        />
      </div>
    </Layout>
  );
};

export default Invoices;