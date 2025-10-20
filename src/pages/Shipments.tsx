import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ShipmentsTable } from '@/components/ShipmentsTable';
import { TrackShipmentModal } from '@/components/TrackShipmentModal';
import { EditShipmentModal } from '@/components/EditShipmentModal';
import { useToast } from '@/hooks/use-toast';
import { Shipment, ShipmentStatus, BackendShipmentStatus } from '../types';

interface BackendShipment {
  ShipmentID: number;
  OrderID: number;
  DestinationUser: string;
  Status: BackendShipmentStatus;
  Destination: string;
  EstimatedDelivery: string | null;
}

const mapBackendStatusToFrontend = (status: BackendShipmentStatus): ShipmentStatus => {
  switch (status) {
    case 'Pending': return 'dispatched';
    case 'In Transit': return 'in-transit';
    case 'Delivered': return 'delivered';
    default: return 'dispatched';
  }
};

const mapFrontendStatusToBackend = (status: ShipmentStatus): BackendShipmentStatus => {
    switch (status) {
        case 'dispatched': return 'Pending';
        case 'in-transit': return 'In Transit';
        case 'delivered': return 'Delivered';
        default: return 'Pending';
    }
};

const addMockDetailsToShipment = (shipment: BackendShipment): Shipment => ({
  shipmentID: shipment.ShipmentID,
  orderID: shipment.OrderID,
  destinationUser: shipment.DestinationUser,
  destination: shipment.Destination,
  estimatedDelivery: shipment.EstimatedDelivery || new Date().toISOString(),
  id: shipment.ShipmentID.toString(),
  orderId: shipment.OrderID.toString(),
  status: mapBackendStatusToFrontend(shipment.Status),
  lastUpdated: new Date().toISOString(),
  originAddress: 'Warehouse A, Philadelphia, PA',
  // Use the real destination for both current and destination address
  currentAddress: shipment.Destination,
  destinationAddress: shipment.Destination,
  originCoords: [39.9526, -75.1652],
  currentCoords: [34.0522, -118.2437],
  destinationCoords: [39.2904, -76.6122],
});

const Shipments = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: number; name: string; role: 'admin' | 'staff'; rawRole: string } | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isTrackModalOpen, setTrackModalOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const mappedRole: 'admin' | 'staff' = parsedUser.Role === 'Administrator' ? 'admin' : 'staff';
      const currentUser = {
        id: parsedUser.UserID,
        name: parsedUser.Name,
        role: mappedRole,
        rawRole: parsedUser.Role
      };
      setUser(currentUser);
      fetchShipments(currentUser.id, currentUser.rawRole);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchShipments = async (userId: number, userRole: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/shipments/user-shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userRole }),
      });
      if (response.ok) {
        const data: BackendShipment[] = await response.json();
        setShipments(data.map(addMockDetailsToShipment));
      } else {
        setShipments([]);
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipmentUpdate = async (updatedShipment: Shipment) => {
    if (!user) return;
    
    try {
        const payload = {
            status: mapFrontendStatusToBackend(updatedShipment.status),
            Destination: updatedShipment.destinationAddress,
            estimatedDelivery: updatedShipment.estimatedDelivery,
        };

        const response = await fetch(`/api/shipments/${updatedShipment.shipmentID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            toast({ title: "Shipment Updated", description: `Shipment ${updatedShipment.id} has been updated.` });
            fetchShipments(user.id, user.rawRole); // Refresh list
        } else {
            throw new Error('Failed to update shipment');
        }
    } catch (error) {
        toast({ title: "Error", description: "Could not update shipment.", variant: "destructive"});
    }
  };

  const handleOpenTrackModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setTrackModalOpen(true);
  };

  const handleOpenEditModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setTrackModalOpen(false);
    setEditModalOpen(false);
    setSelectedShipment(null);
  };
  
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
        const searchMatch = filters.search
            ? shipment.id.includes(filters.search) || shipment.orderId.includes(filters.search) || shipment.destination.toLowerCase().includes(filters.search.toLowerCase())
            : true;
        const statusMatch = filters.status !== 'all' ? shipment.status === filters.status : true;
        return searchMatch && statusMatch;
    });
  }, [shipments, filters]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">...Loading</div>;
  }

  return (
    // --- THIS IS THE FIX ---
    // The Layout component does not need userRole or userName as props.
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Shipments Management</h1>
        
        <ShipmentsTable
          shipments={filteredShipments}
          userRole={user.role}
          onTrackShipment={handleOpenTrackModal}
          onEditShipment={handleOpenEditModal}
        />
        
        <TrackShipmentModal 
            isOpen={isTrackModalOpen}
            onClose={handleCloseModals}
            shipment={selectedShipment}
        />

        <EditShipmentModal
            isOpen={isEditModalOpen}
            onClose={handleCloseModals}
            shipment={selectedShipment}
            onShipmentUpdate={handleShipmentUpdate}
        />
      </div>
    </Layout>
  );
};

export default Shipments;