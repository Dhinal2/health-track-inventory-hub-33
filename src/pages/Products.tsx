import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';

interface Product {
  ProductID: number;
  Name: string;
  Price: number;
  Description: string;
  StockQuantity: number;
}

const Products = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: number; name: string; role: 'admin' | 'staff' } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch user from localStorage (same as your working logic)
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.UserID) {
        const mappedRole: 'admin' | 'staff' =
          parsedUser.Role === 'Administrator' ? 'admin' : 'staff';
        setUser({
          id: parsedUser.UserID,
          name: parsedUser.Name || 'User',
          role: mappedRole,
        });
      }
    }
    fetchProducts();
  }, []);

  // --- Fetch products from backend
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/products');
      if (response.ok) {
        setProducts(await response.json());
      } else {
        toast({ title: 'Error', description: 'Failed to fetch products.', variant: 'destructive' });
      }
    } catch {
      toast({
        title: 'Network Error',
        description: 'Could not connect to the server.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- States for modals/forms ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [formData, setFormData] = useState({ quantity: 1 });

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    Name: '',
    Price: 0,
    Description: '',
    StockQuantity: 0,
  });

  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  // --- Request Handling ---
  const handleRequest = (product: Product) => {
    setSelectedProduct(product);
    setFormData({ quantity: 1 });
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedProduct || !user) return;
    const orderItem = {
      ProductID: selectedProduct.ProductID,
      Quantity: formData.quantity,
      Price: selectedProduct.Price,
    };
    const orderData = {
      userId: user.id,
      items: [orderItem],
      totalAmount: orderItem.Quantity * orderItem.Price,
    };
    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (response.ok) {
        toast({ title: 'Order placed successfully', description: 'Your request has been sent.' });
        setIsRequestModalOpen(false);
      } else throw new Error();
    } catch {
      toast({ title: 'Error', description: 'Could not place the order.', variant: 'destructive' });
    }
  };

  // --- Add/Edit Product ---
  const handleAddNew = () => {
    setEditingProduct(null);
    setProductFormData({ Name: '', Price: 0, Description: '', StockQuantity: 0 });
    setIsAddEditModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      Name: product.Name,
      Price: product.Price,
      Description: product.Description,
      StockQuantity: product.StockQuantity,
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveProduct = async () => {
    const url = editingProduct
      ? `http://localhost:3001/api/products/${editingProduct.ProductID}`
      : 'http://localhost:3001/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productFormData),
      });
      if (response.ok) {
        toast({
          title: `Product ${editingProduct ? 'updated' : 'added'} successfully`,
        });
        fetchProducts();
      } else throw new Error();
    } catch {
      toast({
        title: 'Error',
        description: 'Could not save the product.',
        variant: 'destructive',
      });
    } finally {
      setIsAddEditModalOpen(false);
    }
  };

  // --- Delete Product ---
  const confirmDelete = async () => {
    if (!deleteProductId) return;
    try {
      const response = await fetch(`http://localhost:3001/api/products/${deleteProductId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({ title: 'Product deleted successfully' });
        fetchProducts();
      } else throw new Error();
    } catch {
      toast({
        title: 'Error',
        description: 'Could not delete the product.',
        variant: 'destructive',
      });
    } finally {
      setDeleteProductId(null);
    }
  };

  const handleProductFormChange = (field: keyof typeof productFormData, value: string | number) => {
    setProductFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- Loading state ---
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- Main UI ---
  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Products Catalog</h1>
          {user.role === 'admin' && (
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Description</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Price</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Stock</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products.map((product, index) => (
                  <tr key={product.ProductID} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{product.Name}</td>
                    <td className="px-6 py-4 text-gray-700">{product.Description}</td>
                    <td className="px-6 py-4">${product.Price.toFixed(2)}</td>
                    <td className="px-6 py-4">{product.StockQuantity} units</td>
                    <td className="px-6 py-4 text-right">
                      {user.role === 'staff' && (
                        <Button size="sm" onClick={() => handleRequest(product)}>
                          <ShoppingCart className="w-4 h-4 mr-2" /> Request
                        </Button>
                      )}
                      {user.role === 'admin' && (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteProductId(product.ProductID)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ Request Modal */}
        <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Product</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-900">{selectedProduct.Name}</h4>
                  <p className="text-sm text-gray-600">Price: ${selectedProduct.Price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">
                    Available: {selectedProduct.StockQuantity} units
                  </p>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.StockQuantity}
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ quantity: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitRequest}
                    disabled={
                      formData.quantity <= 0 || formData.quantity > selectedProduct.StockQuantity
                    }
                  >
                    Submit Request
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ✅ Add/Edit Modal */}
        <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={productFormData.Name}
                  onChange={(e) => handleProductFormChange('Name', e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={productFormData.Description}
                  onChange={(e) => handleProductFormChange('Description', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    value={productFormData.Price}
                    onChange={(e) =>
                      handleProductFormChange('Price', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>Stock Quantity *</Label>
                  <Input
                    type="number"
                    value={productFormData.StockQuantity}
                    onChange={(e) =>
                      handleProductFormChange('StockQuantity', parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProduct}>
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ✅ Delete Confirmation */}
        <AlertDialog open={deleteProductId !== null} onOpenChange={() => setDeleteProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Products;
