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
  id: number;
  name: string;
  role: 'admin' | 'staff';
}

// Define an interface for the summary data we expect from the backend
interface SummaryData {
  totalItemsInStock: number;
  ordersThisMonth: number;
  ordersChange: string;
  totalRevenue: number;
  revenueChange: string;
  lowStockItems: number;
}

export const Reports: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null); // State for summary data
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState('inventory-summary');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(1)), // Start of the current month
    to: new Date()
  });
  const [selectedLocation, setSelectedLocation] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const mappedRole: 'admin' | 'staff' = parsedUser.Role === 'Administrator' ? 'admin' : 'staff';
      setUser({
        id: parsedUser.UserID,
        name: parsedUser.Name || 'User',
        role: mappedRole
      });
    }
  }, []);

  // Fetch summary data when the component mounts or dateRange changes
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetch('/api/reports/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: dateRange.from, to: dateRange.to })
      })
      .then(res => res.json())
      .then(data => {
        setSummaryData(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast({ title: 'Error', description: 'Could not fetch report data.', variant: 'destructive' });
        setIsLoading(false);
      });
    }
  }, [user, dateRange, toast]);

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Analyze performance and inventory flow with comprehensive reporting tools
          </p>
        </div>

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

        {/* Pass the fetched data to the summary cards */}
        <ReportsSummaryCards 
          data={summaryData}
          isLoading={isLoading}
          userRole={user?.role || 'staff'}
        />

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="flex items-center gap-2"><FileText className="h-4 w-4" />Export CSV</Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')} className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" />Export Excel</Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="flex items-center gap-2"><Download className="h-4 w-4" />Export PDF</Button>
        </div>

        <ReportsChart 
          reportType={selectedReportType}
          dateRange={dateRange}
          location={selectedLocation}
        />

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