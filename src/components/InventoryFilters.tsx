
import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';

interface InventoryFiltersProps {
  onFilter: (filters: any) => void;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    stockLevel: 'all',
    expiry: 'all'
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-4 flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, SKU, or supplier..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>



        <select
          value={filters.stockLevel}
          onChange={(e) => handleFilterChange('stockLevel', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Stock Levels</option>
          <option value="low">Low Stock</option>
          <option value="normal">Normal Stock</option>
        </select>


      </div>
    </div>
  );
};
