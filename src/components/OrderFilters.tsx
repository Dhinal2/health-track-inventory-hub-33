import React from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Use the correct OrderStatus type from the parent
type OrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'Delivered';

type FilterState = {
  search: string;
  status: OrderStatus | 'all';
  dateFrom: string;
  dateTo: string;
};

interface OrderFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  userRole: 'admin' | 'staff';
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({ filters, onFiltersChange, userRole }) => {
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          placeholder="Search by Order ID or Name..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
        {/* Date filters remain the same */}
      </div>
    </div>
  );
};