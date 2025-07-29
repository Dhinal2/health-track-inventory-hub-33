
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';

const Index = () => {
  // Mock authentication state
  const [user] = useState({
    name: 'Dr. Sarah Johnson',
    role: 'admin' as const
  });

  return (
    <Layout userRole={user.role} userName={user.name}>
      <Dashboard />
    </Layout>
  );
};

export default Index;
