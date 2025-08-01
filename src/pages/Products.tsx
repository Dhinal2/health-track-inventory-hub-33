import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Download, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';

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
  const { toast } = useToast();
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
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestedProducts, setRequestedProducts] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    quantity: 1,
    remarks: ''
  });

  const handleEdit = (product: Product) => {
    if (user?.role === 'admin') {
      console.log('Edit product:', product);
    }
  };

  const handleDelete = (productId: number) => {
    if (user?.role === 'admin') {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleRequest = (product: Product) => {
    setSelectedProduct(product);
    setFormData({ quantity: 1, remarks: '' });
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = () => {
    if (!selectedProduct) return;

    // In a real app, this would be sent to your backend
    console.log('Request submitted:', {
      productId: selectedProduct.id,
      quantity: formData.quantity,
      remarks: formData.remarks,
      userId: user?.name,
      status: 'Pending'
    });

    // Add to requested products set to disable button
    setRequestedProducts(prev => new Set(prev).add(selectedProduct.id));

    // Show success toast
    toast({
      title: "Request submitted successfully",
      description: `Your request for ${formData.quantity} ${selectedProduct.name} has been submitted for approval.`,
    });

    // Close modal and reset form
    setIsRequestModalOpen(false);
    setSelectedProduct(null);
    setFormData({ quantity: 1, remarks: '' });
  };

  const handleAddNew = () => {
    if (user?.role === 'admin') {
      console.log('Add new product');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <div className="flex items-center space-x-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            {user?.role === 'admin' && (
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
                         {user?.role === 'staff' && (
                           <Button
                             onClick={() => handleRequest(product)}
                             disabled={requestedProducts.has(product.id)}
                             size="sm"
                             variant={requestedProducts.has(product.id) ? "secondary" : "default"}
                             className="flex items-center space-x-1"
                           >
                             <ShoppingCart className="w-4 h-4" />
                             <span>{requestedProducts.has(product.id) ? 'Requested' : 'Request'}</span>
                           </Button>
                         )}
                         {user?.role === 'admin' && (
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

        <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Product</DialogTitle>
            </DialogHeader>
            
            {selectedProduct && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">SKU: {selectedProduct.sku}</p>
                  <p className="text-sm text-gray-600">Price: ${selectedProduct.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Available: {selectedProduct.stockQuantity} units</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedProduct.stockQuantity}
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 1
                      }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="remarks">Remarks (Optional)</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Add any additional notes or reason for this request..."
                      value={formData.remarks}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        remarks: e.target.value
                      }))}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsRequestModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitRequest}
                    disabled={formData.quantity < 1 || formData.quantity > selectedProduct.stockQuantity}
                  >
                    Submit Request
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Products;
