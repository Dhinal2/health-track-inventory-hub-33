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
import { Eye, Download, MoreHorizontal, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

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
  grandTotal: number;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  userRole: 'admin' | 'staff';
  onPaymentStatusUpdate: (invoiceId: string, newStatus: PaymentStatus) => void;
  onViewDetails: (invoice: Invoice) => void;
  onDownloadPDF: (invoice: Invoice) => void;
  onPayNow: (invoice: Invoice) => void;
  getPaymentStatusBadgeVariant: (status: PaymentStatus) => string;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  userRole,
  onPaymentStatusUpdate,
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

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unpaid':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'partially_paid':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatPaymentStatus = (status: PaymentStatus) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
              <TableHead>Facility</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Date Issued</TableHead>
              <TableHead>Due Date</TableHead>
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
                <TableCell className="font-medium text-blue-600">
                  {invoice.id}
                </TableCell>
                <TableCell>{invoice.orderId}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{invoice.customerName}</div>
                  </div>
                </TableCell>
                <TableCell>{invoice.facilityName}</TableCell>
                <TableCell className="font-medium">
                  ${invoice.grandTotal.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(invoice.paymentStatus)}
                    <Badge variant={getPaymentStatusBadgeVariant(invoice.paymentStatus) as any}>
                      {formatPaymentStatus(invoice.paymentStatus)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(invoice.dateIssued), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {userRole === 'staff' && invoice.paymentStatus === 'unpaid' && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPayNow(invoice);
                        }}
                      >
                        Pay Now
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(invoice);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadPDF(invoice);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {userRole === 'admin' && (
                      <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPaymentStatusUpdate(invoice.id, 'paid');
                          }}
                          disabled={invoice.paymentStatus === 'paid'}
                        >
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPaymentStatusUpdate(invoice.id, 'partially_paid');
                          }}
                          disabled={invoice.paymentStatus === 'paid'}
                        >
                          Mark as Partially Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPaymentStatusUpdate(invoice.id, 'overdue');
                          }}
                          disabled={invoice.paymentStatus === 'paid'}
                        >
                          Mark as Overdue
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, invoices.length)} of {invoices.length} invoices
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};