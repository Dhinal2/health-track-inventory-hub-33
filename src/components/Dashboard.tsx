import React, { useState, useEffect } from 'react';
import { StatsCard } from './StatsCard';
import { InventoryChart } from './InventoryChart';
import { RecentOrders } from './RecentOrders';
import { LowStockAlerts } from './LowStockAlerts';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Package2, AlertTriangle, ShoppingCart, DollarSign, LucideIcon } from 'lucide-react';

const iconMap: { [key: string]: LucideIcon } = {
    Package2,
    AlertTriangle,
    ShoppingCart,
    DollarSign,
};

interface User {
    id: number;
    name: string;
    role: 'admin' | 'staff';
    rawRole: string;
}

interface StatData {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
}

interface DashboardApiResponse {
    stats: StatData[];
    recentOrders: any[];
    lowStockAlerts: any[];
    weeklyUsage: any[];
}


export const Dashboard: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [data, setData] = useState<DashboardApiResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            const currentUser: User = {
                id: parsedUser.UserID,
                name: parsedUser.Name,
                role: parsedUser.Role === 'Administrator' ? 'admin' : 'staff',
                rawRole: parsedUser.Role
            };
            setUser(currentUser);

            fetch('/api/dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, userRole: currentUser.rawRole }),
            })
            .then(res => res.json())
            .then(dashboardData => {
                setData(dashboardData);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch dashboard data:", err);
                toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [toast]);

    const handleReorderAll = async () => {
        if (!user) return;

        toast({ title: "Submitting...", description: "Creating a bulk reorder for all critical items." });
        
        try {
            const response = await fetch('/api/orders/reorder-all-low-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create reorder.');
            }
            
            toast({
                title: "Success!",
                description: result.message,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Could not submit reorder request.",
                variant: "destructive",
            });
        }
    };
    
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }
    
    if (!user || !data) {
        return <div className="text-center text-muted-foreground">Could not load dashboard data. Please try again later.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {data.stats.map((stat) => {
                    const IconComponent = iconMap[stat.icon] || Package2;
                    return (
                        <StatsCard
                            key={stat.title}
                            title={stat.title}
                            value={String(stat.value)}
                            icon={IconComponent}
                            color={stat.color as any}
                            change={stat.change || ''}
                            changeType={stat.changeType || 'neutral'}
                        />
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1"><InventoryChart data={data.weeklyUsage} /></div>
                <div className="lg:col-span-2"><RecentOrders orders={data.recentOrders} userRole={user.role} /></div>
            </div>

            <LowStockAlerts 
                items={data.lowStockAlerts} 
                userRole={user.role} 
                onReorderAll={handleReorderAll}
             />
        </div>
    );
};