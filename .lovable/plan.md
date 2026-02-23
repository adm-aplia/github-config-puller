

## Plano: Adicionar sistema de cupom de desconto no checkout

### Resumo
Criar um sistema completo de cupons de desconto que o usuario pode aplicar na hora de pagar. O cupom sera validado no backend e enviado ao Asaas usando o campo `discount` da API de assinaturas.

### Como funciona a API do Asaas

O Asaas aceita um objeto `discount` ao criar assinaturas:
```json
{
  "discount": {
    "value": 10,
    "type": "PERCENTAGE",
    "dueDateLimitDays": 0
  }
}
```
- `value`: valor do desconto (percentual ou fixo)
- `type`: `PERCENTAGE` ou `FIXED`
- `dueDateLimitDays`: dias antes do vencimento para aplicar (0 = ate o vencimento)

### Etapas de implementacao

#### 1. Criar tabela `cupons` no Supabase

Colunas:
- `id` (uuid, PK)
- `codigo` (text, unique) - codigo digitado pelo usuario (ex: "APLIA20")
- `tipo_desconto` (text) - "PERCENTAGE" ou "FIXED"
- `valor_desconto` (numeric) - valor do desconto
- `ativo` (boolean, default true)
- `data_inicio` (date, nullable)
- `data_fim` (date, nullable) - validade do cupom
- `max_usos` (integer, nullable) - limite de usos totais (null = ilimitado)
- `usos_atuais` (integer, default 0) - contador de usos
- `planos_aplicaveis` (text[], nullable) - IDs dos planos em que o cupom e valido (null = todos)
- `created_at`, `updated_at`

RLS: somente SELECT para usuarios autenticados (leitura). INSERT/UPDATE/DELETE somente via service role (admin).

#### 2. Criar tabela `cupom_usos` no Supabase

Para rastrear quem usou cada cupom:
- `id` (uuid, PK)
- `cupom_id` (uuid, FK -> cupons)
- `user_id` (uuid)
- `assinatura_id` (uuid, nullable)
- `created_at`

RLS: usuarios podem ver seus proprios usos. Insert via service role.

#### 3. Adicionar secao de cupom na pagina de Checkout (`src/pages/Checkout.tsx`)

No "Resumo do Pedido" (coluna direita), adicionar:
- Um campo de input com botao "Aplicar"
- Ao clicar, chama uma edge function para validar o cupom
- Se valido, mostra o desconto aplicado e o valor final
- Se invalido, mostra mensagem de erro
- Botao para remover cupom aplicado

Visualmente:
```
Resumo do Pedido
-----------------
Plano Profissional
R$ 197,00/mês

[Cupom de desconto]
[ APLIA20       ] [Aplicar]
Desconto: -R$ 39,40 (20%)
-----------------
Total: R$ 157,60/mês
```

#### 4. Criar edge function `validate-coupon`

Recebe: `{ codigo, planId }`
Valida:
- Cupom existe e esta ativo
- Dentro do periodo de validade
- Nao excedeu max_usos
- Plano esta na lista de planos_aplicaveis (ou cupom e para todos)
- Usuario nao ja usou esse cupom antes

Retorna: `{ valid, discount: { value, type }, finalPrice }` ou `{ valid: false, error: "mensagem" }`

#### 5. Atualizar edge function `create-subscription`

- Receber campo opcional `couponCode` no body
- Re-validar o cupom no backend (nunca confiar no frontend)
- Adicionar o objeto `discount` na chamada ao Asaas
- Registrar uso do cupom na tabela `cupom_usos`
- Incrementar `usos_atuais` no cupom

#### 6. Atualizar types do Supabase

Adicionar os tipos das novas tabelas em `src/integrations/supabase/types.ts`.

---

### Detalhes tecnicos

**Fluxo completo:**

1. Usuario digita cupom no checkout e clica "Aplicar"
2. Frontend chama edge function `validate-coupon` para verificar
3. Se valido, frontend mostra desconto e valor final atualizado
4. Usuario clica "Confirmar e Ativar Plano"
5. Frontend envia `couponCode` junto com os dados do cartao para `create-subscription`
6. Edge function re-valida o cupom, calcula desconto, envia `discount` ao Asaas
7. Apos sucesso, registra uso na tabela `cupom_usos`

**Seguranca:**
- Cupom e validado duas vezes (no "Aplicar" e no "Confirmar")
- Apenas service role pode criar/editar cupons
- Controle de usos previne abuso
- Validacao server-side impede manipulacao do frontend

**Arquivos a criar/modificar:**
- `supabase/migrations/` - nova migration para tabelas `cupons` e `cupom_usos`
- `supabase/functions/validate-coupon/index.ts` - nova edge function
- `supabase/functions/create-subscription/index.ts` - adicionar logica de cupom
- `src/pages/Checkout.tsx` - adicionar UI de cupom no resumo
- `src/integrations/supabase/types.ts` - novos tipos
