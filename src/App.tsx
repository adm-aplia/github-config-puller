import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SidebarProvider } from "@/hooks/use-sidebar";
import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import CadastroPage from "./pages/Cadastro";
import DashboardPage from "./pages/Dashboard";
import PerfilsPage from "./pages/Perfis";
import AgendamentosPage from "./pages/Agendamentos";
import ConversasPage from "./pages/Conversas";
import WhatsAppPage from "./pages/WhatsApp";
import IntegracoesPage from "./pages/Integracoes";
import TermosServico from "./pages/TermosServico";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
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
              <Route path="/cadastro" element={<CadastroPage />} />
              <Route path="/termos" element={<TermosServico />} />
              <Route path="/privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/dashboard/perfis" element={<ProtectedRoute><PerfilsPage /></ProtectedRoute>} />
              <Route path="/dashboard/agendamentos" element={<ProtectedRoute><AgendamentosPage /></ProtectedRoute>} />
              <Route path="/dashboard/conversas" element={<ProtectedRoute><ConversasPage /></ProtectedRoute>} />
              <Route path="/dashboard/whatsapp" element={<ProtectedRoute><WhatsAppPage /></ProtectedRoute>} />
              <Route path="/dashboard/integracoes" element={<ProtectedRoute><IntegracoesPage /></ProtectedRoute>} />
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
