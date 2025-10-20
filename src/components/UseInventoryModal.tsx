import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { InventoryItem } from '../pages/Inventory';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { X, QrCode } from 'lucide-react';

interface UseInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inventoryId: number, quantityUsed: number) => void;
  inventoryList: InventoryItem[];
}

export const UseInventoryModal: React.FC<UseInventoryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  inventoryList
}) => {
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsScanning(false);
      setSelectedInventoryId(null);
      setQuantity(1);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader', 
        { fps: 10, qrbox: 250 },
        false
      );

      const onScanSuccess = (decodedText: string) => {
        const foundItem = inventoryList.find(item => item.ProductID === parseInt(decodedText, 10));
        if (foundItem) {
          setSelectedInventoryId(foundItem.InventoryID);
          setIsScanning(false);
          scanner.clear();
        } else {
          alert("Inventory item not found for this QR code.");
        }
      };

      scanner.render(onScanSuccess, undefined);

      return () => {
        if (scanner) {
          scanner.clear();
        }
      };
    }
  }, [isScanning, inventoryList]);

  if (!isOpen) return null;

  const selectedItem = inventoryList.find(item => item.InventoryID === selectedInventoryId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Use Inventory Item</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        
        {isScanning ? (
          <div>
            <div id="qr-reader" className="w-full"></div>
            <Button variant="outline" className="w-full mt-4" onClick={() => setIsScanning(false)}>Cancel Scan</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button className="w-full flex items-center gap-2" onClick={() => setIsScanning(true)}>
              <QrCode className="w-5 h-5" /> Scan QR Code
            </Button>
            <p className="text-center text-sm text-gray-500">- OR -</p>
            <div>
              <Label>Select Item Manually</Label>
              <Select onValueChange={(value) => setSelectedInventoryId(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an item..." />
                </SelectTrigger>
                <SelectContent>
                  {inventoryList.map(item => (
                    <SelectItem key={item.InventoryID} value={String(item.InventoryID)}>
                      {item.Name} (Current Stock: {item.StockQuantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedItem && (
              <div>
                <Label>Quantity to Use</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  min="1"
                  max={selectedItem.StockQuantity}
                />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                disabled={!selectedInventoryId || quantity <= 0}
                onClick={() => onConfirm(selectedInventoryId!, quantity)}
              >
                Confirm Use
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};