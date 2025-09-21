/**
 * Utilitários para lidar com limites de usuário e valores ilimitados
 */

export const UNLIMITED_VALUE = 999999;

/**
 * Verifica se um valor representa um limite ilimitado
 */
export function isUnlimited(value: number): boolean {
  return value >= UNLIMITED_VALUE;
}

/**
 * Formata um valor de limite para exibição na interface
 */
export function formatLimit(value: number): string {
  if (isUnlimited(value)) {
    return 'Ilimitado';
  }
  return value.toString();
}

/**
 * Formata um valor de uso com limite para exibição na interface
 */
export function formatUsage(used: number, limit: number): string {
  if (isUnlimited(limit)) {
    return `${used} / Ilimitado`;
  }
  return `${used} / ${limit}`;
}

/**
 * Calcula a porcentagem de uso
 */
export function calculateUsagePercentage(used: number, limit: number): number {
  if (isUnlimited(limit)) {
    return 0; // Para valores ilimitados, não mostramos progresso
  }
  return Math.min((used / limit) * 100, 100);
}

/**
 * Verifica se o usuário pode criar mais recursos
 */
export function canCreateMore(used: number, limit: number): boolean {
  if (isUnlimited(limit)) {
    return true;
  }
  return used < limit;
}