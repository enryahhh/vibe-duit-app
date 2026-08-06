import { ref, watch, onUnmounted } from "vue";
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
import type {
  Goal,
  CreateGoalDTO,
  UpdateGoalDTO,
  GoalProgressContribution,
  GoalStatus,
} from "@/types/goal";

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
 * Composable for Goal management, real-time Firestore synchronization, and progress contribution logging.
 */
export function useGoals() {
  const { user } = useAuth();
  const goals = ref<Goal[]>([]);
  const loading = ref<boolean>(true);
  const error = ref<string | null>(null);

  let unsubscribe: Unsubscribe | null = null;

  const subscribeToGoals = (userId: string) => {
    loading.value = true;
    error.value = null;

    if (unsubscribe) {
      unsubscribe();
    }

    try {
      const goalsRef = collection(db, "users", userId, "goals");
      const q = query(goalsRef, orderBy("createdAt", "desc"));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          goals.value = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || "",
              targetAmount: Number(data.targetAmount || 0),
              currentSaved: Number(data.currentSaved || 0),
              deadline: data.deadline || undefined,
              priority: data.priority || "medium",
              linkedAccountId: data.linkedAccountId || undefined,
              customMonthlyTarget: data.customMonthlyTarget
                ? Number(data.customMonthlyTarget)
                : undefined,
              status: (data.status as GoalStatus) || "active",
              updatedAt:
                data.updatedAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              createdAt:
                data.createdAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
            } as Goal;
          });
          loading.value = false;
        },
        (err) => {
          console.error("Error fetching goals:", err);
          error.value = err.message || "Failed to fetch goals";
          loading.value = false;
        },
      );
    } catch (err: any) {
      error.value = err.message || "Failed to subscribe to goals";
      loading.value = false;
    }
  };

  watch(
    () => user.value,
    (newUser) => {
      if (newUser) {
        subscribeToGoals(newUser.uid);
      } else {
        if (unsubscribe) unsubscribe();
        goals.value = [];
        loading.value = false;
      }
    },
    { immediate: true },
  );

  const addGoal = async (goalDTO: CreateGoalDTO): Promise<string> => {
    if (!user.value)
      throw new Error("User must be authenticated to add a goal");

    const goalsRef = collection(db, "users", user.value.uid, "goals");
    const newDocRef = doc(goalsRef);

    const payload = cleanUndefined({
      ...goalDTO,
      targetAmount: Number(goalDTO.targetAmount),
      currentSaved: Number(goalDTO.currentSaved || 0),
      status: goalDTO.status || "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(newDocRef, payload);
    return newDocRef.id;
  };

  const updateGoal = async (
    id: string,
    updates: UpdateGoalDTO,
  ): Promise<void> => {
    if (!user.value)
      throw new Error("User must be authenticated to update a goal");

    const docRef = doc(db, "users", user.value.uid, "goals", id);
    const payload: Record<string, any> = cleanUndefined({
      ...updates,
      updatedAt: serverTimestamp(),
    });

    if (updates.targetAmount !== undefined)
      payload.targetAmount = Number(updates.targetAmount);
    if (updates.currentSaved !== undefined)
      payload.currentSaved = Number(updates.currentSaved);

    await updateDoc(docRef, payload);
  };

  const togglePauseGoal = async (id: string): Promise<void> => {
    const targetGoal = goals.value.find((g) => g.id === id);
    if (!targetGoal) return;
    const newStatus: GoalStatus =
      targetGoal.status === "paused" ? "active" : "paused";
    await updateGoal(id, { status: newStatus });
  };

  const deleteGoal = async (id: string): Promise<void> => {
    if (!user.value)
      throw new Error("User must be authenticated to delete a goal");
    const docRef = doc(db, "users", user.value.uid, "goals", id);
    await deleteDoc(docRef);
  };

  const logProgressContribution = async (
    goalId: string,
    amount: number,
    note?: string,
    date?: string,
  ): Promise<void> => {
    if (!user.value)
      throw new Error("User must be authenticated to log goal contribution");

    const targetGoal = goals.value.find((g) => g.id === goalId);
    if (!targetGoal) throw new Error("Goal not found");

    const contribRef = collection(
      db,
      "users",
      user.value.uid,
      "goals",
      goalId,
      "contributions",
    );
    const newDocRef = doc(contribRef);

    const contribPayload = cleanUndefined({
      goalId,
      amount: Number(amount),
      note,
      date: date || new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
    });

    await setDoc(newDocRef, contribPayload);

    // Update current saved and auto-complete status if target reached
    const updatedSaved = targetGoal.currentSaved + Number(amount);
    const updates: UpdateGoalDTO = {
      currentSaved: updatedSaved,
    };
    if (
      updatedSaved >= targetGoal.targetAmount &&
      targetGoal.status === "active"
    ) {
      updates.status = "completed";
    }

    await updateGoal(goalId, updates);
  };

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    togglePauseGoal,
    deleteGoal,
    logProgressContribution,
  };
}
