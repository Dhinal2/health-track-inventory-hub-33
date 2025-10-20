import React from 'react';
import { Skeleton } from './ui/skeleton'; // Keep Skeleton for loading state

interface InventoryChartProps {
    data: Array<{ date: string; ItemsUsed: number }>;
}

export const InventoryChart: React.FC<InventoryChartProps> = ({ data }) => {
    
    const hasData = data && data.length > 0;

    // Calculate total and max usage from the live data
    const totalUsage = hasData ? data.reduce((sum, item) => sum + item.ItemsUsed, 0) : 0;
    const maxUsage = hasData ? Math.max(...data.map(item => item.ItemsUsed), 1) : 1; // Use 1 as a minimum to avoid division by zero

    return (
        // --- THIS IS THE FIX ---
        // Replaced the recharts implementation with your desired div-based UI
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Stock Usage</h3>
                 <p className="text-sm text-gray-500">Items used per day</p>
            </div>

            {hasData ? (
                <>
                    {/* Bar chart area */}
                    <div className="space-y-4 flex-1">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3">
                                {/* Day label (e.g., "Mon") */}
                                <span className="text-xs font-medium text-gray-600 w-8">{item.date}</span>
                                <div className="flex-1 flex items-center space-x-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        {/* Dynamic blue bar */}
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(item.ItemsUsed / maxUsage) * 100}%` }}
                                        ></div>
                                    </div>
                                    {/* Usage number */}
                                    <span className="text-xs font-medium text-gray-900 w-8">{item.ItemsUsed}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer with total usage */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total Usage This Week</span>
                            <span className="font-semibold text-gray-900">{totalUsage} items</span>
                        </div>
                    </div>
                </>
            ) : (
                // Display a message if no data is available
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-center text-gray-500">No usage data for the past week.</p>
                </div>
            )}
        </div>
    );
};