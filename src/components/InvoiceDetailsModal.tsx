// src/components/InvoiceDetailsModal.tsx

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, CreditCard, MapPin, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Invoice, FrontendPaymentStatus } from '@/types'; // Import the unified types

// The props interface now correctly uses the central types
interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPaymentStatusUpdate: (invoiceId: string, newStatus: FrontendPaymentStatus) => void;
  onDownloadPDF: (invoice: Invoice) => void;
  getPaymentStatusBadgeVariant: (status: FrontendPaymentStatus) => string;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentStatusUpdate,
  onDownloadPDF,
  getPaymentStatusBadgeVariant,
}) => {
  if (!invoice) return null;

  // Helper function to format the status text nicely
  const formatPaymentStatus = (status: FrontendPaymentStatus) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6" />
              {/* Use camelCase properties */}
              <span>Invoice Details - {invoice.id}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getPaymentStatusBadgeVariant(invoice.paymentStatus) as any}>
                {formatPaymentStatus(invoice.paymentStatus)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Invoice Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice ID:</span>
                  <span className="font-medium">{invoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-medium">{invoice.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date Issued:</span>
                  <span>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Customer Details</h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-muted-foreground mt-1">Customer:</span>
                  <div>
                    <div className="font-medium">{invoice.customerDetails.name}</div>
                    <div className="text-sm text-muted-foreground">{invoice.facilityName}</div>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                  <span className="text-sm">{invoice.customerDetails.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{invoice.customerDetails.contact}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{invoice.customerDetails.email}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Order Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Product</th>
                    <th className="text-center p-3">Quantity</th>
                    <th className="text-right p-3">Unit Price</th>
                    <th className="text-right p-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">ID: {item.productId}</div>
                        </div>
                      </td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">${item.unitPrice.toFixed(2)}</td>
                      <td className="text-right p-3 font-medium">${item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Payment Summary</h3>
              <div className="space-y-2 bg-muted p-4 rounded-lg">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${invoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${invoice.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Grand Total:</span>
                  <span>${invoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Amount Paid:</span>
                  <span>${invoice.amountPaid.toFixed(2)}</span>
                </div>
                {invoice.outstandingBalance > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Remaining Balance:</span>
                    <span>${invoice.outstandingBalance.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Payment History</h3>
              <div className="space-y-2">
                {invoice.paymentHistory.length > 0 ? (
                  invoice.paymentHistory.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">${payment.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(payment.date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <CreditCard className="w-4 h-4 mr-1" />
                        {payment.method}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground p-4 bg-muted rounded-lg">
                    No payments recorded
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onDownloadPDF(invoice)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};