import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Skeleton } from './ui/skeleton';

interface InventoryChartProps {
    data: Array<{ date: string; ItemsUsed: number }>;
}

export const InventoryChart: React.FC<InventoryChartProps> = ({ data }) => {

    const chartConfig = {
        ItemsUsed: { label: "Items Used", color: "hsl(var(--primary))" },
    };

    const hasData = data && data.length > 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Stock Usage</h3>
                <p className="text-sm text-gray-500">Items used per day (Last 7 days)</p>
            </div>

            <div className="flex-1 min-h-[250px]">
                {hasData ? (
                    // --- THIS IS THE FIX ---
                    // ChartContainer now correctly wraps ResponsiveContainer and BarChart
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3"/>
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    fontSize={12}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    fontSize={12}
                                    allowDecimals={false}
                                 />
                                {/* Tooltip is now correctly nested within ChartContainer */}
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dashed" />}
                                />
                                <Bar
                                    dataKey="ItemsUsed"
                                    fill="var(--color-ItemsUsed)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer> // End ChartContainer
                ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                        No usage data available for the past week.
                    </div>
                )}
            </div>
        </div>
    );
};