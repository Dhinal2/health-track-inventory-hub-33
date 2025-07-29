import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceGenerate: (invoiceData: any) => void;
}

// Mock orders for autocomplete
const mockOrders = [
  { id: 'ORD-004', customerName: 'Metro General Hospital', facilityName: 'Emergency' },
  { id: 'ORD-005', customerName: 'Community Health Center', facilityName: 'ICU' },
  { id: 'ORD-006', customerName: 'Regional Medical', facilityName: 'Surgery' },
];

// Mock products for line items
const mockProducts = [
  { id: 'P001', name: 'Surgical Masks', price: 2.25 },
  { id: 'P002', name: 'Hand Sanitizer', price: 10.25 },
  { id: 'P003', name: 'IV Bags', price: 7.50 },
  { id: 'P004', name: 'Disposable Gloves', price: 17.99 },
  { id: 'P005', name: 'Syringes', price: 0.85 },
];

export const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onInvoiceGenerate,
}) => {
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
    },
  ]);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  );
  const [taxRate] = useState(0.1); // 10% tax

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = mockOrders.find(o => o.id === orderId);
    if (order) {
      setCustomerName(order.customerName);
      setFacilityName(order.facilityName);
      // Auto-populate customer details (in real app, this would come from the order)
      setCustomerAddress('123 Healthcare Blvd, Medical City, MC 12345');
      setCustomerContact('+1 (555) 123-4567');
      setCustomerEmail('billing@healthcare.com');
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = mockProducts.find(p => p.id === productId);
    if (product) {
      const updatedItems = [...lineItems];
      updatedItems[index] = {
        ...updatedItems[index],
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        subtotal: updatedItems[index].quantity * product.price,
      };
      setLineItems(updatedItems);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      subtotal: quantity * updatedItems[index].unitPrice,
    };
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;
    return { subtotal, tax, grandTotal };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!customerName || !facilityName || !dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (lineItems.some(item => !item.productId || item.quantity <= 0)) {
      toast({
        title: "Validation Error", 
        description: "Please complete all line items.",
        variant: "destructive",
      });
      return;
    }

    const { subtotal, tax, grandTotal } = calculateTotals();

    const invoiceData = {
      orderId: selectedOrderId || 'MANUAL',
      customerName,
      facilityName,
      customerDetails: {
        name: customerName,
        address: customerAddress,
        contact: customerContact,
        email: customerEmail,
      },
      items: lineItems.filter(item => item.productId),
      totalAmount: subtotal,
      tax,
      grandTotal,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      notes,
    };

    onInvoiceGenerate(invoiceData);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setSelectedOrderId('');
    setCustomerName('');
    setFacilityName('');
    setCustomerAddress('');
    setCustomerContact('');
    setCustomerEmail('');
    setLineItems([{
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
    }]);
    setNotes('');
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    onClose();
  };

  const { subtotal, tax, grandTotal } = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate New Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Existing Order (Optional)</Label>
              <Select value={selectedOrderId} onValueChange={handleOrderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order..." />
                </SelectTrigger>
                <SelectContent>
                  {mockOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.id} - {order.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "MMM dd, yyyy") : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityName">Facility Name *</Label>
                <Input
                  id="facilityName"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="Enter facility name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Input
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Enter customer address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerContact">Contact</Label>
                <Input
                  id="customerContact"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="Enter contact number"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <Button type="button" onClick={addLineItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="text-sm">Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => handleProductSelect(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${product.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-sm">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-sm">Unit Price</Label>
                    <Input
                      value={`$${item.unitPrice.toFixed(2)}`}
                      disabled
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <Label className="text-sm">Subtotal</Label>
                    <Input
                      value={`$${item.subtotal.toFixed(2)}`}
                      disabled
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Grand Total:</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Generate Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};