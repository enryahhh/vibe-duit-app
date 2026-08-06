import { ref, watch, onUnmounted } from 'vue';
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/composables/useAuth';
import type { Transaction, CreateTransactionDTO, TransactionFilter } from '@/types/transaction';

/**
 * Composable for managing transaction lifecycle with atomic account balance updates.
 */
export function useTransactions() {
  const { user } = useAuth();
  const transactions = ref<Transaction[]>([]);
  const loading = ref<boolean>(true);
  const error = ref<string | null>(null);

  let unsubscribe: Unsubscribe | null = null;

  const subscribeToTransactions = (userId: string) => {
    loading.value = true;
    error.value = null;

    if (unsubscribe) unsubscribe();

    try {
      const txRef = collection(db, 'users', userId, 'transactions');
      const q = query(txRef, orderBy('date', 'desc'), orderBy('createdAt', 'desc'), limit(500));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          transactions.value = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              type: data.type,
              amount: Number(data.amount || 0),
              date: data.date,
              fromAccountId: data.fromAccountId,
              toAccountId: data.toAccountId,
              categoryId: data.categoryId,
              categoryName: data.categoryName,
              note: data.note,
              recurrence: data.recurrence,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            } as Transaction;
          });
          loading.value = false;
        },
        (err) => {
          console.error('Error fetching transactions:', err);
          error.value = err.message || 'Failed to fetch transactions';
          loading.value = false;
        }
      );
    } catch (err: any) {
      error.value = err.message || 'Failed to subscribe to transactions';
      loading.value = false;
    }
  };

  watch(
    () => user.value,
    (newUser) => {
      if (newUser) {
        subscribeToTransactions(newUser.uid);
      } else {
        if (unsubscribe) unsubscribe();
        transactions.value = [];
        loading.value = false;
      }
    },
    { immediate: true }
  );

  /**
   * Adds a transaction and atomically updates account balance(s) in Firestore.
   */
  const addTransaction = async (dto: CreateTransactionDTO): Promise<string> => {
    if (!user.value) throw new Error('User must be logged in to record a transaction');

    const userId = user.value.uid;
    const newTxRef = doc(collection(db, 'users', userId, 'transactions'));

    const amount = Number(dto.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Transaction amount must be a positive number');
    }

    await runTransaction(db, async (transaction) => {
      const fromAccRef = doc(db, 'users', userId, 'accounts', dto.fromAccountId);
      const fromAccSnap = await transaction.get(fromAccRef);

      if (!fromAccSnap.exists()) {
        throw new Error('Source account does not exist');
      }

      const fromData = fromAccSnap.data();
      let currentFromBalance = Number(fromData.balance || 0);

      let toAccRef = null;
      let toAccSnap = null;
      let currentToBalance = 0;

      if (dto.toAccountId && (dto.type === 'transfer' || dto.type === 'income')) {
        toAccRef = doc(db, 'users', userId, 'accounts', dto.toAccountId);
        toAccSnap = await transaction.get(toAccRef);
        if (!toAccSnap.exists()) {
          throw new Error('Destination account does not exist');
        }
        currentToBalance = Number(toAccSnap.data().balance || 0);
      }

      // Calculate balance updates based on FR1.6 logic
      if (dto.type === 'expense') {
        // Expense: deduct from source
        const newFromBalance = currentFromBalance - amount;
        transaction.update(fromAccRef, { balance: newFromBalance, updatedAt: serverTimestamp() });
      } else if (dto.type === 'income') {
        if (toAccRef) {
          // Multi-account income: credit target account
          const newToBalance = currentToBalance + amount;
          transaction.update(toAccRef, { balance: newToBalance, updatedAt: serverTimestamp() });
        } else {
          // Credit source account receiving the income
          const newFromBalance = currentFromBalance + amount;
          transaction.update(fromAccRef, { balance: newFromBalance, updatedAt: serverTimestamp() });
        }
      } else if (dto.type === 'transfer') {
        if (!toAccRef) {
          throw new Error('Destination account required for transfer');
        }
        // Transfer: debit source, credit destination
        const newFromBalance = currentFromBalance - amount;
        const newToBalance = currentToBalance + amount;
        transaction.update(fromAccRef, { balance: newFromBalance, updatedAt: serverTimestamp() });
        transaction.update(toAccRef, { balance: newToBalance, updatedAt: serverTimestamp() });
      }

      // Write transaction document
      transaction.set(newTxRef, {
        ...dto,
        amount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    return newTxRef.id;
  };

  /**
   * Deletes a transaction and reverts the balance changes atomically.
   */
  const deleteTransaction = async (tx: Transaction): Promise<void> => {
    if (!user.value) throw new Error('User must be logged in to delete a transaction');

    const userId = user.value.uid;
    const txRef = doc(db, 'users', userId, 'transactions', tx.id);
    const amount = Number(tx.amount);

    await runTransaction(db, async (transaction) => {
      const fromAccRef = doc(db, 'users', userId, 'accounts', tx.fromAccountId);
      const fromAccSnap = await transaction.get(fromAccRef);

      if (fromAccSnap.exists()) {
        const currentFromBalance = Number(fromAccSnap.data().balance || 0);
        // Revert calculations
        if (tx.type === 'expense') {
          transaction.update(fromAccRef, {
            balance: currentFromBalance + amount,
            updatedAt: serverTimestamp(),
          });
        } else if (tx.type === 'income' && !tx.toAccountId) {
          transaction.update(fromAccRef, {
            balance: currentFromBalance - amount,
            updatedAt: serverTimestamp(),
          });
        } else if (tx.type === 'transfer') {
          transaction.update(fromAccRef, {
            balance: currentFromBalance + amount,
            updatedAt: serverTimestamp(),
          });
        }
      }

      if (tx.toAccountId) {
        const toAccRef = doc(db, 'users', userId, 'accounts', tx.toAccountId);
        const toAccSnap = await transaction.get(toAccRef);
        if (toAccSnap.exists()) {
          const currentToBalance = Number(toAccSnap.data().balance || 0);
          if (tx.type === 'income' || tx.type === 'transfer') {
            transaction.update(toAccRef, {
              balance: currentToBalance - amount,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      transaction.delete(txRef);
    });
  };

  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
  };
}
