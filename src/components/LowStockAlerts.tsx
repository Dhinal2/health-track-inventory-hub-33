import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Import CardFooter
import { AlertTriangle, Package, RefreshCw } from 'lucide-react'; // Added Package, RefreshCw
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button'; // Ensure Button is imported

interface LowStockItem {
    // These names come directly from the backend query
    Name: string;
    StockQuantity: number;
    ReorderThreshold: number;
    // Category is not currently provided by the backend query for low stock,
    // we'll need to adjust the backend or omit it here.
    // Category?: string;
}

interface LowStockAlertsProps {
  items: LowStockItem[];
  userRole: 'admin' | 'staff';
  onReorderAll: () => void;
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ items = [], userRole, onReorderAll }) => { // Default items to empty array

    // --- THIS IS THE FIX ---
    // Calculate urgency dynamically based on stock levels
    const getUrgencyDetails = (item: LowStockItem) => {
        const percentage = item.ReorderThreshold > 0 ? (item.StockQuantity / item.ReorderThreshold) * 100 : 100;
        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low'; // Default if above threshold (though shouldn't happen here)
        let colorClasses = 'bg-gray-100 text-gray-800 border-gray-200'; // Default border color

        if (item.StockQuantity <= 0) {
            urgency = 'critical';
            colorClasses = 'bg-red-100 text-red-800 border-red-500'; // Use border color for left border
        } else if (percentage < 50) { // Example threshold for high urgency
            urgency = 'high';
            colorClasses = 'bg-orange-100 text-orange-800 border-orange-500';
        } else if (item.StockQuantity < item.ReorderThreshold) {
            urgency = 'medium';
            colorClasses = 'bg-yellow-100 text-yellow-800 border-yellow-500';
        }
        return { urgency, colorClasses };
    };

    const validItems = items || []; // Ensure items is always an array

    return (
        // --- THIS IS THE FIX ---
        // Reverted to original UI structure using standard div and classes
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
                </div>
                {/* Use live data count */}
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {validItems.length} items
                </span>
            </div>

            {validItems.length > 0 ? (
                // Use ScrollArea for consistency if list can be long
                <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-3">
                        {validItems.map((item, index) => {
                            const { colorClasses } = getUrgencyDetails(item);
                            return (
                                // --- THIS IS THE FIX ---
                                // Applied original item structure and styling
                                <div key={index} className={`p-3 rounded-lg border-l-4 ${colorClasses}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            <div>
                                                {/* Use live data field 'Name' */}
                                                <p className="font-medium text-gray-900">{item.Name}</p>
                                                {/* Category omitted as it's not in the current backend data */}
                                                {/* <p className="text-sm text-gray-600">{item.Category || 'N/A'}</p> */}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-2">
                                            <p className="text-sm font-medium text-gray-900">
                                                {/* Use live data fields 'StockQuantity' and 'ReorderThreshold' */}
                                                {item.StockQuantity} / {item.ReorderThreshold}
                                            </p>
                                            <p className="text-xs text-gray-500">Current / Threshold</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                   <p className="text-sm text-center text-gray-500">Inventory levels are healthy.</p>
                </div>
            )}

            {/* --- THIS IS THE FIX --- */}
            {/* Conditionally render the original button style for staff */}
            {userRole === 'staff' && validItems.length > 0 && (
                <button
                    onClick={onReorderAll}
                    className="w-full mt-auto py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                >
                    <RefreshCw className="w-4 h-4"/>
                    <span>Reorder All Critical Items</span>
                </button>
            )}
        </div>
    );
};