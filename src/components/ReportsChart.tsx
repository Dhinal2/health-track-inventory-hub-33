import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Skeleton } from './ui/skeleton';

interface ReportsChartProps {
    reportData: any;
    isLoading: boolean;
}

export const ReportsChart: React.FC<ReportsChartProps> = ({ reportData, isLoading }) => {
    const renderChart = () => {
        if (!reportData || !reportData.data || reportData.data.length === 0) {
            return <div className="h-[400px] flex items-center justify-center text-muted-foreground">No data to display for this report.</div>;
        }

        const { chartType, dataKey, chartKeys, data } = reportData;
        const lineColors = ["hsl(var(--primary))", "hsl(var(--secondary-foreground))"];

        const config = {
          [dataKey]: { label: "Value" },
          currentStock: { label: "Current Stock", color: "hsl(var(--primary))" },
          total: { label: "Order Total", color: lineColors[0] },
          totalRevenue: { label: "Total Revenue", color: lineColors[0] },
          averageOrderValue: { label: "Avg. Order Value", color: lineColors[1] },
          numberOfOrders: { label: "Number of Orders", color: lineColors[1] },
        };

        const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#6cdebb'];

        switch (chartType) {
            case 'bar':
                const barDataKey = chartKeys[0] || 'value';
                return (
                    <ChartContainer config={config} className="h-[400px]">
                        <BarChart data={data}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey={dataKey} tickLine={false} axisLine={false} tickMargin={8} angle={-45} textAnchor="end" height={70} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey={barDataKey} fill={`var(--color-${barDataKey})`} radius={4} />
                        </BarChart>
                    </ChartContainer>
                );

            case 'line':
                return (
                    <ChartContainer config={config} className="h-[400px]">
                        <LineChart data={data}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey={dataKey} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                            {chartKeys.map((key: string, index: number) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={lineColors[index % lineColors.length]} name={config[key]?.label || key} />
                            ))}
                        </LineChart>
                    </ChartContainer>
                );

            case 'pie':
                const pieDataKey = chartKeys[0] || 'currentStock';
                return (
                    <ChartContainer config={config} className="h-[400px] flex justify-center">
                        <PieChart>
                            <Pie data={data} dataKey={pieDataKey} nameKey={dataKey} cx="50%" cy="50%" outerRadius={120} label>
                                {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                ))}
                            {/* --- THIS IS THE FIX --- */}
                            {/* The tag was missing its closing slash. */}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent nameKey={dataKey} />} />
                            <Legend />
                        </PieChart>
                    </ChartContainer>
                );

            default:
                return <div>Unsupported chart type.</div>;
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader> <Skeleton className="h-6 w-3/4" /> <Skeleton className="h-4 w-1/2" /> </CardHeader>
                <CardContent> <Skeleton className="h-[400px] w-full" /> </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{reportData?.title || 'Report Chart'}</CardTitle>
                <CardDescription>Visual representation of the selected report data.</CardDescription>
            </CardHeader>
            <CardContent>{renderChart()}</CardContent>
        </Card>
    );
};