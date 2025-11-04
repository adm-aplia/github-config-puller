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
    
    // Número internacional brasileiro (+55...)
    if (cleanValue.length >= 12 && cleanValue.startsWith('55')) {
      // Remove o código do país (55)
      const withoutCountryCode = cleanValue.substring(2);
      
      // Extrai DDD (2 primeiros dígitos)
      const ddd = withoutCountryCode.substring(0, 2);
      
      // Extrai número local (resto dos dígitos)
      const localNumber = withoutCountryCode.substring(2);
      
      if (localNumber.length === 9) {
        // Celular: (XX) 9XXXX-XXXX
        return `(${ddd}) ${localNumber.substring(0, 5)}-${localNumber.substring(5, 9)}`;
      } else if (localNumber.length === 8) {
        // Fixo: (XX) XXXX-XXXX
        return `(${ddd}) ${localNumber.substring(0, 4)}-${localNumber.substring(4, 8)}`;
      }
      
      // Se não tiver 8 ou 9 dígitos, retorna com DDD
      return `(${ddd}) ${localNumber}`;
    }
    
    // Número local (10-11 dígitos)
    if (cleanValue.length === 11) {
      // Celular: (XX) 9XXXX-XXXX
      return cleanValue
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    } else if (cleanValue.length === 10) {
      // Fixo: (XX) XXXX-XXXX
      return cleanValue
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    
    // Se não se encaixar em nenhum formato, retorna apenas os dígitos
    return cleanValue;
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