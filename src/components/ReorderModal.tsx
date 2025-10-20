import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  // --- THIS IS THE FIX ---
  // Added the onReorder prop
  onReorder: (details: { item: string; quantity: number; notes: string }) => void;
}

export const ReorderModal: React.FC<ReorderModalProps> = ({ isOpen, onClose, onReorder }) => {
  const [item, setItem] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState('');

  const handleSubmit = () => {
    // Basic validation
    if (!item || quantity <= 0) {
      alert('Please enter a valid item name and quantity.');
      return;
    }
    onReorder({ item, quantity, notes });
    // Reset form for next time
    setItem('');
    setQuantity(1);
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Item Reorder</DialogTitle>
          <DialogDescription>
            Fill in the details below to request a reorder for an item. This will be sent for approval.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item" className="text-right">Item Name</Label>
            <Input id="item" value={item} onChange={(e) => setItem(e.target.value)} className="col-span-3" placeholder="e.g., Saline Solution 500ml" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Quantity</Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="col-span-3" min="1" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" placeholder="Optional: Add any specific instructions or urgency..." />
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