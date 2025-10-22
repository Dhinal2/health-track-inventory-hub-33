import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, CheckCircle, AlertCircle, XCircle, Truck, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrderStatus } from '@/types'; // Assuming OrderStatus is in types.ts

// --- FIX: Add interface for the expected data structure from dashboard.js ---
interface RecentOrderData {
    orderid: number;
    PlacedBy: string; // Alias from backend is Uppercase
    orderdate: string;
    totalamount: number | string; // Might be string
    status: OrderStatus;
}

interface RecentOrdersProps {
  orders: RecentOrderData[]; // Use the specific interface
  userRole: 'admin' | 'staff';
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders = [], userRole }) => {
  const navigate = useNavigate();

  // --- FIX: Added formatCurrency helper ---
  const formatCurrency = (amount: number | string | undefined | null) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
        return '$--.--';
    }
    return `$${numericAmount.toFixed(2)}`;
  };
  // --- END FIX ---

  const getStatusIcon = (status: string | undefined | null) => {
    switch (status?.toLowerCase()) { // Safe lowercase comparison
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      case 'approved':
      case 'awaiting payment': // Added status
        return <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'dispatched':
      case 'in transit': // Added status
        return <Truck className="w-4 h-4 text-indigo-500 flex-shrink-0" />;
      case 'delivered':
      case 'received': // Added status
      case 'pending final payment': // Added status
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    }
  };

  const getStatusColor = (status: string | undefined | null) => {
     switch (status?.toLowerCase()) { // Safe lowercase comparison
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'awaiting payment': // Added status
        return 'bg-blue-100 text-blue-800';
      case 'dispatched':
      case 'in transit': // Added status
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
      case 'received': // Added status
      case 'pending final payment': // Added status
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string = '') => (name || '').split(' ').map(n => n[0]).join('').toUpperCase();
  const validOrders = orders || [];

  return (
    <Card className="h-full shadow-sm border border-gray-200 rounded-lg flex flex-col">
      <CardHeader className="border-b border-gray-100 px-6 py-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-800">Recent Orders</CardTitle>
          <CardDescription className="text-sm text-gray-500">Overview of the latest order activities.</CardDescription>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </button>
      </CardHeader>
      <CardContent className="p-6 flex-1">
        {validOrders.length > 0 ? (
           <ScrollArea className="h-[300px] -mx-3">
             <div className="space-y-3 px-3">
               {validOrders.map((order) => (
                 // --- FIX: Added unique key prop using lowercase orderid ---
                 <div
                    key={order.orderid} // Use the lowercase primary key
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                 >
                   <div className="flex items-center space-x-3">
                     {/* --- FIX: Use lowercase status --- */}
                     {getStatusIcon(order.status)}
                     <div>
                       {/* --- FIX: Use lowercase orderid --- */}
                       <p className="font-medium text-gray-900">#{order.orderid?.toString() || 'N/A'}</p>
                       {userRole === 'admin' && (
                           <div className="text-sm text-gray-600 flex items-center">
                               <Avatar className="h-4 w-4 mr-1">
                                   {/* --- FIX: Use Uppercase PlacedBy (from alias) --- */}
                                   <AvatarFallback className="text-xs bg-gray-200 text-gray-600">{getInitials(order.PlacedBy)}</AvatarFallback>
                               </Avatar>
                               {/* --- FIX: Use Uppercase PlacedBy (from alias) --- */}
                               {order.PlacedBy || 'N/A'}
                           </div>
                       )}
                     </div>
                   </div>
                   <div className="text-right">
                     {/* --- FIX: Use formatCurrency and lowercase totalamount --- */}
                     <p className="font-medium text-gray-900">{formatCurrency(order.totalamount)}</p>
                     {/* --- FIX: Use lowercase status --- */}
                     <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                       {order.status || 'N/A'}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           </ScrollArea>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-center text-gray-500">No recent orders found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};