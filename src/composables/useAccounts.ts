import { ref, watch, onUnmounted } from 'vue';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/composables/useAuth';
import type { Account, CreateAccountDTO } from '@/types/account';

function cleanUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Composable for Account CRUD operations and real-time synchronization.
 */
export function useAccounts() {
  const { user } = useAuth();
  const accounts = ref<Account[]>([]);
  const loading = ref<boolean>(true);
  const error = ref<string | null>(null);

  let unsubscribe: Unsubscribe | null = null;

  const subscribeToAccounts = (userId: string) => {
    loading.value = true;
    error.value = null;

    if (unsubscribe) {
      unsubscribe();
    }

    try {
      const accountsRef = collection(db, 'users', userId, 'accounts');
      const q = query(accountsRef, orderBy('createdAt', 'desc'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          accounts.value = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || '',
              type: data.type || 'bank',
              currency: data.currency || 'IDR',
              balance: Number(data.balance || 0),
              institutionName: data.institutionName,
              accountNumberMask: data.accountNumberMask,
              color: data.color || '#3b82f6',
              icon: data.icon || 'Wallet',
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            } as Account;
          });
          loading.value = false;
        },
        (err) => {
          console.error('Error fetching accounts:', err);
          error.value = err.message || 'Failed to fetch accounts';
          loading.value = false;
        }
      );
    } catch (err: any) {
      error.value = err.message || 'Failed to subscribe to accounts';
      loading.value = false;
    }
  };

  watch(
    () => user.value,
    (newUser) => {
      if (newUser) {
        subscribeToAccounts(newUser.uid);
      } else {
        if (unsubscribe) unsubscribe();
        accounts.value = [];
        loading.value = false;
      }
    },
    { immediate: true }
  );

  const addAccount = async (accountDTO: CreateAccountDTO): Promise<string> => {
    if (!user.value) throw new Error('User must be authenticated to add an account');

    const accountsRef = collection(db, 'users', user.value.uid, 'accounts');
    const newDocRef = doc(accountsRef);

    const payload = cleanUndefined({
      ...accountDTO,
      balance: Number(accountDTO.balance),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(newDocRef, payload);
    return newDocRef.id;
  };

  const updateAccount = async (id: string, updates: Partial<CreateAccountDTO>): Promise<void> => {
    if (!user.value) throw new Error('User must be authenticated to update an account');

    const docRef = doc(db, 'users', user.value.uid, 'accounts', id);
    const payload: Record<string, any> = cleanUndefined({
      ...updates,
      updatedAt: serverTimestamp(),
    });

    if (updates.balance !== undefined) {
      payload.balance = Number(updates.balance);
    }

    await updateDoc(docRef, payload);
  };

  const adjustBalance = async (id: string, newBalance: number): Promise<void> => {
    return updateAccount(id, { balance: newBalance });
  };

  const deleteAccount = async (id: string): Promise<void> => {
    if (!user.value) throw new Error('User must be authenticated to delete an account');
    const docRef = doc(db, 'users', user.value.uid, 'accounts', id);
    await deleteDoc(docRef);
  };

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  return {
    accounts,
    loading,
    error,
    addAccount,
    updateAccount,
    adjustBalance,
    deleteAccount,
  };
}
