import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Interface for component's internal state (Keeps Uppercase for UI consistency)
interface Product {
  ProductID: number;
  Name: string;
  Description: string;
  Price: number;
  StockQuantity: number;
}

// --- FIX: Add interface for data coming FROM backend (lowercase keys) ---
interface BackendProduct {
    productid: number;
    name: string;
    description: string;
    price: number | string; // Could be string
    stockquantity: number;
}
// --- END FIX ---


// Interface for items being added to the order (Keep Uppercase for internal consistency)
interface OrderItem {
  ProductID: number;
  ProductName: string;
  Quantity: number;
  UnitPrice: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreate: () => void;
  userId: number;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreate,
  userId
}) => {
  const [products, setProducts] = useState<Product[]>([]); // State uses Uppercase Product
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch products only when the modal opens
    if (isOpen) {
      fetchProducts();
      // Reset order items when opening
      setOrderItems([]);
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
       // --- FIX: Use relative path ---
      const response = await fetch('/api/products');
      if (response.ok) {
        const backendData: BackendProduct[] = await response.json();
        // --- FIX: Map backend lowercase data to frontend Uppercase state ---
        const frontendProducts: Product[] = backendData.map(p => ({
            ProductID: p.productid,
            Name: p.name,
            Description: p.description,
            Price: Number(p.price), // Ensure number
            StockQuantity: p.stockquantity,
        }));
        setProducts(frontendProducts);
        // --- END FIX ---
      } else {
         const errorData = await response.json();
         toast({
          title: "Error",
          description: errorData.message || "Failed to fetch products.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Network Error",
        description: error.message || "Could not connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    setOrderItems([...orderItems, {
      ProductID: 0,
      ProductName: '',
      Quantity: 1,
      UnitPrice: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Update item logic remains largely the same, using Uppercase keys internally
  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...orderItems];
    const item = { ...newItems[index] };

    if (field === 'ProductID') {
      const productIdNum = Number(value);
      // Find product using Uppercase ProductID from state
      const product = products.find(p => p.ProductID === productIdNum);
      if (product) {
        item.ProductID = product.ProductID;
        item.ProductName = product.Name; // Use Uppercase Name from state
        item.UnitPrice = product.Price; // Use Uppercase Price from state
      } else {
          item.ProductID = 0;
          item.ProductName = '';
          item.UnitPrice = 0;
      }
    } else if (field === 'Quantity') {
       const requestedQty = Math.max(1, Number(value) || 1);
       // Find product using Uppercase ProductID from state
       const product = products.find(p => p.ProductID === item.ProductID);

       if (product && requestedQty > product.StockQuantity) {
         toast({
           title: "Insufficient Stock",
           description: `Only ${product.StockQuantity} units available for ${product.Name}.`,
           // --- FIX: Changed variant to "default" ---
           variant: "default", 
           // --- END FIX ---
         });
         // Set quantity to max available
         item.Quantity = product.StockQuantity > 0 ? product.StockQuantity : 1;
       } else {
         item.Quantity = requestedQty;
       }
    }

    newItems[index] = item;
    setOrderItems(newItems);
  };


  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => {
        // Ensure values are numbers before calculation
        const price = Number(item.UnitPrice) || 0;
        const quantity = Number(item.Quantity) || 0;
        return sum + (price * quantity);
    } , 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      toast({ title: "Validation Error", description: "Add at least one item.", variant: "destructive" });
      return;
    }

    if (orderItems.some(item => !item.ProductID || item.Quantity <= 0)) {
      toast({ title: "Validation Error", description: "Select a product and quantity (>0) for all items.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
        // --- FIX: Map order items to lowercase keys for backend ---
        const itemsForBackend = orderItems.map(item => ({
            productid: item.ProductID,
            quantity: item.Quantity,
            unitprice: item.UnitPrice
        }));
        // --- END FIX ---

      // Use relative path
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          items: itemsForBackend, // Send lowercase items
          totalAmount: getTotalAmount(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Order Created",
          description: "Your order has been submitted for approval.",
        });
        handleClose();
        onOrderCreate();
      } else {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Failed to create order');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not create order.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOrderItems([]);
    onClose();
  };

  // --- FIX: Added safe formatCurrency helper ---
  const formatCurrency = (amount: number | string | undefined | null) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
        return '$--.--';
    }
    return `$${numericAmount.toFixed(2)}`;
  };
  // --- END FIX ---


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading products...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium">Order Items</Label>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {orderItems.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">
                    No items added yet. Click "Add Item" to start.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                  {orderItems.map((item, index) => {
                    // Find product using Uppercase ProductID from state
                    const productDetails = products.find(p => p.ProductID === item.ProductID);
                    return (
                      <Card key={`order-item-${index}`}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-12 sm:col-span-5">
                              <Label htmlFor={`product-${index}`}>Product</Label>
                              <Select
                                value={item.ProductID ? item.ProductID.toString() : ''}
                                onValueChange={(value) => updateItem(index, 'ProductID', value)}
                              >
                                <SelectTrigger id={`product-${index}`}>
                                  <SelectValue placeholder="Select product..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* --- FIX: Map using Uppercase keys from state --- */}
                                  {products.map(product => (
                                     // --- FIX: Use Uppercase ProductID for key and value ---
                                    <SelectItem key={product.ProductID} value={product.ProductID.toString()}>
                                       {/* Use Uppercase keys for display, format price */}
                                      {product.Name} - {formatCurrency(product.Price)} ({product.StockQuantity} in stock)
                                    </SelectItem>
                                  ))}
                                  {/* --- END FIX --- */}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="col-span-4 sm:col-span-2">
                              <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                              <Input
                                id={`quantity-${index}`}
                                type="number"
                                min="1"
                                max={productDetails?.StockQuantity ?? 9999}
                                value={item.Quantity}
                                onChange={(e) => updateItem(index, 'Quantity', e.target.value)}
                              />
                            </div>

                            <div className="col-span-4 sm:col-span-2">
                              <Label>Unit Price</Label>
                              <Input
                                // Use formatCurrency
                                value={formatCurrency(item.UnitPrice)}
                                readOnly
                                className="bg-gray-100 border-gray-300"
                              />
                            </div>

                            <div className="col-span-4 sm:col-span-2">
                              <Label>Total</Label>
                              <Input
                                // Use formatCurrency & ensure numbers
                                value={formatCurrency(Number(item.UnitPrice) * Number(item.Quantity))}
                                readOnly
                                className="bg-gray-100 border-gray-300 font-medium"
                              />
                            </div>

                            <div className="col-span-12 sm:col-span-1 flex items-end justify-end sm:justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
                 {/* Order Total Section */}
                 {orderItems.length > 0 && (
                     <Card className="bg-blue-50 border-blue-200 mt-4">
                        <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium">Order Total:</span>
                            <span className="text-xl font-bold text-blue-600">
                                {/* Use formatCurrency */}
                                {formatCurrency(getTotalAmount())}
                            </span>
                        </div>
                        </CardContent>
                    </Card>
                 )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || orderItems.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Order'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};