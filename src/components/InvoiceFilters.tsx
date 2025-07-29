import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type PaymentStatus = 'paid' | 'unpaid' | 'partially_paid' | 'overdue';

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
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      paymentStatus: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = filters.search || filters.paymentStatus !== 'all' || filters.dateFrom || filters.dateTo;

  const DatePicker = ({ 
    value, 
    onChange, 
    placeholder 
  }: { 
    value: string; 
    onChange: (date: string) => void; 
    placeholder: string;
  }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const date = value ? new Date(value) : undefined;

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "MMM dd, yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                onChange(format(selectedDate, 'yyyy-MM-dd'));
                setIsOpen(false);
              }
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filters</h3>
        {hasActiveFilters && (
          <Button onClick={clearFilters} variant="ghost" size="sm">
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label htmlFor="search" className="text-sm font-medium">
            Search
          </label>
          <Input
            id="search"
            placeholder="Search by Invoice ID, Customer, or Order ID..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="paymentStatus" className="text-sm font-medium">
            Payment Status
          </label>
          <Select
            value={filters.paymentStatus}
            onValueChange={(value) => handleFilterChange('paymentStatus', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date From</label>
          <DatePicker
            value={filters.dateFrom}
            onChange={(date) => handleFilterChange('dateFrom', date)}
            placeholder="Select start date"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date To</label>
          <DatePicker
            value={filters.dateTo}
            onChange={(date) => handleFilterChange('dateTo', date)}
            placeholder="Select end date"
          />
        </div>
      </div>
    </div>
  );
};