import { ref, watch, onUnmounted } from 'vue';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/composables/useAuth';
import type { Category, CreateCategoryDTO } from '@/types/category';

export const DEFAULT_CATEGORIES: CreateCategoryDTO[] = [
  // Income categories
  { name: 'Salary', type: 'income', icon: 'Banknote', color: '#10b981', isDefault: true },
  { name: 'Investment Income', type: 'income', icon: 'TrendingUp', color: '#059669', isDefault: true },
  { name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#3b82f6', isDefault: true },
  { name: 'Gift / Bonus', type: 'income', icon: 'Gift', color: '#8b5cf6', isDefault: true },
  { name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#6b7280', isDefault: true },

  // Expense categories
  { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#f59e0b', isDefault: true },
  { name: 'Transportation', type: 'expense', icon: 'Car', color: '#3b82f6', isDefault: true },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899', isDefault: true },
  { name: 'Bills & Utilities', type: 'expense', icon: 'FileText', color: '#ef4444', isDefault: true },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8b5cf6', isDefault: true },
  { name: 'Health & Medical', type: 'expense', icon: 'HeartPulse', color: '#14b8a6', isDefault: true },
  { name: 'Other Expense', type: 'expense', icon: 'MoreHorizontal', color: '#6b7280', isDefault: true },

  // Transfer category
  { name: 'Account Transfer', type: 'transfer', icon: 'ArrowLeftRight', color: '#6366f1', isDefault: true },
];

/**
 * Composable for category management and default category seeding.
 */
export function useCategories() {
  const { user } = useAuth();
  const categories = ref<Category[]>([]);
  const loading = ref<boolean>(true);
  const error = ref<string | null>(null);

  let unsubscribe: Unsubscribe | null = null;

  const seedDefaultCategories = async (userId: string) => {
    try {
      const batch = writeBatch(db);
      DEFAULT_CATEGORIES.forEach((cat) => {
        const catRef = doc(collection(db, 'users', userId, 'categories'));
        batch.set(catRef, cat);
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to seed default categories:', err);
    }
  };

  const subscribeToCategories = (userId: string) => {
    loading.value = true;
    error.value = null;

    if (unsubscribe) unsubscribe();

    const categoriesRef = collection(db, 'users', userId, 'categories');
    const q = query(categoriesRef, orderBy('name', 'asc'));

    unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed defaults if empty
          await seedDefaultCategories(userId);
          loading.value = false;
          return;
        }

        categories.value = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Category[];

        loading.value = false;
      },
      (err) => {
        console.error('Error fetching categories:', err);
        error.value = err.message || 'Failed to fetch categories';
        loading.value = false;
      }
    );
  };

  watch(
    () => user.value,
    (newUser) => {
      if (newUser) {
        subscribeToCategories(newUser.uid);
      } else {
        if (unsubscribe) unsubscribe();
        categories.value = [];
        loading.value = false;
      }
    },
    { immediate: true }
  );

  const addCategory = async (categoryDTO: CreateCategoryDTO): Promise<string> => {
    if (!user.value) throw new Error('User must be authenticated to add a category');

    const catRef = doc(collection(db, 'users', user.value.uid, 'categories'));
    await setDoc(catRef, { ...categoryDTO, isDefault: false });
    return catRef.id;
  };

  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });

  return {
    categories,
    loading,
    error,
    addCategory,
  };
}
