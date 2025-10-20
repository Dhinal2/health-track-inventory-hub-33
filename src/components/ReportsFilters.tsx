import React from 'react';
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
              {dateRange.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, 'LLL dd, y')} - ${format(dateRange.to, 'LLL dd, y')}`
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange as DateRange}
              onSelect={(range) => onDateRangeChange(range as { from: Date; to: Date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* Location filter has been removed */}
    </div>
  );
};