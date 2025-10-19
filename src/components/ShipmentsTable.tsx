import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Truck, Pencil } from 'lucide-react';
import { Shipment, ShipmentStatus } from '../types';

interface ShipmentsTableProps {
  shipments: Shipment[];
  userRole: 'admin' | 'staff';
  onTrackShipment: (shipment: Shipment) => void;
  onEditShipment: (shipment: Shipment) => void;
}

export const ShipmentsTable: React.FC<ShipmentsTableProps> = ({
  shipments,
  userRole,
  onTrackShipment,
  onEditShipment,
}) => {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Correct formatting logic for Order ID
  const formatOrderId = (orderId: number) => {
    return `ORD-${String(orderId).padStart(4, '0')}`;
  };

  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case 'dispatched': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in-transit': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">Shipment ID</TableHead>
            <TableHead className="font-semibold">Order ID</TableHead>
            <TableHead className="font-semibold">Destination</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Est. Delivery</TableHead>
            <TableHead className="font-semibold text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">SHP-{shipment.shipmentID.toString().padStart(4, '0')}</TableCell>
              {/* The fix is here: we now call formatOrderId with the numeric shipment.orderID */}
              <TableCell className="font-medium">{formatOrderId(shipment.orderID)}</TableCell>
              <TableCell>{shipment.destinationAddress}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`border ${getStatusColor(shipment.status)}`}>
                  {shipment.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(shipment.estimatedDelivery)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onTrackShipment(shipment)}>
                    <Truck className="w-4 h-4" />
                  </Button>
                  {userRole === 'admin' && (
                    <Button variant="ghost" size="icon" onClick={() => onEditShipment(shipment)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
       {shipments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No shipments found.</p>
        </div>
      )}
    </div>
  );
};