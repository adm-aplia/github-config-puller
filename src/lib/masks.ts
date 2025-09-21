// Input masks for forms
export const applyMask = {
  cpf: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  },

  cnpj: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  },

  cpfCnpj: (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 11) {
      return applyMask.cpf(value);
    }
    return applyMask.cnpj(value);
  },

  phone: (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    
    // Se o número já começa com 55, assumir que tem código do país
    if (cleanValue.startsWith('55') && cleanValue.length >= 12) {
      const countryCode = cleanValue.substring(0, 2);
      const areaCode = cleanValue.substring(2, 4);
      const number = cleanValue.substring(4);
      
      if (number.length === 9) {
        // Celular: +55 (XX) 9XXXX-XXXX
        return `+${countryCode} (${areaCode}) ${number.substring(0, 5)}-${number.substring(5, 9)}`;
      } else if (number.length === 8) {
        // Fixo: +55 (XX) XXXX-XXXX
        return `+${countryCode} (${areaCode}) ${number.substring(0, 4)}-${number.substring(4, 8)}`;
      }
    }
    
    // Número sem código do país - adicionar +55
    if (cleanValue.length >= 10) {
      const areaCode = cleanValue.substring(0, 2);
      const number = cleanValue.substring(2);
      
      if (number.length === 9) {
        // Celular: +55 (XX) 9XXXX-XXXX
        return `+55 (${areaCode}) ${number.substring(0, 5)}-${number.substring(5, 9)}`;
      } else if (number.length === 8) {
        // Fixo: +55 (XX) XXXX-XXXX
        return `+55 (${areaCode}) ${number.substring(0, 4)}-${number.substring(4, 8)}`;
      }
    }
    
    // Para números em digitação, aplicar máscara gradualmente
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '+55 ($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  },

  cep: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  },

  cardNumber: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})\d+?$/, '$1');
  },

  cardExpiry: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2}\/\d{4})\d+?$/, '$1');
  }
};