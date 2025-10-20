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

interface SummaryData {
  totalItemsInStock: number;
  ordersThisMonth: number;
  ordersChange: string;
  totalRevenue: number;
  revenueChange: string;
  lowStockItems: number;
}

interface DetailedData {
  title: string;
  columns: string[];
  chartType: 'bar' | 'line' | 'pie';
  dataKey: string;
  data: any[];
}

export const Reports: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailedLoading, setIsDetailedLoading] = useState(true);
  // --- THIS IS THE FIX ---
  // Default report is now 'inventory-summary'
  const [selectedReportType, setSelectedReportType] = useState('inventory-summary');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
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

  // Fetch summary data logic remains the same
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
        toast({ title: 'Error', description: 'Could not fetch summary data.', variant: 'destructive' });
        setIsLoading(false);
      });
    }
  }, [user, dateRange, toast]);

  // Fetch detailed data logic remains the same
  useEffect(() => {
    if (user) {
      setIsDetailedLoading(true);
      fetch('/api/reports/detailed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: selectedReportType, from: dateRange.from, to: dateRange.to })
      })
      .then(res => res.json())
      .then(data => {
        setDetailedData(data);
        setIsDetailedLoading(false);
      })
      .catch(() => {
        toast({ title: 'Error', description: `Could not fetch data for ${selectedReportType}.`, variant: 'destructive' });
        setDetailedData(null);
        setIsDetailedLoading(false);
      });
    }
  }, [user, selectedReportType, dateRange, toast]);

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    toast({ title: 'Exporting', description: `Your report is being exported as a ${format.toUpperCase()} file.` });
  };

  // --- THIS IS THE FIX ---
  // The reportTypes array now includes 'Inventory Summary'.
  const reportTypes = user?.role === 'admin' 
    ? [
        { value: 'inventory-summary', label: 'Inventory Summary' },
        { value: 'low-stock', label: 'Low Stock Report' },
        { value: 'order-history', label: 'Order History' },
        { value: 'financial-summary', label: 'Financial Summary' },
      ]
    : [
        { value: 'inventory-summary', label: 'Inventory Summary' },
        { value: 'low-stock', label: 'Low Stock Report' },
        { value: 'order-history', label: 'Order History' },
      ];

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">Analyze performance and inventory flow.</p>
        </div>
        <ReportsFilters
          reportTypes={reportTypes}
          selectedReportType={selectedReportType}
          onReportTypeChange={setSelectedReportType}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <ReportsSummaryCards data={summaryData} isLoading={isLoading} userRole={user.role} />

        <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="flex items-center gap-2"><FileText className="h-4 w-4" />Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')} className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" />Export Excel</Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="flex items-center gap-2"><Download className="h-4 w-4" />Export PDF</Button>
        </div>
        
        <ReportsChart 
            reportData={detailedData}
            isLoading={isDetailedLoading}
        />
        <ReportsTable
            reportData={detailedData}
            isLoading={isDetailedLoading}
            userRole={user.role}
        />
      </div>
    </Layout>
  );
};