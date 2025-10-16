import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';

// Define the shape of a product fetched from the backend
interface Product {
    ProductID: number;
    Name: string;
    Price: number;
}

interface OrderItem {
    ProductID: number;
    ProductName: string;
    Quantity: number;
    Price: number;
    Total: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreate: (orderData: { items: OrderItem[]; totalAmount: number }) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onOrderCreate }) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    // Fetch available products when the modal opens
    if (isOpen) {
      const fetchProducts = async () => {
        try {
          const response = await fetch('http://localhost:3001/api/products');
          if (response.ok) {
            setProducts(await response.json());
          }
        } catch (error) {
          console.error('Failed to fetch products', error);
        }
      };
      fetchProducts();
    }
  }, [isOpen]);

  const handleAddItem = () => {
    const product = products.find(p => p.ProductID.toString() === selectedProductId);
    if (!product || quantity <= 0) {
      toast({ title: "Invalid Item", description: "Please select a valid product and quantity.", variant: "destructive" });
      return;
    }
    const newItem: OrderItem = {
      ProductID: product.ProductID,
      ProductName: product.Name,
      Quantity: quantity,
      Price: product.Price,
      Total: product.Price * quantity
    };
    setOrderItems(prev => [...prev, newItem]);
    // Reset fields
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleSubmitOrder = () => {
    if (orderItems.length === 0) {
        toast({ title: "Empty Order", description: "Please add at least one item to the order.", variant: "destructive" });
        return;
    }
    const totalAmount = orderItems.reduce((sum, item) => sum + item.Total, 0);
    onOrderCreate({ items: orderItems, totalAmount });
    onClose();
    setOrderItems([]); // Clear items after submission
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        {/* ... rest of the modal for adding items ... */}
        <div className="flex justify-end pt-4">
            <Button onClick={handleSubmitOrder}>Submit Order</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};