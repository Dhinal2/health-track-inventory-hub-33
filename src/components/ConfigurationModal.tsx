import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { InventoryItem } from '../pages/Inventory';

interface ConfigurationModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}

export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ item, isOpen, onClose, onSave }) => {
  const [reorderThreshold, setReorderThreshold] = useState(0);
  const [autoReorder, setAutoReorder] = useState(false);

  useEffect(() => {
    if (item) {
      setReorderThreshold(item.ReorderThreshold);
      setAutoReorder(item.AutoReorder);
    }
  }, [item]);

  const handleSave = () => {
    if (item) {
      // Create a new object with the updated properties to pass to the onSave function
      const updatedItem = {
        ...item,
        ReorderThreshold: reorderThreshold,
        AutoReorder: autoReorder,
      };
      onSave(updatedItem);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Item: {item.Name}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div>
            <Label htmlFor="reorderThreshold">Reorder Threshold</Label>
            <Input
              id="reorderThreshold"
              type="number"
              value={reorderThreshold}
              onChange={(e) => setReorderThreshold(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">Set the stock level that triggers a low-stock alert.</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
            <Label htmlFor="autoReorder">Enable Auto-Reorder</Label>
            <Switch
              id="autoReorder"
              checked={autoReorder}
              onCheckedChange={setAutoReorder}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

