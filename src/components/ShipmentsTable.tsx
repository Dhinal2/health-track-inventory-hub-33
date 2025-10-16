// src/components/ShipmentsTable.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Edit, AlertTriangle } from 'lucide-react';
import { Shipment, ShipmentStatus } from '@/types'; // Import types

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
  onEditShipment
}) => {
  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case 'dispatched': return 'text-blue-600 bg-blue-50';
      case 'in-transit': return 'text-yellow-600 bg-yellow-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const isOverdue = (estimatedDelivery: string, status: ShipmentStatus) => {
    if (status === 'delivered') return false;
    return new Date() > new Date(estimatedDelivery);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shipment ID</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Est. Delivery</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id} className={isOverdue(shipment.estimatedDelivery, shipment.status) ? 'bg-red-50' : ''}>
              <TableCell className="font-medium">{shipment.id}</TableCell>
              <TableCell>{shipment.orderId}</TableCell>
              <TableCell>{shipment.destination}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(shipment.status)}>
                  {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1).replace('-', ' ')}
                </Badge>
              </TableCell>
              <TableCell className={isOverdue(shipment.estimatedDelivery, shipment.status) ? 'text-red-600' : ''}>
              {formatDate(shipment.estimatedDelivery)}
</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onTrackShipment(shipment)}>
                    <MapPin className="w-4 h-4 mr-1" /> Track
                  </Button>
                  {userRole === 'admin' && (
                    <Button variant="outline" size="sm" onClick={() => onEditShipment(shipment)}>
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};