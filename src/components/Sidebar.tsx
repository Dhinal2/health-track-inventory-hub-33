
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Package, 
  Archive, 
  ShoppingCart, 
  Truck, 
  FileText, 
  BarChart3, 
  Settings,
  Menu
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userRole: 'admin' | 'staff';
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, userRole }) => {
  const location = useLocation();

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: Activity, roles: ['admin', 'staff'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['admin','staff'] },
    { name: 'Inventory', href: '/inventory', icon: Archive, roles: ['admin', 'staff'] },
    { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['admin', 'staff'] },
    { name: 'Shipments', href: '/shipments', icon: Truck, roles: ['admin', 'staff'] },
    { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['admin', 'staff'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-50 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">AutoMedi Flow</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <nav className="mt-6">
        <div className="px-3 space-y-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
