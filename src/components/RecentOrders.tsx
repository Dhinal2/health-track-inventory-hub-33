import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, CheckCircle, AlertCircle, XCircle, Truck, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentOrdersProps {
  orders: any[];
  userRole: 'admin' | 'staff';
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders = [], userRole }) => {
  const navigate = useNavigate();

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      case 'approved':
        return <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'dispatched':
        return <Truck className="w-4 h-4 text-indigo-500 flex-shrink-0" />;
      // --- THIS IS THE FIX ---
      // Now handles both "delivered" and "completed" as a success state.
      case 'delivered':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
         return 'bg-blue-100 text-blue-800';
      case 'dispatched':
        return 'bg-indigo-100 text-indigo-800';
      // --- THIS IS THE FIX ---
      // Now handles both "delivered" and "completed" as a success state.
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
         return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').toUpperCase();
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
                  <div key={order.OrderID} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.Status)}
                      <div>
                        <p className="font-medium text-gray-900">#{order.OrderID}</p>
                        {userRole === 'admin' && (
                            <div className="text-sm text-gray-600 flex items-center">
                                 <Avatar className="h-4 w-4 mr-1">
                                     <AvatarFallback className="text-xs bg-gray-200 text-gray-600">{getInitials(order.PlacedBy)}</AvatarFallback>
                                 </Avatar>
                                 {order.PlacedBy || 'N/A'}
                            </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${order.TotalAmount ? order.TotalAmount.toFixed(2) : '0.00'}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.Status)}`}>
                        {order.Status}
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