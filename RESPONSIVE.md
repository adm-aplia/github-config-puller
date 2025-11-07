# 📱 Sistema de Responsividade - Aplia

Este documento descreve o sistema de responsividade implementado no projeto Aplia, garantindo uma experiência perfeita em qualquer dispositivo.

## 🎯 Princípios Fundamentais

### 1. Mobile-First Approach
Todo o CSS é escrito primeiro para dispositivos móveis, com media queries progressivas para telas maiores:

```css
/* Base: mobile */
.elemento { font-size: 14px; }

/* Tablet e acima */
@media (min-width: 768px) {
  .elemento { font-size: 16px; }
}

/* Desktop e acima */
@media (min-width: 1024px) {
  .elemento { font-size: 18px; }
}
```

### 2. Unidades Relativas
**Nunca usamos pixels fixos** (exceto para borders e sombras). Sempre usamos:
- `rem` e `em` para tamanhos
- `%` e `vw/vh` para larguras/alturas
- `clamp()` para valores fluidos

### 3. Variáveis CSS Fluidas
Todo o sistema é baseado em variáveis CSS que escalam automaticamente usando `clamp()`.

## 📐 Breakpoints Padrão

```typescript
screens: {
  'xs': '480px',   // Smartphones pequenos
  'sm': '640px',   // Smartphones
  'md': '768px',   // Tablets vertical
  'lg': '1024px',  // Tablets horizontal / Desktops pequenos
  'xl': '1280px',  // Desktops
  '2xl': '1440px', // Desktops grandes
  '3xl': '1920px', // Telas muito grandes
}
```

## 🎨 Sistema de Variáveis CSS

### Spacing (Espaçamento Fluido)

```css
--spacing-xs: clamp(0.25rem, 1vw, 0.5rem);    /* 4px → 8px */
--spacing-sm: clamp(0.5rem, 2vw, 1rem);       /* 8px → 16px */
--spacing-md: clamp(1rem, 3vw, 1.5rem);       /* 16px → 24px */
--spacing-lg: clamp(1.5rem, 4vw, 2.5rem);     /* 24px → 40px */
--spacing-xl: clamp(2rem, 5vw, 4rem);         /* 32px → 64px */
--spacing-2xl: clamp(3rem, 6vw, 6rem);        /* 48px → 96px */
```

**Uso no Tailwind:**
```tsx
<div className="p-fluid-md lg:p-fluid-lg">
  {/* Padding responsivo automático */}
</div>
```

### Typography (Tipografia Fluida)

```css
--font-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);   /* 12px → 14px */
--font-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);     /* 14px → 16px */
--font-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);     /* 16px → 18px */
--font-lg: clamp(1.125rem, 1rem + 0.625vw, 1.375rem);   /* 18px → 22px */
--font-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem);    /* 20px → 28px */
--font-2xl: clamp(1.5rem, 1.3rem + 1vw, 2.25rem);       /* 24px → 36px */
--font-3xl: clamp(1.875rem, 1.5rem + 1.5vw, 3rem);      /* 30px → 48px */
```

**Uso no Tailwind:**
```tsx
<h1 className="text-fluid-2xl sm:text-fluid-3xl">
  Título Responsivo
</h1>
```

### Container (Larguras Máximas)

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1440px;
--container-max: 1600px;
```

**Uso:**
```tsx
<div className="max-w-[1600px] mx-auto px-fluid-md lg:px-fluid-lg">
  {/* Container responsivo centralizado */}
</div>
```

### Sidebar (Larguras do Menu Lateral)

```css
--sidebar-width-full: clamp(220px, 20vw, 280px);  /* Sidebar expandida */
--sidebar-width-collapsed: 3.5rem;                 /* Sidebar colapsada (56px) */
--sidebar-width-mobile: 280px;                     /* Sidebar mobile (overlay) */
```

## 🧩 Componentes Responsivos

### Cards

```tsx
// Card com padding fluido e altura uniforme
<Card className="h-full">
  <CardHeader className="pb-2">
    <CardTitle className="text-fluid-sm">Título</CardTitle>
  </CardHeader>
  <CardContent className="pt-0">
    <div className="text-fluid-xl sm:text-fluid-2xl">Valor</div>
  </CardContent>
