// src/types.ts

export type ShipmentStatus = 'dispatched' | 'in-transit' | 'delivered';
export type BackendShipmentStatus = 'Pending' | 'In Transit' | 'Delivered';

// The single, consistent Shipment type for the entire frontend
export interface Shipment {
  // Fields from backend (now in camelCase)
  shipmentID: number;
  orderID: number;
  destinationUser: string;
  destination: string;
  estimatedDelivery: string;

  // Frontend-specific fields
  id: string;
  orderId: string; // Note: we have both orderId and orderID for mapping
  status: ShipmentStatus;
  lastUpdated: string;
  originCoords: [number, number];
  currentCoords: [number, number];
  destinationCoords: [number, number];
  originAddress: string;
  currentAddress: string;
  destinationAddress: string;
}


//Invoices
// Frontend-specific status type for better component logic
export type FrontendPaymentStatus = 'paid' | 'unpaid' | 'partially_paid' | 'overdue';

// Backend-specific status type
export type BackendPaymentStatus = 'Paid' | 'Unpaid' | 'Partially Paid';

// A comprehensive Invoice type for the frontend
export interface Invoice {
  // Fields from your backend (converted to camelCase)
  invoiceID: number;
  orderID: number;
  customerName: string;
  totalAmount: number;
  paymentStatus: FrontendPaymentStatus; // Use the frontend-friendly type
  issueDate: string;
  dueDate: string;

  // Detailed fields required by the UI components (we will mock these)
  id: string; // Use invoiceID as a string
  orderId: string; // Use orderID as a string
  facilityName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  tax: number;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
  customerDetails: {
    name: string;
    address: string;
    contact: string;
    email: string;
  };
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: string;
  }>;
  notes?: string;
}

// --- Find and replace this line in src/types.ts ---
export type OrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'Delivered' | 'Awaiting Payment' | 'Pending Final Payment' | 'Received' | 'Completed' | 'Dispatched' | 'In transit';

export interface OrderItem {
  OrderItemID: number;
  ProductID: number;
  ProductName: string;
  Quantity: number;
  UnitPrice: number;
}

export interface Order {
  OrderID: number;
  PlacedBy: string;
  UserID: number;
  Status: OrderStatus;
  TotalAmount: number;
  OrderDate: string;
  Items: OrderItem[];
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'Administrator' | 'Healthcare Staff';
  status: 'Active' | 'Inactive';
  contactNumber?: string;
}