import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { InventoryItem } from '@/pages/Inventory'; // Import the type from the Inventory page

interface ReorderModalProps {
  item: InventoryItem | null; // Accept the item object
  isOpen: boolean;
  onClose: () => void;
  onReorderSubmit: (item: InventoryItem, quantity: number) => void; // Match the handler from Inventory.tsx
}

export const ReorderModal: React.FC<ReorderModalProps> = ({ item, isOpen, onClose, onReorderSubmit }) => {
  // Internal state for the form fields
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState(''); // Keep notes as it's in the UI

  // Effect to populate form when the item prop changes
  useEffect(() => {
    if (item) {
      setItemName(item.Name); // Pre-fill the item name
      
      // Suggest a reorder quantity (e.g., to meet the reorder threshold)
      const suggestedQty = item.ReorderThreshold > item.StockQuantity 
        ? item.ReorderThreshold - item.StockQuantity 
        : 1;
      setQuantity(Math.max(1, suggestedQty)); // Ensure quantity is at least 1
      setNotes(''); // Clear notes
    }
  }, [item]); // Dependency on the item prop

  const handleSubmit = () => {
    // Validation
    if (!item || quantity <= 0) {
      alert('An item must be selected and quantity must be greater than 0.');
      return;
    }
    
    // Call the submit handler from props with the full item object and the new quantity
    onReorderSubmit(item, quantity);
    
    // The modal will be closed by the parent component's logic
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Item Reorder</DialogTitle>
          <DialogDescription>
            Confirm the quantity to reorder for the selected item. This will be sent for approval.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item" className="text-right">Item Name</Label>
            <Input 
              id="item" 
              value={itemName} 
              disabled // Item name is pre-filled and should not be changed
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Quantity</Label>
            <Input 
              id="quantity" 
              type="number" 
              value={quantity} 
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
              className="col-span-3" 
              min="1" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="col-span-3" 
              placeholder="Optional: Add any specific instructions or urgency..." 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};