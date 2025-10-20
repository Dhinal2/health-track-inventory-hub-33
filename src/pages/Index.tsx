import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';

const Index = () => {
  // --- THIS IS THE FIX ---
  // No need to fetch user here anymore, Layout handles it.
  // We just need a simple loading state until Layout mounts.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate loading or wait for necessary setup
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    // --- THIS IS THE FIX ---
    // Removed userRole and userName props from Layout
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default Index;