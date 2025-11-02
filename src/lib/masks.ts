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
    
    // Extract last 8-9 digits (local number)
    const localNumber = cleanValue.length > 9 ? cleanValue.slice(-9) : cleanValue.slice(-8);
    
    if (localNumber.length === 9) {
      // 9 digits: XXXXX-XXXX
      return localNumber.replace(/(\d{5})(\d{4})/, '$1-$2');
    } else if (localNumber.length === 8) {
      // 8 digits: XXXX-XXXX
      return localNumber.replace(/(\d{4})(\d{4})/, '$1-$2');
    }
    
    return localNumber;
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