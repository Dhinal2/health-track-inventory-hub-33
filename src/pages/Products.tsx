import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Download, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
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
  stockQuantity: number;
}

const Products = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{name: string, role: 'admin' | 'staff'} | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('User data from localStorage:', parsedUser); // Debug log
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
      stockQuantity: 45
    },
    {
      id: 2,
      name: 'Antibiotics - Amoxicillin',
      sku: 'AB-005',
      category: 'Medication',
      price: 12.50,
      description: 'Broad-spectrum antibiotic medication',
      stockQuantity: 23
    },
    {
      id: 3,
      name: 'IV Bags (500ml)',
      sku: 'IV-500',
      category: 'Supplies',
      price: 3.75,
      description: 'Intravenous fluid bags for patient care',
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

  // Add/Edit product modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    sku: '',
    category: '',
    price: 0,
    description: '',
    stockQuantity: 0
  });

  // Delete confirmation modal state
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  const handleEdit = (product: Product) => {
    if (user?.role === 'admin') {
      setEditingProduct(product);
      setProductFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        description: product.description,
        stockQuantity: product.stockQuantity
      });
      setIsAddEditModalOpen(true);
    }
  };

  const handleDelete = (productId: number) => {
    if (user?.role === 'admin') {
      setDeleteProductId(productId);
    }
  };

  const confirmDelete = () => {
    if (deleteProductId) {
      setProducts(prev => prev.filter(p => p.id !== deleteProductId));
      toast({
        title: "Product deleted successfully",
        description: "The product has been removed from your inventory.",
      });
      setDeleteProductId(null);
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
      setEditingProduct(null);
      setProductFormData({
        name: '',
        sku: '',
        category: '',
        price: 0,
        description: '',
        stockQuantity: 0
      });
      setIsAddEditModalOpen(true);
    }
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      // Edit existing product
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { ...productFormData, id: editingProduct.id }
          : p
      ));
      toast({
        title: "Product updated successfully",
        description: `${productFormData.name} has been updated.`,
      });
    } else {
      // Add new product
      const newProduct: Product = {
        ...productFormData,
        id: Math.max(...products.map(p => p.id)) + 1
      };
      setProducts(prev => [...prev, newProduct]);
      toast({
        title: "Product added successfully",
        description: `${productFormData.name} has been added to your inventory.`,
      });
    }
    setIsAddEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleProductFormChange = (field: keyof Omit<Product, 'id'>, value: string | number) => {
    setProductFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

        {/* Add/Edit Product Modal */}
        <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-name">Product Name *</Label>
                  <Input
                    id="product-name"
                    value={productFormData.name}
                    onChange={(e) => handleProductFormChange('name', e.target.value)}
                    placeholder="Enter product name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-sku">SKU *</Label>
                  <Input
                    id="product-sku"
                    value={productFormData.sku}
                    onChange={(e) => handleProductFormChange('sku', e.target.value)}
                    placeholder="Enter SKU"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-category">Category *</Label>
                  <Input
                    id="product-category"
                    value={productFormData.category}
                    onChange={(e) => handleProductFormChange('category', e.target.value)}
                    placeholder="Enter category"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-price">Price *</Label>
                  <Input
                    id="product-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productFormData.price}
                    onChange={(e) => handleProductFormChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-stock">Stock Quantity *</Label>
                <Input
                  id="product-stock"
                  type="number"
                  min="0"
                  value={productFormData.stockQuantity}
                  onChange={(e) => handleProductFormChange('stockQuantity', parseInt(e.target.value) || 0)}
                  placeholder="Enter stock quantity"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={productFormData.description}
                  onChange={(e) => handleProductFormChange('description', e.target.value)}
                  placeholder="Enter product description"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveProduct}
                  disabled={!productFormData.name || !productFormData.sku || !productFormData.category || productFormData.price < 0 || productFormData.stockQuantity < 0}
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={deleteProductId !== null} onOpenChange={() => setDeleteProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Yes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Products;
