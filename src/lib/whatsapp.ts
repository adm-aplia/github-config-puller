/**
 * WhatsApp utility functions for phone number extraction and formatting
 */

export interface EvolutionApiInstance {
  number?: string;
  wid?: string;
  owner?: string;
  ownerJid?: string;
  instanceName?: string;
  profileName?: string;
  profilePictureUrl?: string;
  connectionStatus?: string;
  status?: string;
}

/**
 * Extracts phone number from Evolution API instance data
 * Supports multiple extraction methods in order of preference
 */
export function extractPhoneNumberFromApi(apiInstance: EvolutionApiInstance): string | null {
  if (!apiInstance) return null;

  // Method 1: Direct 'number' field
  if (apiInstance.number) {
    return normalizePhoneNumber(apiInstance.number);
  }

  // Method 2: Extract from WID (format: 5541912345678@s.whatsapp.net)
  if (apiInstance.wid) {
    const match = apiInstance.wid.match(/^(\d+)@/);
    if (match && match[1]) {
      return normalizePhoneNumber(match[1]);
    }
  }

  // Method 3: Extract from ownerJid
  if (apiInstance.ownerJid) {
    const match = apiInstance.ownerJid.match(/^(\d+)@/);
    if (match && match[1]) {
      return normalizePhoneNumber(match[1]);
    }
  }

  // Method 4: Use 'owner' field as fallback
  if (apiInstance.owner) {
    return normalizePhoneNumber(apiInstance.owner);
  }

  return null;
}

/**
 * Normalizes phone number to digits only
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Formats phone number for display
 * Supports Brazilian format: +55 (11) 99999-9999
 */
export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return '-';
  
  const normalized = normalizePhoneNumber(phoneNumber);
  
  // Brazilian numbers handling
  if (normalized.startsWith('55')) {
    // 13 digits: +55(11)99999-9999 (complete format)
    if (normalized.length === 13) {
      const ddd = normalized.substring(2, 4);
      const firstPart = normalized.substring(4, 9);
      const secondPart = normalized.substring(9, 13);
      return `+55(${ddd})${firstPart}-${secondPart}`;
    }
    
    // 12 digits: +55(11)9999-9999 (mobile without leading 9)
    if (normalized.length === 12) {
      const ddd = normalized.substring(2, 4);
      const number = normalized.substring(4);
      // Add leading 9 for mobile numbers (8-9 digits)
      if (number.length === 8) {
        return `+55(${ddd})9${number.substring(0, 4)}-${number.substring(4)}`;
      }
      // Already has 9 digits
      return `+55(${ddd})${number.substring(0, 5)}-${number.substring(5)}`;
    }
    
    // 11 digits: +55(11)9999-9999 (without DDD separation)
    if (normalized.length === 11) {
      const ddd = normalized.substring(2, 4);
      const number = normalized.substring(4);
      // Add leading 9 for mobile numbers
      return `+55(${ddd})9${number.substring(0, 4)}-${number.substring(4)}`;
    }
    
    // 10 digits: +55(11)9999-999 (short format)
    if (normalized.length === 10) {
      const ddd = normalized.substring(2, 4);
      const number = normalized.substring(4);
      return `+55(${ddd})9${number.substring(0, 3)}-${number.substring(3)}`;
    }
  }
  
  // International format with country code
  return `+${normalized}`;
}

/**
 * Validates if a phone number is valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const normalized = normalizePhoneNumber(phoneNumber);
  return normalized.length >= 10 && normalized.length <= 15;
}