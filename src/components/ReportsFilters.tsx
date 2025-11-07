import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface ReportsFiltersProps {
  reportTypes: { value: string; label: string }[];
  selectedReportType: string;
  onReportTypeChange: (value: string) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export const ReportsFilters: React.FC<ReportsFiltersProps> = ({
  reportTypes,
  selectedReportType,
  onReportTypeChange,
  dateRange,
  onDateRangeChange,
}) => {
  // --- START OF FIX ---
  // Hold the currently selected date range in local state.
  // This allows us to show an incomplete range (e.g., just the 'from' date)
  // while the user is still picking.
  const [selected, setSelected] = useState<DateRange | undefined>(dateRange);

  // Keep this component's state in sync with the parent page
  useEffect(() => {
    setSelected(dateRange);
  }, [dateRange]);
  // --- END OF FIX ---

  return (
    <div className="bg-card p-4 rounded-lg border border-border flex flex-col md:flex-row gap-4 items-center">
      <div className="flex-1 w-full md:w-auto">
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Report Type</label>
        <Select value={selectedReportType} onValueChange={onReportTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a report" />
          </SelectTrigger>
          <SelectContent>
            {reportTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 w-full md:w-auto">
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Date Range</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {/* --- START OF FIX: Use local 'selected' state for display --- */}
              {selected?.from ? (
                selected.to ? (
                  `${format(selected.from, 'LLL dd, y')} - ${format(selected.to, 'LLL dd, y')}`
                ) : (
                  format(selected.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date</span>
              )}
              {/* --- END OF FIX --- */}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              // --- START OF FIX: Use local state and update parent only when complete ---
              selected={selected}
              onSelect={(range) => {
                setSelected(range); // Update local state immediately
                // Only notify the parent page (to trigger API calls)
                // when the user has selected a complete range.
                if (range?.from && range?.to) {
                  onDateRangeChange(range as { from: Date; to: Date });
                }
              }}
              // --- END OF FIX ---
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* Location filter has been removed */}
    </div>
  );
};