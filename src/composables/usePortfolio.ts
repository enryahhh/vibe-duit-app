import { ref, computed, watch, onUnmounted } from "vue";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/composables/useAuth";
import type { InvestmentHolding, PortfolioSummary } from "@/types/calculator";

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
 * Composable for logging, tracking, and evaluating investment portfolio holdings in Firestore.
 */
export function usePortfolio() {
  const { user } = useAuth();
  const holdings = ref<InvestmentHolding[]>([]);
  const loading = ref<boolean>(true);

  let unsubscribe: Unsubscribe | null = null;

  const subscribeToHoldings = (userId: string) => {
    loading.value = true;
    if (unsubscribe) unsubscribe();

    try {
      const colRef = collection(db, "users", userId, "holdings");
      const q = query(colRef, orderBy("createdAt", "desc"));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          holdings.value = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || "",
              category: data.category || "mutual_fund",
              units: Number(data.units || 0),
              purchasePricePerUnit: Number(data.purchasePricePerUnit || 0),
              currentNavPerUnit: Number(data.currentNavPerUnit || 0),
              purchaseDate: data.purchaseDate || new Date().toISOString().slice(0, 10),
              notes: data.notes || undefined,
              createdAt:
                data.createdAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              updatedAt:
                data.updatedAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
            } as InvestmentHolding;
          });
          loading.value = false;
        },
        (err) => {
          console.error("Error fetching holdings:", err);
          loading.value = false;
        },
      );
    } catch (err) {
      console.error("Failed to subscribe to portfolio holdings:", err);
      loading.value = false;
    }
  };

  watch(
    () => user.value,
    (newUser) => {
      if (newUser) {
        subscribeToHoldings(newUser.uid);
      } else {
        if (unsubscribe) unsubscribe();
        holdings.value = [];
        loading.value = false;
      }
    },
    { immediate: true },
  );

  const portfolioSummary = computed<PortfolioSummary>(() => {
    const totalCost = holdings.value.reduce(
      (sum, h) => sum + h.units * h.purchasePricePerUnit,
      0,
    );
    const currentValue = holdings.value.reduce(
      (sum, h) => sum + h.units * h.currentNavPerUnit,
      0,
    );
    const unrealizedGainLoss = currentValue - totalCost;
    const percentage =
      totalCost > 0 ? (unrealizedGainLoss / totalCost) * 100 : 0;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      unrealizedGainLoss: Math.round(unrealizedGainLoss * 100) / 100,
      unrealizedGainLossPercentage: Math.round(percentage * 100) / 100,
    };
  });

  const addHolding = async (
    dto: Omit<InvestmentHolding, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> => {
    if (!user.value) throw new Error("Authentication required");

    const colRef = collection(db, "users", user.value.uid, "holdings");
    const newDocRef = doc(colRef);

    const payload = cleanUndefined({
      ...dto,
      units: Number(dto.units),
      purchasePricePerUnit: Number(dto.purchasePricePerUnit),
      currentNavPerUnit: Number(dto.currentNavPerUnit || dto.purchasePricePerUnit),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(newDocRef, payload);
    return newDocRef.id;
  };

  const updateHoldingNav = async (
    id: string,
    currentNavPerUnit: number,
  ): Promise<void> => {
    if (!user.value) throw new Error("Authentication required");
    const docRef = doc(db, "users", user.value.uid, "holdings", id);

    await updateDoc(
      docRef,
      cleanUndefined({
        currentNavPerUnit: Number(currentNavPerUnit),
        updatedAt: serverTimestamp(),
      }),
    );
  };

  const deleteHolding = async (id: string): Promise<void> => {
    if (!user.value) throw new Error("Authentication required");
    const docRef = doc(db, "users", user.value.uid, "holdings", id);
    await deleteDoc(docRef);
  };

  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });

  return {
    holdings,
    portfolioSummary,
    loading,
    addHolding,
    updateHoldingNav,
    deleteHolding,
  };
}
