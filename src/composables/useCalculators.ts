import { ref, watch, onUnmounted } from "vue";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/composables/useAuth";
import type {
  SavedBusinessScenario,
  SavedInvestmentScenario,
  BusinessStartUpParams,
  InvestmentMode,
  InvestmentResult,
} from "@/types/calculator";

function cleanUndefined<T extends Record<string, any>>(
  obj: T,
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Composable for managing saved investment and business start-up calculation scenarios in Firestore.
 */
export function useCalculators() {
  const { user } = useAuth();
  const businessScenarios = ref<SavedBusinessScenario[]>([]);
  const investmentScenarios = ref<SavedInvestmentScenario[]>([]);
  const loading = ref<boolean>(true);

  let bizUnsubscribe: Unsubscribe | null = null;
  let invUnsubscribe: Unsubscribe | null = null;

  const subscribeToScenarios = (userId: string) => {
    loading.value = true;

    if (bizUnsubscribe) bizUnsubscribe();
    if (invUnsubscribe) invUnsubscribe();

    try {
      // Business Scenarios
      const bizRef = collection(db, "users", userId, "businessScenarios");
      const bizQuery = query(bizRef, orderBy("createdAt", "desc"));

      bizUnsubscribe = onSnapshot(bizQuery, (snapshot) => {
        businessScenarios.value = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId,
            params: data.params,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
          } as SavedBusinessScenario;
        });
      });

      // Investment Scenarios
      const invRef = collection(db, "users", userId, "investmentScenarios");
      const invQuery = query(invRef, orderBy("createdAt", "desc"));

      invUnsubscribe = onSnapshot(invQuery, (snapshot) => {
        investmentScenarios.value = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId,
            title: data.title || "Investment Scenario",
            mode: data.mode as InvestmentMode,
            params: data.params || {},
            result: data.result || {},
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
          } as SavedInvestmentScenario;
        });
        loading.value = false;
      });
    } catch (err) {
      console.error("Error subscribing to saved scenarios:", err);
      loading.value = false;
    }
  };

  watch(
    () => user.value,
    (newUser) => {
      if (newUser) {
        subscribeToScenarios(newUser.uid);
      } else {
        if (bizUnsubscribe) bizUnsubscribe();
        if (invUnsubscribe) invUnsubscribe();
        businessScenarios.value = [];
        investmentScenarios.value = [];
        loading.value = false;
      }
    },
    { immediate: true },
  );

  const saveBusinessScenario = async (
    params: BusinessStartUpParams,
  ): Promise<string> => {
    if (!user.value) throw new Error("Authentication required");

    const colRef = collection(db, "users", user.value.uid, "businessScenarios");
    const newDocRef = doc(colRef);

    const payload = cleanUndefined({
      params,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(newDocRef, payload);
    return newDocRef.id;
  };

  const deleteBusinessScenario = async (id: string): Promise<void> => {
    if (!user.value) throw new Error("Authentication required");
    const docRef = doc(db, "users", user.value.uid, "businessScenarios", id);
    await deleteDoc(docRef);
  };

  const saveInvestmentScenario = async (
    title: string,
    mode: InvestmentMode,
    params: Record<string, any>,
    result: InvestmentResult,
  ): Promise<string> => {
    if (!user.value) throw new Error("Authentication required");

    const colRef = collection(db, "users", user.value.uid, "investmentScenarios");
    const newDocRef = doc(colRef);

    const payload = cleanUndefined({
      title,
      mode,
      params,
      result,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(newDocRef, payload);
    return newDocRef.id;
  };

  const deleteInvestmentScenario = async (id: string): Promise<void> => {
    if (!user.value) throw new Error("Authentication required");
    const docRef = doc(db, "users", user.value.uid, "investmentScenarios", id);
    await deleteDoc(docRef);
  };

  onUnmounted(() => {
    if (bizUnsubscribe) bizUnsubscribe();
    if (invUnsubscribe) invUnsubscribe();
  });

  return {
    businessScenarios,
    investmentScenarios,
    loading,
    saveBusinessScenario,
    deleteBusinessScenario,
    saveInvestmentScenario,
    deleteInvestmentScenario,
  };
}
