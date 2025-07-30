import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  RotateCcw, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Truck
} from 'lucide-react';

interface ReportsSummaryCardsProps {
  reportType: string;
  userRole: 'admin' | 'staff';
  dateRange: { from: Date; to: Date };
}

export const ReportsSummaryCards: React.FC<ReportsSummaryCardsProps> = ({
  reportType,
  userRole,
  dateRange
}) => {
  // Mock data - in real app this would come from API based on filters
  const getCardData = () => {
    const baseData = [
      {
        title: 'Total Items in Stock',
        value: '2,847',
        change: '+12%',
        changeType: 'positive' as const,
        icon: Package,
        show: true
      },
      {
        title: 'Orders This Month',
        value: '156',
        change: '+8%',
        changeType: 'positive' as const,
        icon: ShoppingCart,
        show: true
      },
      {
        title: 'Reorders Triggered',
        value: '23',
        change: '-15%',
        changeType: 'negative' as const,
        icon: RotateCcw,
        show: true
      }
    ];

    // Add admin-only cards
    if (userRole === 'admin') {
      baseData.push(
        {
          title: 'Total Revenue',
          value: '$124,580',
          change: '+18%',
          changeType: 'positive' as const,
          icon: DollarSign,
          show: reportType === 'financial-summary' || reportType === 'inventory-summary'
        },
        {
          title: 'Low Stock Items',
          value: '12',
          change: '+3',
          changeType: 'negative' as const,
          icon: AlertTriangle,
          show: reportType === 'low-stock' || reportType === 'inventory-summary'
        },
        {
          title: 'Shipments Sent',
          value: '89',
          change: '+22%',
          changeType: 'positive' as const,
          icon: Truck,
          show: reportType === 'shipments' || reportType === 'inventory-summary'
        }
      );
    }

    return baseData.filter(card => card.show);
  };

  const cards = getCardData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <div className="flex items-center space-x-1 text-xs">
              {card.changeType === 'positive' ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`font-medium ${
                card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {card.change}
              </span>
              <span className="text-muted-foreground">from last period</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};