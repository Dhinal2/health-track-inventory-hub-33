
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different locations
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type ShipmentStatus = 'dispatched' | 'in-transit' | 'delivered';

interface Shipment {
  id: string;
  orderId: string;
  supplier: string;
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

interface ShipmentMapProps {
  shipment: Shipment;
}

export const ShipmentMap: React.FC<ShipmentMapProps> = ({ shipment }) => {
  // Calculate bounds to fit all markers
  const bounds = L.latLngBounds([
    shipment.originCoords,
    shipment.currentCoords,
    shipment.destinationCoords
  ]);

  // Create polyline path
  const polylinePositions: [number, number][] = [
    shipment.originCoords,
    shipment.currentCoords,
    ...(shipment.status === 'delivered' ? [shipment.destinationCoords] : [])
  ];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    // Ensure CSS is loaded
    import('leaflet/dist/leaflet.css');
  }, []);

  const polylineOptions = {
    color: '#3b82f6',
    weight: 3,
    opacity: 0.7,
    ...(shipment.status !== 'delivered' && { dashArray: '10, 10' })
  };

  return (
    <MapContainer
      bounds={bounds}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* Origin Marker */}
      <Marker position={shipment.originCoords}>
        <Popup>
          <div className="text-sm">
            <h4 className="font-medium text-green-600">Origin</h4>
            <p>{shipment.originAddress}</p>
            <p className="text-xs text-gray-500 mt-1">Supplier: {shipment.supplier}</p>
          </div>
        </Popup>
      </Marker>

      {/* Current Location Marker */}
      <Marker position={shipment.currentCoords}>
        <Popup>
          <div className="text-sm">
            <h4 className="font-medium text-blue-600">Current Location</h4>
            <p>{shipment.currentAddress}</p>
            <p className="text-xs text-gray-500 mt-1">
              Last Updated: {formatTimestamp(shipment.lastUpdated)}
            </p>
            <p className="text-xs text-gray-500">
              Status: {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1).replace('-', ' ')}
            </p>
          </div>
        </Popup>
      </Marker>

      {/* Destination Marker */}
      <Marker position={shipment.destinationCoords}>
        <Popup>
          <div className="text-sm">
            <h4 className="font-medium text-red-600">Destination</h4>
            <p>{shipment.destinationAddress}</p>
            <p className="text-xs text-gray-500 mt-1">
              Est. Delivery: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
            </p>
          </div>
        </Popup>
      </Marker>

      {/* Route Polyline */}
      <Polyline
        positions={polylinePositions}
        pathOptions={polylineOptions}
      />
    </MapContainer>
  );
};
