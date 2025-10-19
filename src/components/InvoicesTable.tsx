import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, CreditCard, Download, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Invoice, FrontendPaymentStatus } from '@/types';

interface InvoicesTableProps {
  invoices: Invoice[];
  userRole: 'admin' | 'staff';
  onViewDetails: (invoice: Invoice) => void;
  onPayNow: (invoice: Invoice) => void;
  onDownloadPDF: (invoice: Invoice) => void;
  onPaymentStatusUpdate: (invoiceId: string, newStatus: FrontendPaymentStatus) => void;
  getPaymentStatusBadgeVariant: (status: FrontendPaymentStatus) => 'default' | 'destructive' | 'secondary';
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  userRole,
  onViewDetails,
  onPayNow,
  onDownloadPDF,
  onPaymentStatusUpdate,
  getPaymentStatusBadgeVariant
}) => {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Invoice ID</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.id}</TableCell>
              <TableCell>{invoice.orderId}</TableCell>
              <TableCell>{invoice.customerName}</TableCell>
              <TableCell>
                <Badge variant={getPaymentStatusBadgeVariant(invoice.paymentStatus)}>
                  {invoice.paymentStatus.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(invoice.grandTotal)}</TableCell>
              <TableCell>{formatDate(invoice.issueDate)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(invoice)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {userRole === 'staff' && (invoice.paymentStatus === 'unpaid' || invoice.paymentStatus === 'partially_paid') && (
                    <Button variant="default" size="sm" onClick={() => onPayNow(invoice)}>
                        <CreditCard className="w-4 h-4 mr-2" /> Pay
                    </Button>
                  )}
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                           <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDownloadPDF(invoice)}>
                           <Download className="w-4 h-4 mr-2" /> Download PDF
                        </DropdownMenuItem>
                        {userRole === 'admin' && invoice.paymentStatus !== 'paid' && (
                            <DropdownMenuItem onClick={() => onPaymentStatusUpdate(invoice.id, 'paid')}>
                                Mark as Paid
                            </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
       {invoices.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No invoices found.</p>
        </div>
      )}
    </div>
  );
};