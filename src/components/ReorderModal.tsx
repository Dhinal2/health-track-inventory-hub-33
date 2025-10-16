import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { InventoryItem } from '../pages/Inventory';

interface ReorderModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReorderSubmit: (item: InventoryItem, quantity: number) => void;
}

export const ReorderModal: React.FC<ReorderModalProps> = ({ item, isOpen, onClose, onReorderSubmit }) => {
  const [quantity, setQuantity] = useState(1);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setTotalCost(item.Price || 0);
    }
  }, [item]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value) || 1;
    setQuantity(newQuantity);
    if (item) {
      setTotalCost((item.Price || 0) * newQuantity);
    }
  };

  const handleSubmit = () => {
    if (item && quantity > 0) {
      onReorderSubmit(item, quantity);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reorder: {item.Name}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
            <p><strong>Current Stock:</strong> {item.StockQuantity} units</p>
            <p><strong>Item Price:</strong> ${item.Price ? item.Price.toFixed(2) : 'N/A'}</p>
          </div>
          <div>
            <Label htmlFor="reorder-quantity">Reorder Quantity</Label>
            <Input
              id="reorder-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              className="mt-1"
            />
          </div>
          <div className="text-right font-bold text-lg">
            Total Cost: ${totalCost.toFixed(2)}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit Reorder Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};