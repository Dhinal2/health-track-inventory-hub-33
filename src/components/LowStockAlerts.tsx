import React from 'react';
import { AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';


interface LowStockItem {
    name: string; // Use lowercase
    stockquantity: number | string | null | undefined; // Use lowercase
    reorderthreshold: number | string | null | undefined; // Use lowercase
    UserName?: string; // Keep Uppercase alias from backend
    // Add productid/inventoryid if backend starts sending them for keys

}

interface LowStockAlertsProps {
  items: LowStockItem[];
  userRole: 'admin' | 'staff';
  onReorderAll: () => void;
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ items = [], userRole, onReorderAll }) => {

    // Calculate urgency dynamically based on stock levels
    const getUrgencyDetails = (item: LowStockItem) => {
        // --- FIX: Use lowercase keys for calculation ---
        const stock = Number(item.stockquantity);
        const threshold = Number(item.reorderthreshold);
        // --- END FIX ---

        // Handle NaN cases from Number conversion
        if (isNaN(stock) || isNaN(threshold)) {
             return { urgency: 'medium', colorClasses: 'bg-gray-100 text-gray-800 border-gray-500' };
        }

        const percentage = threshold > 0 ? (stock / threshold) * 100 : 100;
        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
        let colorClasses = 'bg-gray-100 text-gray-800 border-gray-200';

        if (stock <= 0) {
            urgency = 'critical';
            colorClasses = 'bg-red-100 text-red-800 border-red-500';
        } else if (percentage < 50) {
            urgency = 'high';
            colorClasses = 'bg-orange-100 text-orange-800 border-orange-500';
        } else if (stock < threshold) {
            urgency = 'medium';
            colorClasses = 'bg-yellow-100 text-yellow-800 border-yellow-500';
        }

        return { urgency, colorClasses };
    };

    // Helper to safely display numbers or 'N/A'
    const displayValue = (value: number | string | null | undefined) => {
        const num = Number(value);
        return isNaN(num) ? 'N/A' : num;
    };

    const validItems = items || [];

    return (
        // Using the div structure provided in your code
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Top 5 Low Stock Items</h3>
                </div>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {validItems.length} items
                </span>
            </div>

            {validItems.length > 0 ? (
                <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-3">
                        {validItems.map((item, index) => { // Use index for key
                            const { colorClasses } = getUrgencyDetails(item);
                            return (
                                // Use index for key if no unique ID available
                                <div key={`low-stock-item-${index}`} className={`p-3 rounded-lg border-l-4 ${colorClasses}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            <div>
                                                {/* --- Use lowercase name --- */}
                                                <p className="font-medium text-gray-900">{item.name || 'N/A'}</p>
                                                {/* Use Uppercase UserName (alias) */}
                                                {userRole === 'admin' && item.UserName && (
                                                     <p className="text-xs text-gray-500">Owner: {item.UserName}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-2">
                                            <p className="text-sm font-medium text-gray-900">
                                                {/* ---  Use lowercase keys with displayValue --- */}
                                                {displayValue(item.stockquantity)} / {displayValue(item.reorderthreshold)}
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

            {/* Conditionally render reorder button for staff */}
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