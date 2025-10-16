// src/pages/Shipments.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ShipmentsTable } from '@/components/ShipmentsTable';
import { TrackShipmentModal } from '@/components/TrackShipmentModal';
import { EditShipmentModal } from '@/components/EditShipmentModal';
import { useToast } from '@/hooks/use-toast';
import { Shipment, ShipmentStatus, BackendShipmentStatus } from '../types'; // Import new types

// NOTE: This is the old, backend-specific shipment type. We'll map from this.
interface BackendShipment {
  ShipmentID: number;
  OrderID: number;
  DestinationUser: string;
  Status: BackendShipmentStatus;
  Destination: string;
  EstimatedDelivery: string | null;
}

// Helper function to map backend status to frontend status
const mapBackendStatusToFrontend = (status: BackendShipmentStatus): ShipmentStatus => {
  switch (status) {
    case 'Pending': return 'dispatched';
    case 'In Transit': return 'in-transit';
    case 'Delivered': return 'delivered';
    default: return 'dispatched';
  }
};

// Helper function to map frontend status back to backend status
const mapFrontendStatusToBackend = (status: ShipmentStatus): BackendShipmentStatus => {
    switch (status) {
        case 'dispatched': return 'Pending';
        case 'in-transit': return 'In Transit';
        case 'delivered': return 'Delivered';
        default: return 'Pending';
    }
};

// --- MOCK DATA HELPER ---
// TODO: Replace this with real data from your backend API.
// Your current API doesn't provide addresses or coordinates.
// src/pages/Shipments.tsx

const addMockDetailsToShipment = (shipment: BackendShipment): Shipment => ({
  // Map backend PascalCase to frontend camelCase
  shipmentID: shipment.ShipmentID,
  orderID: shipment.OrderID,
  destinationUser: shipment.DestinationUser,
  destination: shipment.Destination,
  estimatedDelivery: shipment.EstimatedDelivery || new Date().toISOString(),

  // Keep the rest of the fields
  id: shipment.ShipmentID.toString(),
  orderId: shipment.OrderID.toString(),
  status: mapBackendStatusToFrontend(shipment.Status),
  lastUpdated: new Date().toISOString(),
  originAddress: 'Warehouse A, Philadelphia, PA',
  currentAddress: shipment.Status === 'Pending' ? 'Warehouse A, Philadelphia, PA' : 'On Route 66, TX',
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

  // State for modals
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isTrackModalOpen, setTrackModalOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.UserID) {
        const mappedRole: 'admin' | 'staff' = parsedUser.Role === 'Administrator' ? 'admin' : 'staff';
        const currentUser = {
          id: parsedUser.UserID,
          name: parsedUser.Name,
          role: mappedRole,
          rawRole: parsedUser.Role
        };
        setUser(currentUser);
        fetchShipments(currentUser.id, currentUser.rawRole);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchShipments = async (userId: number, userRole: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/shipments/user-shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userRole }),
      });
      if (response.ok) {
        const data: BackendShipment[] = await response.json();
        // Map backend data to the detailed frontend type
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

  // Handler to update a shipment
  const handleShipmentUpdate = async (updatedShipment: Shipment) => {
    if (!user) return;
    
    // TODO: You'll need a new, more comprehensive backend endpoint to update all details.
    // For now, we only update the status to preserve your inventory logic.
    try {
        const backendStatus = mapFrontendStatusToBackend(updatedShipment.status);
        const response = await fetch(`http://localhost:3001/api/shipments/${updatedShipment.shipmentID}/status`, { // Use shipmentID
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: backendStatus }),
        });

        if (response.ok) {
            toast({ title: "Shipment Updated", description: `Shipment ${updatedShipment.id} has been updated.` });
            fetchShipments(user.id, user.rawRole); // Refresh list
        } else {
            throw new Error('Failed to update shipment status');
        }
    } catch (error) {
        toast({ title: "Error", description: "Could not update shipment.", variant: "destructive"});
    }
  };

  // Modal handlers
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
  
  // NOTE: Filtering logic remains the same, but now operates on the mapped `Shipment` objects.
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
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Shipments Management</h1>
        
        {/* You can add your ShipmentFilters component back here if needed */}

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