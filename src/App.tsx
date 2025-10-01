import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth-provider";
import EmailVerification from "@/components/email-verification";
import { useEmailVerification } from "@/hooks/use-email-verification";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { ThemeProvider } from "@/hooks/use-theme";
import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import CadastroPage from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import DashboardPage from "./pages/Dashboard";
import PerfilsPage from "./pages/Perfis";
import AgendamentosPage from "./pages/Agendamentos";
import ConversasPage from "./pages/Conversas";
import WhatsAppPage from "./pages/WhatsApp";
import IntegracoesPage from "./pages/Integracoes";
import PlanosPage from "./pages/Planos";
import CheckoutPage from "./pages/Checkout";
import ConfiguracoesPage from "./pages/Configuracoes";
import TermosServico from "./pages/TermosServico";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import NotFound from "./pages/NotFound";
import AuthGoogleCallback from "./pages/AuthGoogleCallback";

const queryClient = new QueryClient();

function AppContent() {
  const { needsEmailVerification } = useEmailVerification()

  if (needsEmailVerification) {
    return <EmailVerification />
  }

  return (
    <SidebarProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/termos" element={<TermosServico />} />
          <Route path="/privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/perfis" element={<ProtectedRoute><PerfilsPage /></ProtectedRoute>} />
          <Route path="/dashboard/agendamentos" element={<ProtectedRoute><AgendamentosPage /></ProtectedRoute>} />
          <Route path="/dashboard/conversas" element={<ProtectedRoute><ConversasPage /></ProtectedRoute>} />
          <Route path="/dashboard/whatsapp" element={<ProtectedRoute><WhatsAppPage /></ProtectedRoute>} />
          <Route path="/dashboard/integracoes" element={<ProtectedRoute><IntegracoesPage /></ProtectedRoute>} />
          <Route path="/dashboard/planos" element={<ProtectedRoute><PlanosPage /></ProtectedRoute>} />
          <Route path="/dashboard/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/dashboard/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />
          <Route path="/auth/google/callback" element={<AuthGoogleCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SidebarProvider>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
