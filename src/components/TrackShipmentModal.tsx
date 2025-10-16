import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShipmentMap } from './ShipmentMap';
import { Shipment, ShipmentStatus } from '@/types'; // <-- This is the only place the types should come from

// This interface defines the props for our component. It was likely deleted.
interface TrackShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
}

export const TrackShipmentModal: React.FC<TrackShipmentModalProps> = ({
  isOpen,
  onClose,
  shipment
}) => {
  if (!shipment) return null;

  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case 'dispatched': return 'text-blue-600 bg-blue-50';
      case 'in-transit': return 'text-yellow-600 bg-yellow-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Use the correct camelCase property 'id' */}
          <DialogTitle>Track Shipment - {shipment.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              {/* Use the correct camelCase property 'orderId' */}
              <p className="font-medium">{shipment.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={getStatusColor(shipment.status)}>
                {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1).replace('-', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Destination</p>
              {/* Use the correct camelCase property 'destination' */}
              <p className="font-medium">{shipment.destination}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Delivery</p>
              {/* Use the correct camelCase property 'estimatedDelivery' */}
              <p className="font-medium">{new Date(shipment.estimatedDelivery).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              {/* Use the correct camelCase property 'lastUpdated' */}
              <p className="font-medium">{formatTimestamp(shipment.lastUpdated)}</p>
            </div>
          </div>

          <div className="h-96 w-full border rounded-lg overflow-hidden">
            <ShipmentMap shipment={shipment} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-600 mb-2">Origin</h4>
              <p className="text-sm text-gray-600">{shipment.originAddress}</p>
              <p className="text-xs text-gray-400 mt-1">
                {shipment.originCoords[0].toFixed(4)}, {shipment.originCoords[1].toFixed(4)}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-blue-600 mb-2">Current Location</h4>
              <p className="text-sm text-gray-600">{shipment.currentAddress}</p>
              <p className="text-xs text-gray-400 mt-1">
                {shipment.currentCoords[0].toFixed(4)}, {shipment.currentCoords[1].toFixed(4)}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-red-600 mb-2">Destination</h4>
              <p className="text-sm text-gray-600">{shipment.destinationAddress}</p>
              <p className="text-xs text-gray-400 mt-1">
                {shipment.destinationCoords[0].toFixed(4)}, {shipment.destinationCoords[1].toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};