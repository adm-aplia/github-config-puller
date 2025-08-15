import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"

// Logos da Aplia
const apliaLogoFull = "/lovable-uploads/0baeb265-4d17-458a-b42a-6fc9ce0041a6.png"
const apliaLogoFullDark = "/lovable-uploads/e9a17318-593a-428d-b166-e4f8be819529.png"

export default function PoliticaPrivacidade() {
  const { theme } = useTheme()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-aplia-light-gray to-aplia-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex justify-center mb-8">
            <img 
              alt="Aplia — Assistentes de IA para Profissionais da Saúde" 
              className="h-10 w-auto" 
              src={theme === 'dark' ? apliaLogoFullDark : apliaLogoFull}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🔒 Política de Privacidade
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Última atualização: 22/05/2025
            </p>
          </header>

          <article className="prose prose-gray dark:prose-invert max-w-none">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Política de Privacidade – Aplia
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  A Aplia se compromete com a privacidade e proteção dos dados dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos e protegemos as informações fornecidas ao utilizar nossa plataforma.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  1. Coleta de Informações
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Coletamos dados fornecidos diretamente por você, como nome, e-mail e preferências, bem como dados necessários para integração com o Google Calendar, incluindo permissões para visualizar e modificar eventos na sua agenda.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  2. Uso das Informações
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  Utilizamos as informações coletadas para:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Agendar compromissos automaticamente em sua agenda</li>
                  <li>Enviar notificações e resumos</li>
                  <li>Melhorar nossos serviços e suporte</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  3. Compartilhamento
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Não vendemos nem compartilhamos seus dados com terceiros, exceto quando necessário para operação do serviço (ex: Google APIs), sob termos de confidencialidade.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  4. Segurança
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Adotamos medidas técnicas e organizacionais para proteger seus dados contra acessos não autorizados, perda ou alteração.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  5. Seus Direitos
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento, enviando um e-mail para{" "}
                  <a 
                    href="mailto:suporte@aplia.com" 
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    suporte@aplia.com
                  </a>
                  .
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  6. Google OAuth
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Nosso aplicativo usa OAuth 2.0 para autenticação e só acessa dados com seu consentimento explícito. Em nenhum momento armazenamos suas credenciais.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  7. Alterações
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Podemos atualizar esta política periodicamente. Notificaremos você em caso de mudanças relevantes.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Contato:
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Para dúvidas, entre em contato:{" "}
                  <a 
                    href="mailto:suporte@aplia.com" 
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    suporte@aplia.com
                  </a>
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}