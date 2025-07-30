import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReportsFiltersProps {
  reportTypes: { value: string; label: string }[];
  selectedReportType: string;
  onReportTypeChange: (value: string) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  showLocationFilter: boolean;
}

export const ReportsFilters: React.FC<ReportsFiltersProps> = ({
  reportTypes,
  selectedReportType,
  onReportTypeChange,
  dateRange,
  onDateRangeChange,
  selectedLocation,
  onLocationChange,
  showLocationFilter
}) => {
  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'warehouse-a', label: 'Warehouse A' },
    { value: 'warehouse-b', label: 'Warehouse B' },
    { value: 'clinic-north', label: 'North Clinic' },
    { value: 'clinic-south', label: 'South Clinic' }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Report Type</label>
            <Select value={selectedReportType} onValueChange={onReportTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date Range</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "MMM dd") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && onDateRangeChange({ ...dateRange, from: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "MMM dd") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && onDateRangeChange({ ...dateRange, to: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Location Filter (Admin only) */}
          {showLocationFilter && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Location</label>
              <Select value={selectedLocation} onValueChange={onLocationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quick Date Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Quick Filter</label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  onDateRangeChange({ from: lastWeek, to: today });
                }}
              >
                7D
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  onDateRangeChange({ from: lastMonth, to: today });
                }}
              >
                30D
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastQuarter = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                  onDateRangeChange({ from: lastQuarter, to: today });
                }}
              >
                90D
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};