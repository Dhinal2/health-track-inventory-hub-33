import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { InvoiceFilters } from '@/components/InvoiceFilters';
import { InvoicesTable } from '@/components/InvoicesTable';
import { InvoiceDetailsModal } from '@/components/InvoiceDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Invoice, Order, FrontendPaymentStatus, BackendPaymentStatus } from '@/types'; // Ensure Order is needed
import { format, parseISO, isValid } from 'date-fns'; // Import helpers

// Interface for data coming FROM backend (might have string numbers)
interface BackendInvoice {
  InvoiceID: number;
  OrderID: number;
  CustomerName: string;
  TotalAmount: number | string; // Might be string
  PaymentStatus: BackendPaymentStatus; // 'Paid', 'Unpaid', 'Partially Paid'
  IssueDate: string;
  DueDate: string | null;
}

type FilterState = {
  search: string;
  paymentStatus: FrontendPaymentStatus | 'all'; // 'paid', 'unpaid', 'partially_paid'
  dateFrom: string;
  dateTo: string;
};

// Map backend status strings to frontend status strings
const mapBackendStatus = (status: BackendPaymentStatus): FrontendPaymentStatus => {
    switch (status) {
        case 'Paid': return 'paid';
        case 'Unpaid': return 'unpaid';
        case 'Partially Paid': return 'partially_paid';
        default:
          console.warn(`Unexpected backend payment status: ${status}`);
          return 'unpaid';
    }
};

