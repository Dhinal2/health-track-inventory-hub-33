import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';

// Use the correct types from the parent component
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

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ isOpen, onClose, invoice }) => {
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invoice Details: INV-{invoice.InvoiceID}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div><strong>Order ID:</strong> ORD-{invoice.OrderID}</div>
            <div><strong>Customer:</strong> {invoice.CustomerName}</div>
            <div><strong>Total Amount:</strong> ${invoice.TotalAmount.toFixed(2)}</div>
            <div><strong>Status:</strong> <Badge>{invoice.PaymentStatus}</Badge></div>
            <div><strong>Date Issued:</strong> {new Date(invoice.IssueDate).toLocaleDateString()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};