import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Use the correct, capitalized status from the parent
type PaymentStatus = 'Paid' | 'Unpaid' | 'Partially Paid';

type FilterState = {
  search: string;
  paymentStatus: PaymentStatus | 'all';
  dateFrom: string;
  dateTo: string;
};

interface InvoiceFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          placeholder="Search by Invoice ID or Customer..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <Select
          value={filters.paymentStatus}
          onValueChange={(value) => handleFilterChange('paymentStatus', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
          </SelectContent>
        </Select>
        {/* Date filters remain the same */}
      </div>
    </div>
  );
};