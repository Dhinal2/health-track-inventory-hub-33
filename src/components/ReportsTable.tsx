import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface ReportsTableProps {
  reportData: any;
  isLoading: boolean;
  userRole: 'admin' | 'staff';
}

export const ReportsTable: React.FC<ReportsTableProps> = ({ reportData, isLoading, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredData = useMemo(() => {
    if (!reportData?.data) return [];
    setCurrentPage(1);
    return reportData.data.filter((row: any) =>
      Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [reportData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, startIndex, itemsPerPage]);

  const renderStatusCell = (row: any, column: string) => {
    // ... (This function remains unchanged and correct)
    if (column.toLowerCase() !== 'status') return null;
    if (reportData.title === 'Current Inventory Levels') {
      const { currentStock, reorderThreshold } = row;
      if (currentStock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
      if (currentStock < reorderThreshold) return <Badge variant="secondary" className="bg-yellow-400 text-black">Low Stock</Badge>;
      return <Badge variant="secondary" className="bg-green-500 text-white">In Stock</Badge>;
    }
    if (reportData.title === 'Order History' && row.status) {
        const status = row.status.toLowerCase();
        switch (status) {
            case 'delivered': return <Badge variant="secondary" className="bg-green-500 text-white">Delivered</Badge>;
            case 'pending': return <Badge variant="secondary" className="bg-yellow-400 text-black">Pending</Badge>;
            case 'dispatched': return <Badge variant="secondary" className="bg-blue-500 text-white">Dispatched</Badge>;
            case 'approved': return <Badge variant="default">Approved</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="outline">{row.status}</Badge>;
        }
    }
    return 'N/A';
  };

  const renderCell = (value: any, column: string) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (column.toLowerCase().includes('date')) return new Date(value).toLocaleDateString();
    const currencyColumns = ['total', 'total revenue', 'average order value'];
    if (typeof value === 'number' && currencyColumns.includes(column.toLowerCase())) return `$${value.toFixed(2)}`;
    return value;
  };

  if (isLoading) {
    return ( <Card> <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader> <CardContent><Skeleton className="h-64 w-full" /></CardContent> </Card> );
  }

  if (!reportData || !reportData.data) {
    return ( <Card> <CardHeader><CardTitle>Report Data</CardTitle></CardHeader> <CardContent><p className="text-muted-foreground">No data available for this report.</p></CardContent> </Card> );
  }

  // The getHeaderKey function now correctly converts multi-word headers to camelCase keys.
  const getHeaderKey = (header: string) => {
    const parts = header.split(' ');
    const camelCase = parts.map((part, index) => {
        if (index === 0) return part.toLowerCase();
        // Handle edge case like 'ID' if needed, otherwise just capitalize first letter
        if (part.toUpperCase() === 'ID') return 'ID'; 
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join('');
    return camelCase;
  };
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>{reportData.title}</CardTitle>
        <CardDescription>Detailed breakdown for the selected report.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search table..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {reportData.columns.map((column: string, index: number) => (
                  <TableHead key={index}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row: any, rowIndex: number) => (
                <TableRow key={rowIndex}>
                  {reportData.columns.map((col: string, colIndex: number) => {
                      if (col.toLowerCase() === 'status') {
                          return <TableCell key={colIndex}>{renderStatusCell(row, col)}</TableCell>;
                      }
                      // Uses the corrected getHeaderKey function now
                      const key = getHeaderKey(col); 
                      const value = row[key] ?? 'N/A';
                      return <TableCell key={colIndex}>{renderCell(value, col)}</TableCell>
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredData.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
            <div className="text-sm font-medium">Page {currentPage} of {totalPages || 1}</div>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};