import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

// Use the correct types from the parent component
type ShipmentStatus = 'Pending' | 'In Transit' | 'Delivered';

interface Shipment {
  ShipmentID: number;
  OrderID: number;
  DestinationUser: string;
  Status: ShipmentStatus;
  Destination: string;
  EstimatedDelivery: string | null;
}

interface ShipmentsTableProps {
  shipments: Shipment[];
  userRole: 'admin' | 'staff';
  onStatusUpdate: (shipmentId: number, newStatus: ShipmentStatus) => void;
}

export const ShipmentsTable: React.FC<ShipmentsTableProps> = ({
  shipments,
  userRole,
  onStatusUpdate,
}) => {
  const getStatusVariant = (status: ShipmentStatus) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'In Transit': return 'default';
      case 'Delivered': return 'secondary'; // Or a custom 'success' variant
      default: return 'secondary';
    }
  };

  if (shipments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white rounded-xl shadow-sm border">
        <p>No shipments found.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipment ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {shipments.map((shipment) => (
            <tr key={shipment.ShipmentID} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-blue-600">SHP-{shipment.ShipmentID}</td>
              <td className="px-6 py-4">ORD-{shipment.OrderID}</td>
              <td className="px-6 py-4">{shipment.DestinationUser}</td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(shipment.Status)}>{shipment.Status}</Badge>
              </td>
              <td className="px-6 py-4 text-right">
                {userRole === 'admin' && shipment.Status !== 'Delivered' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onStatusUpdate(shipment.ShipmentID, 'In Transit')}>
                        Mark as In Transit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(shipment.ShipmentID, 'Delivered')}>
                        Mark as Delivered
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};