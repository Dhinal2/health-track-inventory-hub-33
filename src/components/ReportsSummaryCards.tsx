import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

interface SummaryData {
  totalItemsInStock: number;
  ordersThisMonth: number;
  ordersChange: string;
  totalRevenue: number;
  revenueChange: string;
  lowStockItems: number;
}

interface ReportsSummaryCardsProps {
  data: SummaryData | null;
  isLoading: boolean;
  userRole: 'admin' | 'staff';
}

export const ReportsSummaryCards: React.FC<ReportsSummaryCardsProps> = ({
  data,
  isLoading,
  userRole
}) => {
  const formatValue = (value: number | string, type: 'currency' | 'number' | 'percent') => {
    if (type === 'currency') return `$${Number(value).toLocaleString()}`;
    if (type === 'percent') return `${value}%`;
    return Number(value).toLocaleString();
  };

  const getCardData = () => {
    if (isLoading || !data) {
      return [
        { title: 'Total Items in Stock', value: <Skeleton className="h-8 w-24" />, change: <Skeleton className="h-4 w-32" /> },
        { title: 'Orders This Period', value: <Skeleton className="h-8 w-16" />, change: <Skeleton className="h-4 w-32" /> },
        { title: 'Low Stock Items', value: <Skeleton className="h-8 w-12" />, change: <Skeleton className="h-4 w-32" /> },
        ...(userRole === 'admin' ? [{ title: 'Total Revenue', value: <Skeleton className="h-8 w-28" />, change: <Skeleton className="h-4 w-32" /> }] : [])
      ];
    }
    
    const cards = [
      { title: 'Total Items in Stock', value: formatValue(data.totalItemsInStock, 'number'), icon: Package, change: null },
      { title: 'Orders This Period', value: formatValue(data.ordersThisMonth, 'number'), icon: ShoppingCart, change: { value: data.ordersChange, type: Number(data.ordersChange) >= 0 ? 'positive' : 'negative' } },
      { title: 'Low Stock Items', value: formatValue(data.lowStockItems, 'number'), icon: AlertTriangle, change: null },
    ];

    if (userRole === 'admin') {
      cards.push({ title: 'Total Revenue', value: formatValue(data.totalRevenue, 'currency'), icon: DollarSign, change: { value: data.revenueChange, type: Number(data.revenueChange) >= 0 ? 'positive' : 'negative' } });
    }
    
    return cards;
  };

  const cards = getCardData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            {card.icon && <card.icon className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            {card.change && (
              <div className="flex items-center space-x-1 text-xs">
                {card.change.type === 'positive' ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={`font-medium ${card.change.type === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatValue(card.change.value, 'percent')}
                </span>
                <span className="text-muted-foreground">vs. last month</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};