/**
 * Account types supported by the application.
 */
export type AccountType = 'bank' | 'ewallet' | 'cash' | 'investment' | 'credit_card';

/**
 * Account interface matching Firestore document schema.
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  institutionName?: string;
  accountNumberMask?: string;
  color?: string;
  icon?: string;
  updatedAt: string;
  createdAt: string;
}

/**
 * DTO for creating or updating an Account.
 */
export type CreateAccountDTO = Omit<Account, 'id' | 'createdAt' | 'updatedAt'>;
