/**
 * Category type classification.
 */
export type CategoryType = 'income' | 'expense' | 'transfer';

/**
 * Category model for categorizing transactions.
 */
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

export type CreateCategoryDTO = Omit<Category, 'id'>;
