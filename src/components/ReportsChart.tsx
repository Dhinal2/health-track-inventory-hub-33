import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ReportsChartProps {
  reportType: string;
  dateRange: { from: Date; to: Date };
  location: string;
}

export const ReportsChart: React.FC<ReportsChartProps> = ({
  reportType,
  dateRange,
  location
}) => {
  // Mock data - in real app this would be fetched based on filters
  const getChartData = () => {
    switch (reportType) {
      case 'inventory-summary':
        return {
          type: 'bar',
          title: 'Inventory Levels by Category',
          description: 'Current stock levels across different item categories',
          data: [
            { category: 'Medications', current: 1200, target: 1500 },
            { category: 'Surgical Supplies', current: 800, target: 900 },
            { category: 'Lab Equipment', current: 450, target: 500 },
            { category: 'Personal Care', current: 320, target: 400 },
            { category: 'Emergency Kits', current: 150, target: 200 }
          ]
        };

      case 'low-stock':
        return {
          type: 'pie',
          title: 'Low Stock Distribution',
          description: 'Categories with the most low-stock items',
          data: [
            { name: 'Medications', value: 45, fill: '#8884d8' },
            { name: 'Surgical Supplies', value: 30, fill: '#82ca9d' },
            { name: 'Lab Equipment', value: 15, fill: '#ffc658' },
            { name: 'Personal Care', value: 10, fill: '#ff7c7c' }
          ]
        };

      case 'order-history':
        return {
          type: 'line',
          title: 'Order Volume Trends',
          description: 'Daily order volumes over the selected period',
          data: [
            { date: '2024-01-01', orders: 12, value: 15600 },
            { date: '2024-01-02', orders: 15, value: 18200 },
            { date: '2024-01-03', orders: 8, value: 9800 },
            { date: '2024-01-04', orders: 22, value: 28400 },
            { date: '2024-01-05', orders: 18, value: 22300 },
            { date: '2024-01-06', orders: 25, value: 31200 },
            { date: '2024-01-07', orders: 14, value: 17800 }
          ]
        };

      case 'usage-trends':
        return {
          type: 'bar',
          title: 'Top 10 Most Used Items',
          description: 'Items with highest consumption rates',
          data: [
            { item: 'Disposable Gloves', usage: 2400 },
            { item: 'Syringes', usage: 1800 },
            { item: 'Bandages', usage: 1600 },
            { item: 'Alcohol Wipes', usage: 1200 },
            { item: 'Face Masks', usage: 1100 },
            { item: 'Gauze Pads', usage: 950 },
            { item: 'Thermometers', usage: 800 },
            { item: 'Blood Pressure Cuffs', usage: 650 },
            { item: 'Stethoscopes', usage: 500 },
            { item: 'IV Bags', usage: 450 }
          ]
        };

      case 'financial-summary':
        return {
          type: 'line',
          title: 'Revenue vs Costs',
          description: 'Monthly financial performance',
          data: [
            { month: 'Jan', revenue: 45000, costs: 32000 },
            { month: 'Feb', revenue: 52000, costs: 38000 },
            { month: 'Mar', revenue: 48000, costs: 35000 },
            { month: 'Apr', revenue: 58000, costs: 42000 },
            { month: 'May', revenue: 62000, costs: 45000 },
            { month: 'Jun', revenue: 55000, costs: 40000 }
          ]
        };

      default:
        return {
          type: 'bar',
          title: 'General Overview',
          description: 'Summary statistics',
          data: [
            { category: 'Total Items', value: 2847 },
            { category: 'Orders', value: 156 },
            { category: 'Reorders', value: 23 }
          ]
        };
    }
  };

  const chartData = getChartData();
  const config = {
    current: { label: "Current", color: "hsl(var(--primary))" },
    target: { label: "Target", color: "hsl(var(--muted))" },
    orders: { label: "Orders", color: "hsl(var(--primary))" },
    value: { label: "Value ($)", color: "hsl(var(--secondary))" },
    usage: { label: "Usage", color: "hsl(var(--primary))" },
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    costs: { label: "Costs", color: "hsl(var(--destructive))" }
  };

  const renderChart = () => {
    const firstDataPoint = chartData.data[0] as any;
    
    switch (chartData.type) {
      case 'bar':
        const xDataKey = firstDataPoint?.category ? "category" : firstDataPoint?.item ? "item" : "category";
        return (
          <ChartContainer config={config} className="h-[400px]">
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xDataKey}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              {firstDataPoint?.current !== undefined && <Bar dataKey="current" fill="var(--color-current)" />}
              {firstDataPoint?.target !== undefined && <Bar dataKey="target" fill="var(--color-target)" />}
              {firstDataPoint?.usage !== undefined && <Bar dataKey="usage" fill="var(--color-usage)" />}
              {firstDataPoint?.value !== undefined && <Bar dataKey="value" fill="var(--color-current)" />}
            </BarChart>
          </ChartContainer>
        );

      case 'line':
        const lineXDataKey = firstDataPoint?.date ? "date" : "month";
        return (
          <ChartContainer config={config} className="h-[400px]">
            <LineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={lineXDataKey} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {firstDataPoint?.orders !== undefined && <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" />}
              {firstDataPoint?.value !== undefined && <Line type="monotone" dataKey="value" stroke="var(--color-value)" />}
              {firstDataPoint?.revenue !== undefined && <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" />}
              {firstDataPoint?.costs !== undefined && <Line type="monotone" dataKey="costs" stroke="var(--color-costs)" />}
            </LineChart>
          </ChartContainer>
        );

      case 'pie':
        return (
          <ChartContainer config={config} className="h-[400px]">
            <PieChart>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartData.title}</CardTitle>
        <CardDescription>{chartData.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};