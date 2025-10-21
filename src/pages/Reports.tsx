import React, { useState, useEffect } from 'react'; // Removed useRef, it's no longer needed
import { Layout } from '@/components/Layout';
import { ReportsFilters } from '@/components/ReportsFilters';
import { ReportsSummaryCards } from '@/components/ReportsSummaryCards';
import { ReportsChart } from '@/components/ReportsChart';
import { ReportsTable } from '@/components/ReportsTable';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePDF } from 'react-to-pdf'; // Import usePDF hook
import { format } from 'date-fns'; // Import format for CSV date formatting

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
  chartKeys?: string[];
  data: any[];
}

export const Reports: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailedLoading, setIsDetailedLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState('inventory-summary');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const { toast } = useToast();

  // PDF generation setup
  // Get toPDF function and targetRef directly from the hook
  const { toPDF, targetRef } = usePDF({ filename: 'report.pdf' });

  useEffect(() => {
    // Fetch user logic
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
    // The crashing line 'targetRef(pdfTargetRef.current)' has been removed.
  }, []); // Removed targetRef from dependency array

  // Fetch summary data logic (remains the same)
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

  // Fetch detailed data logic (remains the same)
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

  // --- CSV/Excel Export Logic (remains the same) ---
  const generateCSV = () => {
    if (!detailedData || !detailedData.data || detailedData.data.length === 0) {
      toast({ title: 'No Data', description: 'No data to export.' });
      return;
    }

    const headers = detailedData.columns;
     const keys = headers.map(header => {
       const parts = header.split(' ');
       return parts.map((part, index) => index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('');
     });

    const csvRows = [
      headers.join(','), 
      ...detailedData.data.map(row =>
        keys.map(key => {
          let value = row[key];
           if (value === undefined || value === null) return '';

          if (headers[keys.indexOf(key)].toLowerCase().includes('date') && value) {
              try {
                  value = format(new Date(value), 'yyyy-MM-dd');
              } catch {
                  // Keep original value if date parsing fails
              }
          }

          const stringValue = String(value);
          const escapedValue = stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
          return escapedValue;
        }).join(',')
      )
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedReportType}_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Successful', description: 'Report exported as CSV.' });
  };

  // --- Corrected handleExport Function ---
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!detailedData || isDetailedLoading) {
        toast({ title: 'Please wait', description: 'Report data is still loading.' });
        return;
    }

    if (format === 'csv' || format === 'excel') {
      generateCSV();
    } else if (format === 'pdf') {
       // Corrected check: Check the .current property of the ref
       if (!targetRef.current) { 
         toast({ title: 'Error', description: 'Could not find report content for PDF export.', variant: 'destructive' });
         return;
       }
      toast({ title: 'Generating PDF...', description: 'Please wait a moment.' });
      toPDF(); // Call the PDF generation function
    }
  };

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

        {/* CORRECTED: 
          Assign the 'targetRef' from usePDF directly to the 'ref' prop of the div
          you want to print.
        */}
        <div ref={targetRef} className="space-y-6">
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
      </div>
    </Layout>
  );
};