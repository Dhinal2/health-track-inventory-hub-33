import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react'; // Removed 'Plus'
import { InvoiceFilters } from '@/components/InvoiceFilters';
import { InvoicesTable } from '@/components/InvoicesTable';
import { InvoiceDetailsModal } from '@/components/InvoiceDetailsModal';
// Removed GenerateInvoiceModal import
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Invoice, Order, FrontendPaymentStatus, BackendPaymentStatus } from '@/types';
import { format } from 'date-fns'; // Import format for date formatting in CSV

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
  // Removed isGenerateModalOpen state
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
          // Note: This calculation might be simplified, fetch amountPaid from backend if possible
          const amountPaid = invoice.PaymentStatus === 'Paid' ? grandTotal : (invoice.PaymentStatus === 'Partially Paid' ? grandTotal / 2 : 0);
          return {
            invoiceID: invoice.InvoiceID,
            orderID: invoice.OrderID,
            customerName: invoice.CustomerName,
            totalAmount: invoice.TotalAmount,
            paymentStatus: mapBackendStatus(invoice.PaymentStatus),
            issueDate: invoice.IssueDate,
            dueDate: invoice.DueDate || '', // Use empty string or handle null properly
            id: `INV-${invoice.InvoiceID.toString().padStart(3, '0')}`,
            orderId: `ORD-${invoice.OrderID.toString().padStart(3, '0')}`,
            facilityName: '',
            items: [],
            tax: 0, // This should ideally come from backend
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
        toast({ title: "Error", description: "Failed to fetch invoices.", variant: "destructive" });
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

  // Removed handleInvoiceGenerate function

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const searchMatch = filters.search
        ? invoice.id.toLowerCase().includes(filters.search.toLowerCase()) ||
          invoice.customerName.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const statusMatch = filters.paymentStatus !== 'all' ? invoice.paymentStatus === filters.paymentStatus : true;

      // Date Filtering
      const issueDate = new Date(invoice.issueDate);
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
      // Adjust toDate to include the whole day
      if (toDate) toDate.setHours(23, 59, 59, 999);

      const dateMatch =
        (!fromDate || issueDate >= fromDate) &&
        (!toDate || issueDate <= toDate);

      return searchMatch && statusMatch && dateMatch;
    });
  }, [invoices, filters]);

  const handleViewDetails = async (invoice: Invoice) => {
    // Keep this function as is for viewing details
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
             // Recalculate amounts based on detailed data if necessary
            amountPaid: details.PaymentHistory.reduce((sum: number, p: any) => sum + (p.Amount || 0), 0),
            outstandingBalance: invoice.grandTotal - details.PaymentHistory.reduce((sum: number, p: any) => sum + (p.Amount || 0), 0),
            tax: (details.TotalAmount / 1.1) * 0.1, // Example tax calculation if needed, adjust as per your logic
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
    // Keep this function as is
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

  // --- THIS IS THE FIX for Export ---
  const handleExport = () => {
    if (filteredInvoices.length === 0) {
      toast({ title: "No Data", description: "There are no invoices to export based on the current filters.", variant: "default" });
      return;
    }

    // Define CSV Headers
    const headers = [
      "Invoice ID",
      "Order ID",
      "Customer Name",
      "Issue Date",
      "Due Date",
      "Total Amount",
      "Amount Paid",
      "Outstanding Balance",
      "Payment Status"
    ];

    // Convert invoice data to CSV rows
    const csvRows = filteredInvoices.map(inv => [
      `"${inv.id}"`, // Enclose in quotes to handle potential commas in IDs
      `"${inv.orderId}"`,
      `"${inv.customerName.replace(/"/g, '""')}"`, // Escape double quotes within names
      format(new Date(inv.issueDate), 'yyyy-MM-dd'),
      inv.dueDate ? format(new Date(inv.dueDate), 'yyyy-MM-dd') : '',
      inv.grandTotal.toFixed(2),
      inv.amountPaid.toFixed(2),
      inv.outstandingBalance.toFixed(2),
      inv.paymentStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) // Format status
    ].join(','));

    // Combine headers and rows
    const csvString = [headers.join(','), ...csvRows].join('\n');

    // Create a Blob and trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'invoices.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up
    } else {
       toast({ title: "Export Failed", description: "Your browser does not support automatic CSV downloads.", variant: "destructive" });
    }
     toast({ title: "Export Successful", description: "Invoices.csv has been downloaded.", variant: "default" });
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

  if (!user) { // Simplified loading state check
    return <div className="min-h-screen flex items-center justify-center">...Loading User Data</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Invoices Management</h1>
          <div className="flex space-x-2">
            {/* --- THIS IS THE FIX: Export button available for all roles --- */}
            <Button variant="outline" onClick={handleExport} disabled={isLoading}>
                <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            {/* Removed Generate Invoice Button */}
          </div>
        </div>

        <InvoiceFilters filters={filters} onFiltersChange={setFilters} />

        {/* --- Display loading indicator for table --- */}
        {isLoading ? (
             <div className="text-center p-4">Loading invoices...</div>
        ) : (
            <InvoicesTable
              invoices={filteredInvoices}
              userRole={user.role}
              onViewDetails={handleViewDetails}
              onPayNow={handlePayNow}
              onDownloadPDF={handleViewDetails} // Keep linking to details modal for now
              onPaymentStatusUpdate={handlePaymentStatusUpdate}
              getPaymentStatusBadgeVariant={getPaymentStatusBadgeVariant}
            />
        )}


        {/* Removed GenerateInvoiceModal */}

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