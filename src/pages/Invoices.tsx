import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Download, FileText } from 'lucide-react';
import { InvoiceFilters } from '@/components/InvoiceFilters';
import { InvoicesTable } from '@/components/InvoicesTable';
import { InvoiceDetailsModal } from '@/components/InvoiceDetailsModal';
import { GenerateInvoiceModal } from '@/components/GenerateInvoiceModal';
import { useToast } from '@/hooks/use-toast';

type PaymentStatus = 'paid' | 'unpaid' | 'partially_paid' | 'overdue';

interface Invoice {
  id: string;
  orderId: string;
  customerName: string;
  facilityName: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  dateIssued: string;
  dueDate: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  tax: number;
  grandTotal: number;
  customerDetails: {
    name: string;
    address: string;
    contact: string;
    email: string;
  };
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: string;
  }>;
  notes?: string;
}

type FilterState = {
  search: string;
  paymentStatus: PaymentStatus | 'all';
  dateFrom: string;
  dateTo: string;
};

const Invoices = () => {
  const [user, setUser] = useState<{name: string, role: 'admin' | 'staff'} | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: parsedUser.name || parsedUser.email?.split('@')[0] || 'User',
        role: parsedUser.role || 'staff'
      });
    }
  }, []);

  const { toast } = useToast();

  // Mock invoices data
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'INV-001',
      orderId: 'ORD-001',
      customerName: 'City General Hospital',
      facilityName: 'Emergency Department',
      totalAmount: 245.50,
      paymentStatus: 'paid',
      dateIssued: '2024-01-15',
      dueDate: '2024-02-14',
      items: [
        {
          productId: 'P001',
          productName: 'Surgical Masks',
          quantity: 100,
          unitPrice: 2.25,
          subtotal: 225.00
        },
        {
          productId: 'P002',
          productName: 'Hand Sanitizer',
          quantity: 2,
          unitPrice: 10.25,
          subtotal: 20.50
        }
      ],
      tax: 24.55,
      grandTotal: 270.05,
      customerDetails: {
        name: 'City General Hospital',
        address: '123 Medical Center Dr, Health City, HC 12345',
        contact: '+1 (555) 123-4567',
        email: 'billing@citygeneral.com'
      },
      paymentHistory: [
        {
          date: '2024-01-20',
          amount: 270.05,
          method: 'Bank Transfer'
        }
      ],
      notes: 'Emergency department supplies order'
    },
    {
      id: 'INV-002',
      orderId: 'ORD-002',
      customerName: 'Regional Medical Center',
      facilityName: 'ICU',
      totalAmount: 150.00,
      paymentStatus: 'unpaid',
      dateIssued: '2024-01-14',
      dueDate: '2024-02-13',
      items: [
        {
          productId: 'P003',
          productName: 'IV Bags',
          quantity: 20,
          unitPrice: 7.50,
          subtotal: 150.00
        }
      ],
      tax: 15.00,
      grandTotal: 165.00,
      customerDetails: {
        name: 'Regional Medical Center',
        address: '456 Healthcare Blvd, Med City, MC 67890',
        contact: '+1 (555) 987-6543',
        email: 'accounts@regionalmed.com'
      },
      paymentHistory: [],
      notes: 'ICU critical supplies'
    },
    {
      id: 'INV-003',
      orderId: 'ORD-003',
      customerName: 'Community Clinic',
      facilityName: 'Surgery Department',
      totalAmount: 89.99,
      paymentStatus: 'partially_paid',
      dateIssued: '2024-01-13',
      dueDate: '2024-02-12',
      items: [
        {
          productId: 'P004',
          productName: 'Disposable Gloves',
          quantity: 5,
          unitPrice: 17.99,
          subtotal: 89.95
        }
      ],
      tax: 9.00,
      grandTotal: 98.95,
      customerDetails: {
        name: 'Community Clinic',
        address: '789 Community St, Small Town, ST 11111',
        contact: '+1 (555) 456-7890',
        email: 'billing@communityclinic.com'
      },
      paymentHistory: [
        {
          date: '2024-01-18',
          amount: 50.00,
          method: 'Credit Card'
        }
      ],
      notes: 'Surgical supplies order'
    }
  ]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handlePaymentStatusUpdate = (invoiceId: string, newStatus: PaymentStatus) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, paymentStatus: newStatus }
        : invoice
    ));

    toast({
      title: "Payment Status Updated",
      description: `Invoice ${invoiceId} has been marked as ${newStatus.replace('_', ' ')}.`,
    });
  };

  const handleInvoiceGenerate = (invoiceData: any) => {
    const newInvoice: Invoice = {
      id: `INV-${(invoices.length + 1).toString().padStart(3, '0')}`,
      orderId: invoiceData.orderId,
      customerName: invoiceData.customerName,
      facilityName: invoiceData.facilityName,
      totalAmount: invoiceData.totalAmount,
      paymentStatus: 'unpaid',
      dateIssued: new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate,
      items: invoiceData.items,
      tax: invoiceData.tax,
      grandTotal: invoiceData.grandTotal,
      customerDetails: invoiceData.customerDetails,
      paymentHistory: [],
      notes: invoiceData.notes
    };

    setInvoices(prev => [newInvoice, ...prev]);
    
    toast({
      title: "Invoice Generated",
      description: `Invoice ${newInvoice.id} has been created successfully.`,
    });
  };

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (filters.search) {
      filtered = filtered.filter(invoice => 
        invoice.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        invoice.orderId.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(invoice => invoice.paymentStatus === filters.paymentStatus);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(invoice => invoice.dateIssued >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(invoice => invoice.dateIssued <= filters.dateTo);
    }

    return filtered;
  }, [invoices, filters]);

  const handleExportCSV = () => {
    const headers = ['Invoice ID', 'Order ID', 'Customer', 'Total Amount', 'Payment Status', 'Date Issued', 'Due Date'];
    const csvData = filteredInvoices.map(invoice => [
      invoice.id,
      invoice.orderId,
      invoice.customerName,
      invoice.grandTotal.toFixed(2),
      invoice.paymentStatus.replace('_', ' '),
      invoice.dateIssued,
      invoice.dueDate
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices-export.csv';
    a.click();

    toast({
      title: "Export Complete",
      description: "Invoices have been exported to CSV.",
    });
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    // Mock PDF download
    toast({
      title: "PDF Downloaded",
      description: `Invoice ${invoice.id} has been downloaded as PDF.`,
    });
  };

  const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return 'default';
      case 'unpaid': return 'destructive';
      case 'partially_paid': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  // Calculate summary statistics
  const totalInvoices = filteredInvoices.length;
  const totalPaid = filteredInvoices.filter(inv => inv.paymentStatus === 'paid').length;
  const totalOutstanding = filteredInvoices
    .filter(inv => inv.paymentStatus !== 'paid')
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices Management</h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>Total: {totalInvoices}</span>
              <span>Paid: {totalPaid}</span>
              <span>Outstanding: ${totalOutstanding.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setIsGenerateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        </div>

        <InvoiceFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        <InvoicesTable
          invoices={filteredInvoices}
          onPaymentStatusUpdate={handlePaymentStatusUpdate}
          onViewDetails={handleViewDetails}
          onDownloadPDF={handleDownloadPDF}
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