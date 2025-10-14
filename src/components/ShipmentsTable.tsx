
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
import { MapPin, Edit, AlertTriangle } from 'lucide-react';

type ShipmentStatus = 'dispatched' | 'in-transit' | 'delivered';

interface Shipment {
  id: string;
  orderId: string;
  destination: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  lastUpdated: string;
  originCoords: [number, number];
  currentCoords: [number, number];
  destinationCoords: [number, number];
  originAddress: string;
  currentAddress: string;
  destinationAddress: string;
}

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
  const getStatusVariant = (status: ShipmentStatus) => {
    switch (status) {
      case 'dispatched': return 'secondary';
      case 'in-transit': return 'default';
      case 'delivered': return 'secondary';
      default: return 'secondary';
    }
  };

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
    const today = new Date();
    const deliveryDate = new Date(estimatedDelivery);
    return today > deliveryDate;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (shipments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No shipments found matching your criteria.</p>
      </div>
    );
  }

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
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id} className={isOverdue(shipment.estimatedDelivery, shipment.status) ? 'bg-red-50' : ''}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {shipment.id}
                  {isOverdue(shipment.estimatedDelivery, shipment.status) && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </TableCell>
              <TableCell>{shipment.orderId}</TableCell>
              <TableCell>{shipment.destination}</TableCell>
              <TableCell>
                <Badge 
                  variant={getStatusVariant(shipment.status)}
                  className={getStatusColor(shipment.status)}
                >
                  {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1).replace('-', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={isOverdue(shipment.estimatedDelivery, shipment.status) ? 'text-red-600 font-medium' : ''}>
                  {formatDate(shipment.estimatedDelivery)}
                </span>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatTimestamp(shipment.lastUpdated)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTrackShipment(shipment)}
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    Track
                  </Button>
                  {userRole === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditShipment(shipment)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
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