</Card>
```

### Buttons

```tsx
// Botões com tamanhos responsivos e touch-friendly (min 44x44px em mobile)
<Button size="default">
  {/* h-9 sm:h-10 px-3 sm:px-4 */}
  Botão Padrão
</Button>

<Button size="icon">
  {/* h-9 w-9 sm:h-10 sm:w-10 */}
  <Icon />
</Button>
```

### Grids

```tsx
// Grid completamente fluido
<div className="grid gap-fluid-sm sm:gap-fluid-md grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
  {/* Cards com altura uniforme */}
</div>
```

## 🛠️ Hook useResponsive

Use o hook `useResponsive` para lógica condicional baseada no breakpoint:

```tsx
import { useResponsive } from '@/hooks/use-responsive'

function MyComponent() {
  const { isMobile, isTablet, isDesktop, breakpoint, windowSize } = useResponsive()
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}
      
      {/* ou */}
      <p>Largura atual: {windowSize.width}px</p>
      <p>Breakpoint: {breakpoint}</p>
    </div>
  )
}
```

## ✅ Checklist de Validação

Ao criar novos componentes, certifique-se de que:

- [ ] ✅ Funciona perfeitamente de 320px a 2560px
- [ ] ✅ Sem scroll horizontal indesejado
- [ ] ✅ Fontes escalam proporcionalmente
- [ ] ✅ Elementos reorganizam (lado a lado → empilhados)
- [ ] ✅ Aproveita espaço em telas grandes
- [ ] ✅ Mantém hierarquia visual em todas as resoluções
- [ ] ✅ Touch-friendly em mobile (min 44x44px para botões)
- [ ] ✅ Usa variáveis CSS do design system
- [ ] ✅ Evita valores fixos em pixels

## 📱 Testes em Dispositivos

### Breakpoints Recomendados para Teste:

1. **Mobile Small**: 375px (iPhone SE)
2. **Mobile**: 390px (iPhone 12/13/14)
3. **Tablet Vertical**: 768px (iPad)
4. **Tablet Horizontal**: 1024px (iPad)
5. **Desktop**: 1440px (Desktop padrão)
6. **Large Desktop**: 1920px (Full HD)
7. **Extra Large**: 2560px (2K/4K)

### Como Testar no Lovable:

Clique no ícone de dispositivo (phone/tablet/desktop) acima da preview para alternar entre visualizações.

## 🎓 Exemplos Práticos

### Exemplo 1: Header Responsivo

```tsx
<header className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-fluid-lg">
  <div>
    <h1 className="text-fluid-2xl sm:text-fluid-3xl font-bold">Título</h1>
    <p className="text-fluid-sm text-muted-foreground mt-2">Descrição</p>
  </div>
  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
    <Button size="sm">Ação 1</Button>
    <Button size="sm">Ação 2</Button>
  </div>
</header>
```

### Exemplo 2: Grid de Métricas

```tsx
<div className="grid gap-fluid-sm sm:gap-fluid-md grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
  {metrics.map((metric) => (
    <Card key={metric.id} className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-fluid-sm">{metric.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-fluid-xl sm:text-fluid-2xl font-bold">
          {metric.value}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### Exemplo 3: Layout com Sidebar

```tsx
<div className="min-h-screen flex w-full">
  <Sidebar className="hidden md:flex" />
  <main className="flex-1 overflow-auto">
    <div className="p-fluid-md lg:p-fluid-lg max-w-[1600px] mx-auto">
      {children}
    </div>
  </main>
</div>
```

## 🚀 Próximos Passos

Para adicionar novos componentes responsivos:

1. Use sempre `clamp()` para valores fluidos
2. Comece mobile-first
3. Teste em todos os breakpoints
4. Use as variáveis CSS existentes
5. Evite pixels fixos
6. Garanta touch-friendly em mobile (44x44px mínimo)

## 📚 Recursos Adicionais

- [Tailwind CSS Docs - Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [CSS clamp() - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [Mobile-First CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first)

---

**Última atualização**: 2025-11-07
