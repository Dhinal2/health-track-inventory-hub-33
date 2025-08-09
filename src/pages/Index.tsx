
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';

const Index = () => {
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout userRole={user.role} userName={user.name}>
      <Dashboard />
    </Layout>
  );
};

export default Index;
