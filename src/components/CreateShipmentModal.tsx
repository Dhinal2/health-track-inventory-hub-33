
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShipmentCreate: (shipment: Omit<Shipment, 'id' | 'lastUpdated'>) => void;
}

export const CreateShipmentModal: React.FC<CreateShipmentModalProps> = ({
  isOpen,
  onClose,
  onShipmentCreate
}) => {
  const [formData, setFormData] = useState({
    orderId: '',
    destination: '',
    status: 'dispatched' as ShipmentStatus,
    estimatedDelivery: '',
    originLat: '',
    originLng: '',
    originAddress: '',
    currentLat: '',
    currentLng: '',
    currentAddress: '',
    destinationLat: '',
    destinationLng: '',
    destinationAddress: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.orderId.trim()) newErrors.orderId = 'Order ID is required';
    if (!formData.destination.trim()) newErrors.destination = 'Destination is required';
    if (!formData.estimatedDelivery) newErrors.estimatedDelivery = 'Estimated delivery is required';
    
    // Validate coordinates
    if (!formData.originLat || !formData.originLng) {
      newErrors.originCoords = 'Origin coordinates are required';
    } else if (isNaN(Number(formData.originLat)) || isNaN(Number(formData.originLng))) {
      newErrors.originCoords = 'Invalid origin coordinates';
    }

    if (!formData.currentLat || !formData.currentLng) {
      newErrors.currentCoords = 'Current coordinates are required';
    } else if (isNaN(Number(formData.currentLat)) || isNaN(Number(formData.currentLng))) {
      newErrors.currentCoords = 'Invalid current coordinates';
    }

    if (!formData.destinationLat || !formData.destinationLng) {
      newErrors.destinationCoords = 'Destination coordinates are required';
    } else if (isNaN(Number(formData.destinationLat)) || isNaN(Number(formData.destinationLng))) {
      newErrors.destinationCoords = 'Invalid destination coordinates';
    }

    if (!formData.originAddress.trim()) newErrors.originAddress = 'Origin address is required';
    if (!formData.currentAddress.trim()) newErrors.currentAddress = 'Current address is required';
    if (!formData.destinationAddress.trim()) newErrors.destinationAddress = 'Destination address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const shipmentData: Omit<Shipment, 'id' | 'lastUpdated'> = {
      orderId: formData.orderId,
      destination: formData.destination,
      status: formData.status,
      estimatedDelivery: formData.estimatedDelivery,
      originCoords: [Number(formData.originLat), Number(formData.originLng)],
      currentCoords: [Number(formData.currentLat), Number(formData.currentLng)],
      destinationCoords: [Number(formData.destinationLat), Number(formData.destinationLng)],
      originAddress: formData.originAddress,
      currentAddress: formData.currentAddress,
      destinationAddress: formData.destinationAddress
    };

    onShipmentCreate(shipmentData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      orderId: '',
      destination: '',
      status: 'dispatched' as ShipmentStatus,
      estimatedDelivery: '',
      originLat: '',
      originLng: '',
      originAddress: '',
      currentLat: '',
      currentLng: '',
      currentAddress: '',
      destinationLat: '',
      destinationLng: '',
      destinationAddress: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Shipment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  value={formData.orderId}
                  onChange={(e) => handleInputChange('orderId', e.target.value)}
                  placeholder="e.g., ORD-001"
                />
                {errors.orderId && <p className="text-sm text-red-600 mt-1">{errors.orderId}</p>}
              </div>
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="e.g., MedSupply Co."
                />
                {errors.supplier && <p className="text-sm text-red-600 mt-1">{errors.supplier}</p>}
              </div>
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder="e.g., City General Hospital"
                />
                {errors.destination && <p className="text-sm text-red-600 mt-1">{errors.destination}</p>}
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="in-transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
                <Input
                  id="estimatedDelivery"
                  type="date"
                  value={formData.estimatedDelivery}
                  onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
                />
                {errors.estimatedDelivery && <p className="text-sm text-red-600 mt-1">{errors.estimatedDelivery}</p>}
              </div>
            </div>
          </div>

          {/* Origin Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Origin Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originLat">Latitude</Label>
                <Input
                  id="originLat"
                  value={formData.originLat}
                  onChange={(e) => handleInputChange('originLat', e.target.value)}
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div>
                <Label htmlFor="originLng">Longitude</Label>
                <Input
                  id="originLng"
                  value={formData.originLng}
                  onChange={(e) => handleInputChange('originLng', e.target.value)}
                  placeholder="e.g., -74.0060"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="originAddress">Address</Label>
                <Input
                  id="originAddress"
                  value={formData.originAddress}
                  onChange={(e) => handleInputChange('originAddress', e.target.value)}
                  placeholder="e.g., MedSupply Co., New York, NY"
                />
              </div>
            </div>
            {errors.originCoords && <p className="text-sm text-red-600">{errors.originCoords}</p>}
            {errors.originAddress && <p className="text-sm text-red-600">{errors.originAddress}</p>}
          </div>

          {/* Current Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentLat">Latitude</Label>
                <Input
                  id="currentLat"
                  value={formData.currentLat}
                  onChange={(e) => handleInputChange('currentLat', e.target.value)}
                  placeholder="e.g., 39.9526"
                />
              </div>
              <div>
                <Label htmlFor="currentLng">Longitude</Label>
                <Input
                  id="currentLng"
                  value={formData.currentLng}
                  onChange={(e) => handleInputChange('currentLng', e.target.value)}
                  placeholder="e.g., -75.1652"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="currentAddress">Address</Label>
                <Input
                  id="currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                  placeholder="e.g., Philadelphia Distribution Center"
                />
              </div>
            </div>
            {errors.currentCoords && <p className="text-sm text-red-600">{errors.currentCoords}</p>}
            {errors.currentAddress && <p className="text-sm text-red-600">{errors.currentAddress}</p>}
          </div>

          {/* Destination Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Destination Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destinationLat">Latitude</Label>
                <Input
                  id="destinationLat"
                  value={formData.destinationLat}
                  onChange={(e) => handleInputChange('destinationLat', e.target.value)}
                  placeholder="e.g., 39.2904"
                />
              </div>
              <div>
                <Label htmlFor="destinationLng">Longitude</Label>
                <Input
                  id="destinationLng"
                  value={formData.destinationLng}
                  onChange={(e) => handleInputChange('destinationLng', e.target.value)}
                  placeholder="e.g., -76.6122"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="destinationAddress">Address</Label>
                <Input
                  id="destinationAddress"
                  value={formData.destinationAddress}
                  onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                  placeholder="e.g., City General Hospital, Baltimore, MD"
                />
              </div>
            </div>
            {errors.destinationCoords && <p className="text-sm text-red-600">{errors.destinationCoords}</p>}
            {errors.destinationAddress && <p className="text-sm text-red-600">{errors.destinationAddress}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Shipment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
