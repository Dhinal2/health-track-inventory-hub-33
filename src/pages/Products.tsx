import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Download, Edit, Trash2, ShoppingCart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  description: string;
  supplier: string;
  stockQuantity: number;
}

const Products = () => {
  const [user] = useState({
    name: 'Dr. Sarah Johnson',
    role: 'admin' as 'admin' | 'staff'
  });

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Surgical Masks',
      sku: 'SM-001',
      category: 'PPE',
      price: 0.85,
      description: 'Disposable surgical masks for medical use',
      supplier: 'MedSupply Co.',
      stockQuantity: 45
    },
    {
      id: 2,
      name: 'Antibiotics - Amoxicillin',
      sku: 'AB-005',
      category: 'Medication',
      price: 12.50,
      description: 'Broad-spectrum antibiotic medication',
      supplier: 'Pharma Direct',
      stockQuantity: 23
    },
    {
      id: 3,
      name: 'IV Bags (500ml)',
      sku: 'IV-500',
      category: 'Supplies',
      price: 3.75,
      description: 'Intravenous fluid bags for patient care',
      supplier: 'Healthcare Plus',
      stockQuantity: 78
    }
  ]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const handleEdit = (product: Product) => {
    if (user.role === 'admin') {
      console.log('Edit product:', product);
    }
  };

  const handleDelete = (productId: number) => {
    if (user.role === 'admin') {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product);
    setIsPurchaseModalOpen(true);
  };

  const handleAddNew = () => {
    if (user.role === 'admin') {
      console.log('Add new product');
    }
  };

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <div className="flex items-center space-x-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            {user.role === 'admin' && (
              <button 
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stockQuantity < 50 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stockQuantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {user.role === 'staff' && (
                          <button
                            onClick={() => handlePurchase(product)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isPurchaseModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Purchase Request</h3>
                <button
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                  <p className="text-sm text-gray-500">Price: ${selectedProduct.price.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.stockQuantity}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsPurchaseModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      console.log('Purchase request submitted');
                      setIsPurchaseModalOpen(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