const Invoices = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<{ id: number; name: string; role: 'admin' | 'staff'; rawRole: string } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      } else {
         setIsLoading(false);
         navigate('/login');
      }
    } else {
      setIsLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  // Removed useEffect for location state update

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
          const totalAmountNum = Number(invoice.TotalAmount);
          const grandTotal = isNaN(totalAmountNum) ? 0 : totalAmountNum;

          // Approx amountPaid (backend should ideally provide this)
          const amountPaid = invoice.PaymentStatus === 'Paid' ? grandTotal
                           : invoice.PaymentStatus === 'Partially Paid' ? grandTotal / 2
                           : 0;

          const frontendStatus = mapBackendStatus(invoice.PaymentStatus);

          return {
            invoiceID: invoice.InvoiceID,
            orderID: invoice.OrderID,
            customerName: invoice.CustomerName,
            totalAmount: grandTotal, // Use number
            paymentStatus: frontendStatus,
            issueDate: invoice.IssueDate,
            dueDate: invoice.DueDate || '',
            id: `INV-${invoice.InvoiceID.toString().padStart(3, '0')}`,
            orderId: `ORD-${invoice.OrderID.toString().padStart(3, '0')}`,
            facilityName: 'Default Facility', // Placeholder
            items: [], // Placeholder
            tax: 0, // Placeholder
            grandTotal, // Use number
            amountPaid,
            outstandingBalance: grandTotal - amountPaid,
            customerDetails: { name: invoice.CustomerName, address: '', contact: '', email: '' }, // Placeholders
            paymentHistory: [], // Placeholder
          };
        });

        setInvoices(formattedInvoices);
      } else {
        const errorData = await response.json();
        setInvoices([]);
        toast({ title: "Error", description: errorData.message || "Failed to fetch invoices.", variant: "destructive" });
      }
    } catch (error: any) {
      setInvoices([]);
      toast({ title: "Network Error", description: error.message || "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Optimistic UI update
  const handlePaymentStatusUpdate = (invoiceId: string, newStatus: FrontendPaymentStatus, updatedAmountPaid?: number) => {
     setInvoices(prev => prev.map(invoice => {
        if (invoice.id === invoiceId) {
            const newAmountPaid = updatedAmountPaid ??
                                  (newStatus === 'paid' ? invoice.grandTotal :
                                  (newStatus === 'partially_paid' ? invoice.grandTotal / 2 : 0));
            return {
                ...invoice,
                paymentStatus: newStatus,
                amountPaid: newAmountPaid,
                outstandingBalance: invoice.grandTotal - newAmountPaid
            };
        }
        return invoice;
    }));
    // Optional: Add toast here if needed
    toast({ title: "Status Updated (Locally)", description: `Invoice ${invoiceId} marked as ${newStatus}. Note: This might not reflect server state if direct update fails.` });
  };


  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      if (!invoice || typeof invoice.id !== 'string' || typeof invoice.customerName !== 'string') return false;

      const searchMatch = filters.search
        ? invoice.id.toLowerCase().includes(filters.search.toLowerCase()) ||
          invoice.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
          invoice.orderId?.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const statusMatch = filters.paymentStatus !== 'all' ? invoice.paymentStatus === filters.paymentStatus : true;

      // Date Filtering
      let dateMatch = true;
      if (invoice.issueDate) {
           try {
                const issueDate = parseISO(invoice.issueDate);
                 if (!isValid(issueDate)) throw new Error('Invalid issue date');

                let fromDate = filters.dateFrom ? parseISO(filters.dateFrom) : null;
                let toDate = filters.dateTo ? parseISO(filters.dateTo) : null;
                 if (fromDate && !isValid(fromDate)) fromDate = null;
                 if (toDate && !isValid(toDate)) toDate = null;

                if (toDate) toDate.setHours(23, 59, 59, 999);
                if (fromDate) fromDate.setHours(0,0,0,0);

                dateMatch = (!fromDate || issueDate >= fromDate) && (!toDate || issueDate <= toDate);

           } catch (e) {
               console.error("Date parsing error for invoice:", invoice.id, e);
               dateMatch = false;
           }
      } else {
           dateMatch = !filters.dateFrom && !filters.dateTo;
      }

      return searchMatch && statusMatch && dateMatch;
    });
  }, [invoices, filters]);

  const handleViewDetails = async (invoice: Invoice) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.invoiceID}`);
      if(response.ok) {
        const details = await response.json(); // Backend sends Uppercase

        const amountPaid = details.PaymentHistory?.reduce((sum: number, p: any) => sum + Number(p.Amount || 0), 0) ?? 0;
        const totalAmountNum = Number(details.TotalAmount);
        const grandTotal = isNaN(totalAmountNum) ? 0 : totalAmountNum;

        const detailedInvoice: Invoice = {
            ...invoice, // Start with summary
            totalAmount: grandTotal,
            grandTotal: grandTotal,
            // Ensure paymentStatus is correct based on fetched details
            paymentStatus: mapBackendStatus(details.PaymentStatus), 
            customerDetails: {
                name: details.CustomerName || invoice.customerName,
                address: details.CustomerAddress || '',
                contact: details.CustomerContact || 'N/A',
                email: details.CustomerEmail || 'N/A',
            },
            items: details.Items?.map((item: any) => ({
                productId: item.ProductID,
                productName: item.ProductName || 'N/A',
                quantity: Number(item.Quantity || 0),
                unitPrice: Number(item.UnitPrice || 0),
                subtotal: Number(item.Quantity || 0) * Number(item.UnitPrice || 0),
            })) ?? [],
             paymentHistory: details.PaymentHistory?.map((p: any) => ({
                PaymentID: p.PaymentID,
                amount: Number(p.Amount || 0),
                date: p.PaymentDate,
                method: p.PaymentMethod || 'N/A'
            })) ?? [],
            amountPaid: amountPaid,
            outstandingBalance: grandTotal - amountPaid,
            tax: grandTotal > 0 ? (grandTotal / 1.1) * 0.1 : 0, // Example tax
        };
        setSelectedInvoice(detailedInvoice);
        setIsDetailsModalOpen(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch invoice details.");
      }
    } catch(error: any) {
        toast({ title: "Error", description: error.message || "Could not fetch invoice details.", variant: "destructive" });
    } finally {
        setIsLoading(false);
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

      const orders: Order[] = await response.json(); // Backend sends Uppercase
      const fullOrder = orders.find(o => o.OrderID === invoice.orderID);

      if (fullOrder) {
          navigate('/payment', { state: { order: fullOrder } });
      } else {
          throw new Error(`Could not find the original order (ID: ${invoice.orderID}) for this invoice.`);
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

  // Export function remains the same
  const handleExport = () => {
    if (filteredInvoices.length === 0) {
      toast({ title: "No Data", description: "There are no invoices to export based on the current filters.", variant: "default" });
      return;
    }

    const headers = [
      "Invoice ID", "Order ID", "Customer Name", "Issue Date",
      "Due Date", "Total Amount", "Amount Paid", "Outstanding Balance", "Payment Status"
    ];

    const csvRows = filteredInvoices.map(inv => {
        const formatDateForCSV = (dateStr: string | null | undefined) => {
             if (!dateStr) return '';
             try {
                const date = parseISO(dateStr);
                return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
             } catch { return ''; }
        };
        const escapeCSV = (field: any): string => {
            const str = String(field ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        return [
            escapeCSV(inv.id),
            escapeCSV(inv.orderId),
            escapeCSV(inv.customerName),
            formatDateForCSV(inv.issueDate),
            formatDateForCSV(inv.dueDate),
            Number(inv.grandTotal).toFixed(2), // Ensure number
            Number(inv.amountPaid).toFixed(2), // Ensure number
            Number(inv.outstandingBalance).toFixed(2), // Ensure number
            escapeCSV(inv.paymentStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
        ].join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'invoices.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

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

  // Loading check
  if (!user || (isLoading && invoices.length === 0)) {
    return (
         <Layout>
            <div className="min-h-screen flex items-center justify-center">Loading...</div>
         </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">Invoices Management</h1>
          <div className="flex space-x-2">
            <Button
                variant="outline"
                onClick={handleExport}
                disabled={isLoading || filteredInvoices.length === 0}
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        <InvoiceFilters filters={filters} onFiltersChange={setFilters} />

        {isLoading && invoices.length === 0 ? (
            <div className="text-center p-4">Loading invoices...</div>
        ) : (
            <InvoicesTable
              invoices={filteredInvoices}
              userRole={user.role}
              onViewDetails={handleViewDetails}
              onPayNow={handlePayNow}
              // --- FIX: Pass onDownloadPDF prop ---
              onDownloadPDF={handleViewDetails} // Still using handleViewDetails for now
              // --- FIX: Pass onPaymentStatusUpdate prop ---
              onPaymentStatusUpdate={handlePaymentStatusUpdate} 
              getPaymentStatusBadgeVariant={getPaymentStatusBadgeVariant}
            />
        )}


        <InvoiceDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          invoice={selectedInvoice}
          // --- FIX: Pass onPaymentStatusUpdate prop ---
          onPaymentStatusUpdate={handlePaymentStatusUpdate} 
          getPaymentStatusBadgeVariant={getPaymentStatusBadgeVariant}
        />
      </div>
    </Layout>
  );
};

export default Invoices;