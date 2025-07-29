
import React, { useState } from 'react';
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
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock products data
const mockProducts = [
  { id: 'P001', name: 'Surgical Mask', price: 2.50, stock: 500 },
  { id: 'P002', name: 'Hand Sanitizer', price: 10.00, stock: 200 },
  { id: 'P003', name: 'Ventilator Filters', price: 24.00, stock: 75 },
  { id: 'P004', name: 'Antibiotics', price: 30.00, stock: 100 },
  { id: 'P005', name: 'Disposable Gloves', price: 15.00, stock: 300 },
];

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreate: (orderData: { department: string; items: OrderItem[] }) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreate
}) => {
  const [department, setDepartment] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();

  const departments = ['Emergency', 'ICU', 'Pharmacy', 'General', 'Surgery'];

  const addItem = () => {
    setOrderItems([...orderItems, {
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...orderItems];
    const item = { ...newItems[index] };
    
    if (field === 'productId') {
      const product = mockProducts.find(p => p.id === value);
      if (product) {
        item.productId = product.id;
        item.productName = product.name;
        item.unitPrice = product.price;
        item.total = product.price * item.quantity;
      }
    } else if (field === 'quantity') {
      item.quantity = Number(value);
      item.total = item.unitPrice * Number(value);
    } else {
      (item as any)[field] = value;
    }
    
    newItems[index] = item;
    setOrderItems(newItems);
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!department) {
      toast({
        title: "Validation Error",
        description: "Please select a department.",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the order.",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.some(item => !item.productId || item.quantity <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please ensure all items have a product selected and valid quantity.",
        variant: "destructive",
      });
      return;
    }

    onOrderCreate({ department, items: orderItems });
    handleClose();
  };

  const handleClose = () => {
    setDepartment('');
    setOrderItems([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                {orderItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-4">
                          <Label>Product</Label>
                          <Select 
                            value={item.productId} 
                            onValueChange={(value) => updateItem(index, 'productId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockProducts.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - ${product.price}
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
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <Label>Unit Price</Label>
                          <Input
                            value={`$${item.unitPrice.toFixed(2)}`}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                        
                        <div className="col-span-3">
                          <Label>Total</Label>
                          <Input
                            value={`$${item.total.toFixed(2)}`}
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
                ))}

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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
