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

// Frontend Interface (keeps Uppercase for UI consistency)
interface Product {
  ProductID: number;
  Name: string;
  Price: number;
  Description: string;
  StockQuantity: number;
}

// --- FIX: Add a type for the backend data (lowercase) ---
interface BackendProduct {
    productid: number;
    name: string;
    price: number;
    description: string;
    stockquantity: number;
}

const Products = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: number; name: string; role: 'admin' | 'staff' } | null>(null);
  const [products, setProducts] = useState<Product[]>([]); // State uses Frontend type
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        // --- FIX: Map backend lowercase data to frontend Uppercase state ---
        const backendData: BackendProduct[] = await response.json();
        const frontendData: Product[] = backendData.map(item => ({
            ProductID: item.productid,
            Name: item.name,
            Price: Number(item.price), // Ensure price is a number
            Description: item.description,
            StockQuantity: item.stockquantity
        }));
        setProducts(frontendData);
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

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [formData, setFormData] = useState({ quantity: 1 });

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  // --- FIX: Use lowercase keys for the product form data state ---
  const [productFormData, setProductFormData] = useState({
    name: '',
    price: 0,
    description: '',
    stockquantity: 0,
  });

  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  const handleRequest = (product: Product) => {
    setSelectedProduct(product);
    setFormData({ quantity: 1 });
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedProduct || !user) return;
    
    // --- FIX: Send lowercase keys to the backend ---
    const orderItem = {
      productid: selectedProduct.ProductID,
      quantity: formData.quantity,
      unitprice: selectedProduct.Price, 
    };
    const orderData = {
      userId: user.id,
      items: [orderItem],
      totalAmount: orderItem.quantity * orderItem.unitprice,
    };
    try {
      // NOTE: We haven't converted /api/orders yet, this will fail until we do.
      const response = await fetch('/api/orders', {
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

  const handleAddNew = () => {
    setEditingProduct(null);
    // --- FIX: Reset with lowercase keys ---
    setProductFormData({ name: '', price: 0, description: '', stockquantity: 0 });
    setIsAddEditModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    // --- FIX: Set form data with lowercase keys ---
    setProductFormData({
      name: product.Name,
      price: product.Price,
      description: product.Description,
      stockquantity: product.StockQuantity,
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveProduct = async () => {
    const url = editingProduct
      ? `/api/products/${editingProduct.ProductID}`
      : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        // --- FIX: Send the lowercase productFormData directly ---
        body: JSON.stringify(productFormData),
      });
      if (response.ok) {
        toast({
          title: `Product ${editingProduct ? 'updated' : 'added'} successfully`,
        });
        fetchProducts(); // Refresh the list
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

  const confirmDelete = async () => {
    if (!deleteProductId) return;
    try {
      const response = await fetch(`/api/products/${deleteProductId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({ title: 'Product deleted successfully' });
        fetchProducts(); // Refresh the list
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

  // --- FIX: Update handler to work with lowercase keys ---
  const handleProductFormChange = (field: keyof typeof productFormData, value: string | number) => {
    setProductFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading || !user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
                {/* --- FIX: Display data using Uppercase keys from state --- */}
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
                          <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteProductId(product.ProductID)}>
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

        {/* Request Modal */}
        <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Product</DialogTitle>
            </DialogHeader>
            {/* --- FIX: Display data using Uppercase keys from state --- */}
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

        {/* Add/Edit Modal */}
        <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            {/* --- FIX: Bind inputs to lowercase keys in productFormData --- */}
            <div className="space-y-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={productFormData.name}
                  onChange={(e) => handleProductFormChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={productFormData.description}
                  onChange={(e) => handleProductFormChange('description', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={productFormData.price}
                    onChange={(e) =>
                      handleProductFormChange('price', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>Stock Quantity *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={productFormData.stockquantity}
                    onChange={(e) =>
                      handleProductFormChange('stockquantity', Math.max(0, parseInt(e.target.value) || 0))
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

        {/* Delete Confirmation */}
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