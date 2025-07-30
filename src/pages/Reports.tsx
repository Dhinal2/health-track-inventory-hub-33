import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { ReportsFilters } from '@/components/ReportsFilters';
import { ReportsSummaryCards } from '@/components/ReportsSummaryCards';
import { ReportsChart } from '@/components/ReportsChart';
import { ReportsTable } from '@/components/ReportsTable';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  name: string;
  role: 'admin' | 'staff';
}

export const Reports: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedReportType, setSelectedReportType] = useState('inventory-summary');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [selectedLocation, setSelectedLocation] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    // Simulate getting user from localStorage or auth context
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: parsedUser.name || parsedUser.email?.split('@')[0] || 'User',
        role: parsedUser.role || 'staff'
      });
    }
  }, []);

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}`,
      description: `Your ${selectedReportType} report is being prepared for download.`,
    });
  };

  const reportTypes = user?.role === 'admin' 
    ? [
        { value: 'inventory-summary', label: 'Inventory Summary' },
        { value: 'low-stock', label: 'Low Stock Report' },
        { value: 'order-history', label: 'Order History' },
        { value: 'usage-trends', label: 'Usage Trends' },
        { value: 'shipments', label: 'Shipments Report' },
        { value: 'financial-summary', label: 'Financial Summary' },
        { value: 'supplier-performance', label: 'Supplier Performance' }
      ]
    : [
        { value: 'inventory-summary', label: 'Inventory Summary' },
        { value: 'order-history', label: 'Order History' },
        { value: 'usage-trends', label: 'Usage Trends' }
      ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Analyze performance and inventory flow with comprehensive reporting tools
          </p>
        </div>

        {/* Filters */}
        <ReportsFilters
          reportTypes={reportTypes}
          selectedReportType={selectedReportType}
          onReportTypeChange={setSelectedReportType}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          showLocationFilter={user?.role === 'admin'}
        />

        {/* Summary Cards */}
        <ReportsSummaryCards 
          reportType={selectedReportType}
          userRole={user?.role || 'staff'}
          dateRange={dateRange}
        />

        {/* Export Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>

        {/* Charts Section */}
        <ReportsChart 
          reportType={selectedReportType}
          dateRange={dateRange}
          location={selectedLocation}
        />

        {/* Detailed Table */}
        <ReportsTable 
          reportType={selectedReportType}
          dateRange={dateRange}
          location={selectedLocation}
          userRole={user?.role || 'staff'}
        />
      </div>
    </Layout>
  );
};