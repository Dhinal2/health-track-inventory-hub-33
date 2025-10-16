import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface InvoicesTableProps {
  invoices: Invoice[];
  userRole: 'admin' | 'staff';
  onViewDetails: (invoice: Invoice) => void;
  onPayNow: (invoice: Invoice) => void;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  userRole,
  onViewDetails,
  onPayNow,
}) => {
  const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Unpaid': return 'destructive';
      case 'Partially Paid': return 'secondary';
      default: return 'secondary';
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white rounded-xl shadow-sm border">
        <p>No invoices found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Issued</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.InvoiceID} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-blue-600">INV-{invoice.InvoiceID}</td>
              <td className="px-6 py-4">ORD-{invoice.OrderID}</td>
              <td className="px-6 py-4">{invoice.CustomerName}</td>
              <td className="px-6 py-4 font-medium">${invoice.TotalAmount.toFixed(2)}</td>
              <td className="px-6 py-4">
                <Badge variant={getPaymentStatusBadgeVariant(invoice.PaymentStatus)}>{invoice.PaymentStatus}</Badge>
              </td>
              <td className="px-6 py-4">{new Date(invoice.IssueDate).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onViewDetails(invoice)}>Details</Button>
                    {userRole === 'staff' && invoice.PaymentStatus !== 'Paid' && (
                        <Button size="sm" onClick={() => onPayNow(invoice)}>Pay Now</Button>
                    )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};