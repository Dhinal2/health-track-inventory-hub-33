
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Shipments from "./pages/Shipments";
import Invoices from "./pages/Invoices";
import { Reports } from "./pages/Reports";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/products" element={<AuthGuard><Products /></AuthGuard>} />
          <Route path="/inventory" element={<AuthGuard><Inventory /></AuthGuard>} />
          <Route path="/orders" element={<AuthGuard><Orders /></AuthGuard>} />
          <Route path="/shipments" element={<AuthGuard><Shipments /></AuthGuard>} />
          <Route path="/invoices" element={<AuthGuard><Invoices /></AuthGuard>} />
          <Route path="/reports" element={<AuthGuard><Reports /></AuthGuard>} />
          {/* Placeholder routes for other modules */}
          <Route path="/settings" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
