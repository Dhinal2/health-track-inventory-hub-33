import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ShipmentFilters } from '@/components/ShipmentFilters';
import { ShipmentsTable } from '@/components/ShipmentsTable';
import { useToast } from '@/hooks/use-toast';

// New types to match the backend data structure
type ShipmentStatus = 'Pending' | 'In Transit' | 'Delivered';

interface Shipment {
  ShipmentID: number;
  OrderID: number;
  DestinationUser: string;
  Status: ShipmentStatus;
  Destination: string;
  EstimatedDelivery: string | null;
}

type FilterState = {
  search: string;
  status: ShipmentStatus | 'all';
  dateFrom: string;
  dateTo: string;
};

const Shipments = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: number; name: string; role: 'admin' | 'staff'; rawRole: string } | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } else {
        setIsLoading(false);
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
        setShipments(await response.json());
      } else {
        toast({ title: "Info", description: "No shipments found or failed to fetch data." });
        setShipments([]);
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', dateFrom: '', dateTo: '' });

  const handleStatusUpdate = async (shipmentId: number, newStatus: ShipmentStatus) => {
      if (!user) return;
      try {
        const response = await fetch(`http://localhost:3001/api/shipments/${shipmentId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (response.ok) {
            toast({ title: "Shipment Updated", description: `Shipment status is now ${newStatus}.` });
            fetchShipments(user.id, user.rawRole); // Refresh the list
        } else {
            throw new Error('Failed to update shipment');
        }
      } catch (error) {
          toast({ title: "Error", description: "Could not update shipment status.", variant: "destructive"});
      }
  };

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
        const searchMatch = filters.search
            ? shipment.ShipmentID.toString().includes(filters.search) || shipment.OrderID.toString().includes(filters.search) || shipment.DestinationUser.toLowerCase().includes(filters.search.toLowerCase())
            : true;
        const statusMatch = filters.status !== 'all' ? shipment.Status === filters.status : true;
        return searchMatch && statusMatch;
    });
  }, [shipments, filters]);


  if (isLoading || !user) {
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
        </div>

        <ShipmentFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        <ShipmentsTable
          shipments={filteredShipments}
          userRole={user.role}
          onStatusUpdate={handleStatusUpdate}
        />
        
        {/* Modals for tracking/editing are removed as the primary action is now status updates via the table */}
      </div>
    </Layout>
  );
};

export default Shipments;