import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Download, MoreHorizontal, CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns'; // Added parseISO, isValid
import { Invoice, FrontendPaymentStatus as PaymentStatus } from '@/types';

interface InvoicesTableProps {
  invoices: Invoice[];
  userRole: 'admin' | 'staff';
  // --- FIX: This prop IS required by the parent Invoices.tsx ---
  onPaymentStatusUpdate: (invoiceId: string, newStatus: PaymentStatus) => void; 
  onViewDetails: (invoice: Invoice) => void;
  onDownloadPDF: (invoice: Invoice) => void; 
  onPayNow: (invoice: Invoice) => void;
  getPaymentStatusBadgeVariant: (status: PaymentStatus) => "default" | "destructive" | "secondary"; 
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  userRole,
  onPaymentStatusUpdate, // --- FIX: Accept the prop ---
  onViewDetails,
  onDownloadPDF,
  onPayNow,
  getPaymentStatusBadgeVariant,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- FIX: Added formatCurrency helper INSIDE this component ---
  const formatCurrency = (amount: number | string | undefined | null) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
        return '$--.--';
    }
    return `$${numericAmount.toFixed(2)}`;
  };
  // --- END ---

  // --- FIX: Added formatDate helper INSIDE this component ---
   const formatDate = (dateString: string | undefined | null) => {
     if (!dateString) return 'N/A';
     try {
       const date = parseISO(dateString); 
       if (!isValid(date)) {
           const fallbackDate = new Date(dateString);
            if(!isValid(fallbackDate)) throw new Error('Invalid Date');
            return format(fallbackDate, 'MMM dd, yyyy');
       }
       return format(date, 'MMM dd, yyyy');
     } catch {
       return 'Invalid Date';
     }
  };
  // --- END ---


  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unpaid':
      case 'overdue': 
        return <Clock className="w-4 h-4 text-yellow-500" />; 
      case 'partially_paid':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatPaymentStatus = (status: PaymentStatus) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Date Issued</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onViewDetails(invoice)} 
              >
                <TableCell className="font-medium text-blue-600">{invoice.id}</TableCell>
                <TableCell>{invoice.orderId}</TableCell>
                <TableCell>
                  <div className="font-medium">{invoice.customerName}</div>
                </TableCell>
                {/* --- FIX: Use internal formatCurrency --- */}
                <TableCell className="font-medium">{formatCurrency(invoice.grandTotal)}</TableCell> 
                <TableCell>
                  {invoice.paymentStatus === 'paid' ? (
                    <span className="text-muted-foreground">$0.00</span>
                  ) : (
                    // --- FIX: Use internal formatCurrency & ensure calculation ---
                    <span className="font-medium text-foreground">
                      {formatCurrency(Number(invoice.grandTotal) - Number(invoice.amountPaid))}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(invoice.paymentStatus)}
                    <Badge variant={getPaymentStatusBadgeVariant(invoice.paymentStatus)}>
                      {formatPaymentStatus(invoice.paymentStatus)}
                    </Badge>
                  </div>
                </TableCell>
                 {/* --- FIX: Use internal formatDate --- */}
                <TableCell>{formatDate(invoice.issueDate)}</TableCell> 
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {userRole === 'staff' && invoice.paymentStatus !== 'paid' && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onPayNow(invoice); }}
                        aria-label={`Pay invoice ${invoice.id}`}
                      >
                        <CreditCard className="w-4 h-4 mr-2" /> Pay
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); onViewDetails(invoice); }}
                      aria-label={`View details for invoice ${invoice.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); onDownloadPDF(invoice); }}
                      aria-label={`Download PDF for invoice ${invoice.id}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {/* --- FIX: Admin actions ARE in this original component --- */}
                    {userRole === 'admin' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}> {/* Use icon size */}
                            <MoreHorizontal className="w-4 h-4" />
                             <span className="sr-only">Admin Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); onPaymentStatusUpdate(invoice.id, 'paid'); }}
                            disabled={invoice.paymentStatus === 'paid'}
                            className="cursor-pointer" // Make it look clickable
                          >Mark as Paid</DropdownMenuItem>
                           <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); onPaymentStatusUpdate(invoice.id, 'partially_paid'); }}
                             disabled={invoice.paymentStatus === 'paid'}
                             className="cursor-pointer"
                           >Mark as Partially Paid</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); onPaymentStatusUpdate(invoice.id, 'overdue'); }}
                            disabled={invoice.paymentStatus === 'paid'} // Keep disabled if already paid
                            className="cursor-pointer"
                          >Mark as Overdue</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                     )}
                     {/* --- END FIX --- */}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {invoices.length === 0 && (
            <div className="text-center py-12 text-gray-500">
                <p>No invoices found matching your criteria.</p>
            </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4"> 
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, invoices.length)} of {invoices.length} invoices
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >Previous</Button>
             <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span> 
            <Button
              variant="outline" size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};