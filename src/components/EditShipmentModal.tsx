
import React, { useState, useEffect } from 'react';
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

interface EditShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  onShipmentUpdate: (shipment: Shipment) => void;
}

export const EditShipmentModal: React.FC<EditShipmentModalProps> = ({
  isOpen,
  onClose,
  shipment,
  onShipmentUpdate
}) => {
  const [formData, setFormData] = useState({
    currentAddress: '',
    destinationAddress: '',
    status: 'dispatched' as ShipmentStatus
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (shipment) {
      setFormData({
        currentAddress: shipment.currentAddress,
        destinationAddress: shipment.destinationAddress,
        status: shipment.status
      });
    }
  }, [shipment]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentAddress.trim()) newErrors.currentAddress = 'Current location is required';
    if (!formData.destinationAddress.trim()) newErrors.destinationAddress = 'Destination is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !shipment) return;

    const updatedShipment: Shipment = {
      ...shipment,
      status: formData.status,
      currentAddress: formData.currentAddress,
      destinationAddress: formData.destinationAddress,
      destination: formData.destinationAddress
    };

    onShipmentUpdate(updatedShipment);
    handleClose();
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!shipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shipment - {shipment.id}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentAddress">Current Location *</Label>
              <Input
                id="currentAddress"
                value={formData.currentAddress}
                onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                placeholder="e.g., Philadelphia Distribution Center"
              />
              {errors.currentAddress && <p className="text-sm text-red-600 mt-1">{errors.currentAddress}</p>}
            </div>

            <div>
              <Label htmlFor="destinationAddress">Destination *</Label>
              <Input
                id="destinationAddress"
                value={formData.destinationAddress}
                onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                placeholder="e.g., City General Hospital, Baltimore, MD"
              />
              {errors.destinationAddress && <p className="text-sm text-red-600 mt-1">{errors.destinationAddress}</p>}
            </div>

            <div>
              <Label htmlFor="status">Shipment Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dispatched">Pending</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Shipment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
