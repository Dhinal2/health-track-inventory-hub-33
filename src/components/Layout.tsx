import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // This state holds the user data exactly as it is in localStorage
  const [user, setUser] = useState<{ Name: string; Role: string } | null>(null);

  useEffect(() => {
    // This function reads the user's data from storage
    const fetchUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };

    fetchUser(); // Run once on component load

    // This listens for the 'userUpdated' signal from the Settings page
    const handleUserUpdate = () => {
      fetchUser();
    };
    window.addEventListener('userUpdated', handleUserUpdate);

    // Clean up the listener
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  // Show a loading message while the user data is being read
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- THIS IS THE DEFINITIVE FIX ---
  // We now correctly map the full role name from the database (e.g., "Administrator")
  // to the lowercase shorthand the app's components expect (e.g., "admin").
  const currentUserRole = user.Role === 'Administrator' ? 'admin' : 'staff';
  const currentUserName = user.Name;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={currentUserRole} // This now passes the correct 'admin' or 'staff' role
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header
          userName={currentUserName}
          userRole={currentUserRole}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};