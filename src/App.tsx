import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth-provider";
import { SidebarProvider } from "@/hooks/use-sidebar";
import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import PerfilsPage from "./pages/Perfis";
import AgendamentosPage from "./pages/Agendamentos";
import ConversasPage from "./pages/Conversas";
import WhatsAppPage from "./pages/WhatsApp";
import IntegracoesPage from "./pages/Integracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SidebarProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/home" element={<Index />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/perfis" element={<PerfilsPage />} />
              <Route path="/dashboard/agendamentos" element={<AgendamentosPage />} />
              <Route path="/dashboard/conversas" element={<ConversasPage />} />
              <Route path="/dashboard/whatsapp" element={<WhatsAppPage />} />
              <Route path="/dashboard/integracoes" element={<IntegracoesPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
