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
import { format } from 'date-fns';
import { Invoice, FrontendPaymentStatus } from '@/types'; // Import the unified types

// The props interface now correctly uses the central types
interface InvoicesTableProps {
  invoices: Invoice[];
  userRole: 'admin' | 'staff';
  onPaymentStatusUpdate: (invoiceId: string, newStatus: FrontendPaymentStatus) => void;
  onViewDetails: (invoice: Invoice) => void;
  onDownloadPDF: (invoice: Invoice) => void;
  onPayNow: (invoice: Invoice) => void;
  getPaymentStatusBadgeVariant: (status: FrontendPaymentStatus) => string;
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
  // Helper functions
  const getStatusIcon = (status: FrontendPaymentStatus) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unpaid': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'partially_paid': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatPaymentStatus = (status: FrontendPaymentStatus) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice ID</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="hover:bg-muted/50">
              <TableCell className="font-medium text-blue-600">{invoice.id}</TableCell>
              <TableCell>{invoice.orderId}</TableCell>
              <TableCell>{invoice.customerName}</TableCell>
              <TableCell className="font-medium">${invoice.grandTotal.toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(invoice.paymentStatus)}
                  <Badge variant={getPaymentStatusBadgeVariant(invoice.paymentStatus) as any}>
                    {formatPaymentStatus(invoice.paymentStatus)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  {userRole === 'staff' && invoice.paymentStatus !== 'paid' && (
                    <Button size="sm" onClick={() => onPayNow(invoice)}>
                      <CreditCard className="w-4 h-4 mr-2" /> Pay Now
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(invoice)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDownloadPDF(invoice)}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};