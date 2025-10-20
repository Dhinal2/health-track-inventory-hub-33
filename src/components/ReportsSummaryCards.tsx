import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface ReportsSummaryCardsProps {
  data: any;
  isLoading: boolean;
  userRole: 'admin' | 'staff';
}

const SummaryCard = ({ title, value, change, icon: Icon, isPositive }: { title: string; value: string | number; change?: string; icon: React.ElementType; isPositive: boolean; }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'} flex items-center`}>
          {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
          {change} vs. last period
        </p>
      )}
    </CardContent>
  </Card>
);


export const ReportsSummaryCards: React.FC<ReportsSummaryCardsProps> = ({ data, isLoading, userRole }) => {
  if (isLoading || !data) {
    const cardCount = userRole === 'admin' ? 4 : 3;
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cardCount }).map((_, index) => (
          <Card key={index}>
            <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // The logic now correctly checks if the change string starts with '+'
  const isOrdersPositive = data.ordersChange?.startsWith('+');
  const isRevenuePositive = data.revenueChange?.startsWith('+');

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard title="Total Items in Stock" value={data.totalItemsInStock} icon={Package} isPositive={true} />
      <SummaryCard title="Orders This Period" value={data.ordersThisMonth} change={data.ordersChange} icon={ShoppingCart} isPositive={isOrdersPositive} />
      {userRole === 'admin' && <SummaryCard title="Total Revenue" value={`$${data.totalRevenue.toFixed(2)}`} change={data.revenueChange} icon={DollarSign} isPositive={isRevenuePositive} />}
      <SummaryCard title="Low Stock Items" value={data.lowStockItems} icon={AlertTriangle} isPositive={false} />
    </div>
  );
};