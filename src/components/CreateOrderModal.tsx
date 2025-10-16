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

interface Product {
  ProductID: number;
  Description: string;
  Price: number;
  StockQuantity: number;
}

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
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch products.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Could not connect to the server.",
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

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...orderItems];
    const item = { ...newItems[index] };
    
    if (field === 'ProductID') {
      const product = products.find(p => p.ProductID === Number(value));
      if (product) {
        item.ProductID = product.ProductID;
        item.ProductName = product.Description;
        item.UnitPrice = product.Price;
      }
    } else if (field === 'Quantity') {
      const product = products.find(p => p.ProductID === item.ProductID);
      const requestedQty = Number(value);
      
      if (product && requestedQty > product.StockQuantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.StockQuantity} units available for ${product.Description}.`,
          variant: "destructive",
        });
        item.Quantity = product.StockQuantity;
      } else {
        item.Quantity = requestedQty;
      }
    }
    
    newItems[index] = item;
    setOrderItems(newItems);
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + (item.UnitPrice * item.Quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the order.",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.some(item => !item.ProductID || item.Quantity <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please ensure all items have a product selected and valid quantity.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          items: orderItems,
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
        throw new Error('Failed to create order');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not create order. Please try again.",
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Order Items</Label>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {orderItems.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">
                    No items added yet. Click "Add Item" to start building your order.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item, index) => {
                    const product = products.find(p => p.ProductID === item.ProductID);
                    return (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-5">
                              <Label>Product</Label>
                              <Select 
                                value={item.ProductID ? item.ProductID.toString() : ''} 
                                onValueChange={(value) => updateItem(index, 'ProductID', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map(product => (
                                    <SelectItem key={product.ProductID} value={product.ProductID.toString()}>
                                      {product.Description} - ${product.Price.toFixed(2)} ({product.StockQuantity} in stock)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="col-span-2">
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                max={product?.StockQuantity || 999}
                                value={item.Quantity}
                                onChange={(e) => updateItem(index, 'Quantity', e.target.value)}
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <Label>Unit Price</Label>
                              <Input
                                value={`$${item.UnitPrice.toFixed(2)}`}
                                readOnly
                                className="bg-gray-50"
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <Label>Total</Label>
                              <Input
                                value={`$${(item.UnitPrice * item.Quantity).toFixed(2)}`}
                                readOnly
                                className="bg-gray-50 font-medium"
                              />
                            </div>
                            
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Order Total:</span>
                        <span className="text-xl font-bold text-blue-600">
                          ${getTotalAmount().toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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