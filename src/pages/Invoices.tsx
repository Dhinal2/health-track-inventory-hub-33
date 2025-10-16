import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { InvoiceFilters } from '@/components/InvoiceFilters';
import { InvoicesTable } from '@/components/InvoicesTable';
import { InvoiceDetailsModal } from '@/components/InvoiceDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Types to match the database
type PaymentStatus = 'Paid' | 'Unpaid' | 'Partially Paid';

interface Invoice {
  InvoiceID: number;
  OrderID: number;
  CustomerName: string;
  TotalAmount: number;
  PaymentStatus: PaymentStatus;
  IssueDate: string;
  DueDate: string | null;
}

type FilterState = {
  search: string;
  paymentStatus: PaymentStatus | 'all';
  dateFrom: string;
  dateTo: string;
};

const Invoices = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number; name: string; role: 'admin' | 'staff'; rawRole: string } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
        const parsedUser = JSON.parse(userData);
        // THE FIX: Use parsedUser.Role and parsedUser.UserID (PascalCase)
        if (parsedUser.UserID) {
            const mappedRole: 'admin' | 'staff' = parsedUser.Role === 'Administrator' ? 'admin' : 'staff';
            const currentUser = {
                id: parsedUser.UserID,
                name: parsedUser.Name,
                role: mappedRole,
                rawRole: parsedUser.Role
            };
            setUser(currentUser);
            fetchInvoices(currentUser.id, currentUser.rawRole);
        }
    } else {
        setIsLoading(false);
    }
}, []);


  const fetchInvoices = async (userId: number, userRole: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/invoices/user-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userRole }),
      });
      if (response.ok) {
        setInvoices(await response.json());
      } else {
        toast({ title: "Info", description: "No invoices found." });
        setInvoices([]);
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const [filters, setFilters] = useState<FilterState>({ search: '', paymentStatus: 'all', dateFrom: '', dateTo: '' });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const searchMatch = filters.search
        ? invoice.InvoiceID.toString().includes(filters.search) || invoice.CustomerName.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const statusMatch = filters.paymentStatus !== 'all' ? invoice.PaymentStatus === filters.paymentStatus : true;
      return searchMatch && statusMatch;
    });
  }, [invoices, filters]);

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
  };

  const handlePayNow = (invoice: Invoice) => {
    navigate('/payment', { state: { invoice } });
  };

  if (isLoading || !user) {
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
          <h1 className="text-2xl font-bold text-gray-900">Invoices Management</h1>
          {user.role === 'admin' && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          )}
        </div>

        <InvoiceFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        <InvoicesTable
          invoices={filteredInvoices}
          userRole={user.role}
          onViewDetails={handleViewDetails}
          onPayNow={handlePayNow}
        />

        {/* The Details Modal will need to be updated to match the new Invoice type */}
        <InvoiceDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          invoice={selectedInvoice}
        />
      </div>
    </Layout>
  );
};

export default Invoices;