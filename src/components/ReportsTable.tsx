import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReportsTableProps {
  reportType: string;
  dateRange: { from: Date; to: Date };
  location: string;
  userRole: 'admin' | 'staff';
}

export const ReportsTable: React.FC<ReportsTableProps> = ({
  reportType,
  dateRange,
  location,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mock data generator based on report type
  const getTableData = () => {
    switch (reportType) {
      case 'inventory-summary':
        return {
          title: 'Inventory Summary Details',
          columns: ['Item Name', 'SKU', 'Category', 'Current Stock', 'Min Level', 'Status'],
          data: [
            {
              id: 1,
              itemName: 'Disposable Gloves (Box)',
              sku: 'GLV-001',
              category: 'Personal Care',
              currentStock: 450,
              minLevel: 200,
              status: 'In Stock'
            },
            {
              id: 2,
              itemName: 'Syringes 10ml',
              sku: 'SYR-010',
              category: 'Medications',
              currentStock: 89,
              minLevel: 100,
              status: 'Low Stock'
            },
            {
              id: 3,
              itemName: 'Blood Pressure Monitor',
              sku: 'BPM-001',
              category: 'Equipment',
              currentStock: 25,
              minLevel: 15,
              status: 'In Stock'
            },
            {
              id: 4,
              itemName: 'Alcohol Wipes',
              sku: 'ALW-001',
              category: 'Personal Care',
              currentStock: 320,
              minLevel: 150,
              status: 'In Stock'
            },
            {
              id: 5,
              itemName: 'Thermometers Digital',
              sku: 'THM-001',
              category: 'Equipment',
              currentStock: 12,
              minLevel: 20,
              status: 'Critical'
            }
          ]
        };

      case 'order-history':
        return {
          title: 'Order History Details',
          columns: ['Order ID', 'Date', 'Items', 'Total Amount', 'Status', 'Supplier'],
          data: [
            {
              id: 1,
              orderId: 'ORD-2024-001',
              date: '2024-01-15',
              items: 8,
              totalAmount: '$2,450',
              status: 'Completed',
              supplier: 'MedSupply Co.'
            },
            {
              id: 2,
              orderId: 'ORD-2024-002',
              date: '2024-01-14',
              items: 12,
              totalAmount: '$3,200',
              status: 'Shipped',
              supplier: 'Healthcare Plus'
            },
            {
              id: 3,
              orderId: 'ORD-2024-003',
              date: '2024-01-13',
              items: 5,
              totalAmount: '$890',
              status: 'Processing',
              supplier: 'MedSupply Co.'
            }
          ]
        };

      case 'low-stock':
        return {
          title: 'Low Stock Items',
          columns: ['Item Name', 'Current Stock', 'Min Level', 'Days Until Out', 'Action Required'],
          data: [
            {
              id: 1,
              itemName: 'Syringes 10ml',
              currentStock: 89,
              minLevel: 100,
              daysUntilOut: 5,
              actionRequired: 'Reorder Now'
            },
            {
              id: 2,
              itemName: 'Thermometers Digital',
              currentStock: 12,
              minLevel: 20,
              daysUntilOut: 2,
              actionRequired: 'Critical'
            },
            {
              id: 3,
              itemName: 'IV Bags 500ml',
              currentStock: 45,
              minLevel: 50,
              daysUntilOut: 8,
              actionRequired: 'Monitor'
            }
          ]
        };

      case 'financial-summary':
        if (userRole !== 'admin') {
          return {
            title: 'Access Restricted',
            columns: ['Message'],
            data: [{ id: 1, message: 'Financial data is only available to administrators.' }]
          };
        }
        return {
          title: 'Financial Summary',
          columns: ['Category', 'Revenue', 'Costs', 'Profit', 'Margin %'],
          data: [
            {
              id: 1,
              category: 'Medications',
              revenue: '$45,200',
              costs: '$32,100',
              profit: '$13,100',
              margin: '29%'
            },
            {
              id: 2,
              category: 'Equipment',
              revenue: '$28,500',
              costs: '$21,200',
              profit: '$7,300',
              margin: '26%'
            },
            {
              id: 3,
              category: 'Supplies',
              revenue: '$18,900',
              costs: '$12,400',
              profit: '$6,500',
              margin: '34%'
            }
          ]
        };

      default:
        return {
          title: 'Report Data',
          columns: ['ID', 'Description', 'Value'],
          data: [
            { id: 1, description: 'Total Items', value: '2,847' },
            { id: 2, description: 'Active Orders', value: '156' },
            { id: 3, description: 'Pending Shipments', value: '23' }
          ]
        };
    }
  };

  const tableData = getTableData();
  
  // Filter data based on search term
  const filteredData = tableData.data.filter((row: any) =>
    Object.values(row).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: string } = {
      'In Stock': 'default',
      'Low Stock': 'warning',
      'Critical': 'destructive',
      'Completed': 'default',
      'Shipped': 'secondary',
      'Processing': 'warning',
      'Reorder Now': 'destructive',
      'Monitor': 'secondary'
    };

    return (
      <Badge variant={statusConfig[status] as any || 'default'}>
        {status}
      </Badge>
    );
  };

  const renderCell = (key: string, value: any) => {
    if (key.toLowerCase().includes('status') || key.toLowerCase().includes('action')) {
      return getStatusBadge(value);
    }
    return value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tableData.title}</CardTitle>
        <CardDescription>
          Detailed breakdown for the selected report type and filters
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Pagination Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {tableData.columns.map((column, index) => (
                  <TableHead key={index}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row: any) => (
                <TableRow key={row.id}>
                  {Object.entries(row)
                    .filter(([key]) => key !== 'id')
                    .map(([key, value], index) => (
                      <TableCell key={index}>
                        {renderCell(key, value)}
                      </TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};