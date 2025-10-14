
import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { ShipmentFilters } from '@/components/ShipmentFilters';
import { ShipmentsTable } from '@/components/ShipmentsTable';
import { CreateShipmentModal } from '@/components/CreateShipmentModal';
import { EditShipmentModal } from '@/components/EditShipmentModal';
import { TrackShipmentModal } from '@/components/TrackShipmentModal';
import { useToast } from '@/hooks/use-toast';

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

type FilterState = {
  search: string;
  status: ShipmentStatus | 'all';
  dateFrom: string;
  dateTo: string;
};

const Shipments = () => {
  const [user, setUser] = useState<{name: string, role: 'admin' | 'staff'} | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: parsedUser.name || parsedUser.email?.split('@')[0] || 'User',
        role: parsedUser.role || 'staff'
      });
    }
  }, []);

  const { toast } = useToast();

  // Mock shipments data
  const [shipments, setShipments] = useState<Shipment[]>([
    {
      id: 'SHP-001',
      orderId: 'ORD-001',
      destination: 'City General Hospital',
      status: 'in-transit' as ShipmentStatus,
      estimatedDelivery: '2024-01-18',
      lastUpdated: '2024-01-16T10:30:00Z',
      originCoords: [40.7128, -74.0060], // New York
      currentCoords: [39.9526, -75.1652], // Philadelphia
      destinationCoords: [39.2904, -76.6122], // Baltimore
      originAddress: 'MedSupply Co., New York, NY',
      currentAddress: 'Philadelphia Distribution Center',
      destinationAddress: 'City General Hospital, Baltimore, MD'
    },
    {
      id: 'SHP-002',
      orderId: 'ORD-002',
      destination: 'Metro Medical Center',
      status: 'delivered' as ShipmentStatus,
      estimatedDelivery: '2024-01-15',
      lastUpdated: '2024-01-15T14:20:00Z',
      originCoords: [41.8781, -87.6298], // Chicago
      currentCoords: [41.8781, -87.6298], // Same as destination when delivered
      destinationCoords: [41.8781, -87.6298], // Chicago
      originAddress: 'Healthcare Supplies Ltd., Chicago, IL',
      currentAddress: 'Metro Medical Center, Chicago, IL',
      destinationAddress: 'Metro Medical Center, Chicago, IL'
    },
    {
      id: 'SHP-003',
      orderId: 'ORD-003',
      destination: 'Regional Health System',
      status: 'dispatched' as ShipmentStatus,
      estimatedDelivery: '2024-01-20',
      lastUpdated: '2024-01-16T08:15:00Z',
      originCoords: [34.0522, -118.2437], // Los Angeles
      currentCoords: [34.0522, -118.2437], // Still at origin
      destinationCoords: [37.7749, -122.4194], // San Francisco
      originAddress: 'PharmaDirect Warehouse, Los Angeles, CA',
      currentAddress: 'PharmaDirect Warehouse, Los Angeles, CA',
      destinationAddress: 'Regional Health System, San Francisco, CA'
    }
  ]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  const handleShipmentCreate = (shipmentData: Omit<Shipment, 'id' | 'lastUpdated'>) => {
    const newShipment: Shipment = {
      ...shipmentData,
      id: `SHP-${(shipments.length + 1).toString().padStart(3, '0')}`,
      lastUpdated: new Date().toISOString()
    };

    setShipments(prev => [newShipment, ...prev]);
    
    toast({
      title: "Shipment Created",
      description: `Shipment ${newShipment.id} has been created successfully.`,
    });
  };

  const handleShipmentUpdate = (updatedShipment: Shipment) => {
    setShipments(prev => prev.map(shipment => 
      shipment.id === updatedShipment.id 
        ? { ...updatedShipment, lastUpdated: new Date().toISOString() }
        : shipment
    ));

    toast({
      title: "Shipment Updated",
      description: `Shipment ${updatedShipment.id} has been updated successfully.`,
    });
  };

  const filteredShipments = useMemo(() => {
    let filtered = shipments;

    if (filters.search) {
      filtered = filtered.filter(shipment => 
        shipment.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        shipment.orderId.toLowerCase().includes(filters.search.toLowerCase()) ||
        shipment.destination.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(shipment => shipment.status === filters.status);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(shipment => shipment.estimatedDelivery >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(shipment => shipment.estimatedDelivery <= filters.dateTo);
    }

    return filtered;
  }, [shipments, filters]);

  const handleExportCSV = () => {
    const headers = ['Shipment ID', 'Order ID', 'Destination', 'Status', 'Estimated Delivery', 'Last Updated'];
    const csvData = filteredShipments.map(shipment => [
      shipment.id,
      shipment.orderId,
      shipment.destination,
      shipment.status,
      shipment.estimatedDelivery,
      shipment.lastUpdated
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shipments-export.csv';
    a.click();

    toast({
      title: "Export Complete",
      description: "Shipments have been exported to CSV.",
    });
  };

  const handleTrackShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsTrackModalOpen(true);
  };

  const handleEditShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsEditModalOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Shipments Management</h1>
          <div className="flex items-center space-x-3">
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            {user?.role === 'admin' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Shipment
              </Button>
            )}
          </div>
        </div>

        <ShipmentFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        <ShipmentsTable
          shipments={filteredShipments}
          userRole={user.role}
          onTrackShipment={handleTrackShipment}
          onEditShipment={handleEditShipment}
        />

        {user?.role === 'admin' && (
          <>
            <CreateShipmentModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onShipmentCreate={handleShipmentCreate}
            />

            <EditShipmentModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              shipment={selectedShipment}
              onShipmentUpdate={handleShipmentUpdate}
            />
          </>
        )}

        <TrackShipmentModal
          isOpen={isTrackModalOpen}
          onClose={() => setIsTrackModalOpen(false)}
          shipment={selectedShipment}
        />
      </div>
    </Layout>
  );
};

export default Shipments;
