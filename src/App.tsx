import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/authContext";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyAadhaar from "./pages/VerifyAadhaar";
import AuthRedirect from "./pages/AuthRedirect";
import ProviderDashboard from "./pages/ProviderDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import BookingPage from "./pages/BookingPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import HallOfFame from "./pages/HallOfFame";
import AdminDashboard from "./pages/AdminDashboard";
import TrackingPage from "./pages/TrackingPage";
import ChatPage from "./pages/ChatPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login/:role" element={<Login />} />
            <Route path="/signup/:role" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-aadhaar" element={<VerifyAadhaar />} />
            <Route path="/auth-redirect" element={<AuthRedirect />} />
            <Route path="/provider-dashboard" element={<ProviderDashboard />} />
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/track/:bookingId" element={<TrackingPage />} />
            <Route path="/chat/:bookingId" element={<ChatPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
