import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function TermosServico() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-aplia-light-gray to-aplia-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex justify-center mb-8">
            <img 
              alt="Aplia — Assistentes de IA para Profissionais da Saúde" 
              className="h-16 w-auto" 
              src="/aplia-logo-full.png"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📄 Termos de Serviço
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Última atualização: 24/07/2025
            </p>
          </header>

          <article className="prose prose-gray dark:prose-invert max-w-none">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Termos de Serviço – Aplia
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Estes Termos de Serviço regulam o uso da plataforma Aplia. Ao utilizá-la, você concorda com os termos abaixo:
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  1. Uso da Plataforma
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  A Aplia fornece uma plataforma para profissionais da saúde gerenciarem compromissos e comunicação com clientes via inteligência artificial. O uso deve ser feito de maneira ética, conforme a legislação vigente.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  2. Cadastro e Responsabilidade
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Você é responsável por manter suas credenciais seguras e por todas as atividades realizadas em sua conta.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  3. Integrações
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Ao integrar com serviços como o Google Calendar, você autoriza o acesso às suas informações, conforme autorizado via OAuth. A Aplia se compromete a usá-las somente para fins de operação da plataforma.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  4. Limitações
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  A plataforma pode passar por atualizações, interrupções temporárias ou descontinuação de funcionalidades sem aviso prévio.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  5. Rescisão
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Podemos encerrar ou suspender o acesso à plataforma caso haja violação dos termos, uso indevido ou práticas ilegais.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  6. Alterações
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Estes termos podem ser atualizados. A versão mais recente estará sempre disponível em nosso site.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Contato:
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Para dúvidas, fale com{" "}
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