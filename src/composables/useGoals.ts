import { ref, watch, onUnmounted } from "vue";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
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
  const contributionsMap = ref<Record<string, GoalProgressContribution[]>>({});
  const loading = ref<boolean>(true);
  const error = ref<string | null>(null);

  let goalsUnsubscribe: Unsubscribe | null = null;
  const contribUnsubscribers: Record<string, Unsubscribe> = {};

  const clearContribSubscriptions = () => {
    Object.values(contribUnsubscribers).forEach((unsub) => unsub());
    for (const key of Object.keys(contribUnsubscribers)) {
      delete contribUnsubscribers[key];
    }
  };

  const subscribeToGoalContributions = (userId: string, goalId: string) => {
    if (contribUnsubscribers[goalId]) return;

    try {
      const contribRef = collection(db, "users", userId, "goals", goalId, "contributions");
      const q = query(contribRef, orderBy("date", "desc"));

      contribUnsubscribers[goalId] = onSnapshot(
        q,
        (snapshot) => {
          contributionsMap.value = {
            ...contributionsMap.value,
            [goalId]: snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                goalId: data.goalId || goalId,
                amount: Number(data.amount || 0),
                note: data.note || undefined,
                date: data.date || new Date().toISOString().slice(0, 10),
                createdAt:
                  data.createdAt?.toDate?.()?.toISOString() ||
                  new Date().toISOString(),
              } as GoalProgressContribution;
            }),
          };
        },
        (err) => {
          console.error(`Error fetching contributions for goal ${goalId}:`, err);
        },
      );
    } catch (err) {
      console.error("Failed to subscribe to goal contributions:", err);
    }
  };

  const subscribeToGoals = (userId: string) => {
    loading.value = true;
    error.value = null;

    if (goalsUnsubscribe) {
      goalsUnsubscribe();
    }
    clearContribSubscriptions();

    try {
      const goalsRef = collection(db, "users", userId, "goals");
      const q = query(goalsRef, orderBy("createdAt", "desc"));

      goalsUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedGoals: Goal[] = snapshot.docs.map((docSnap) => {
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

          goals.value = loadedGoals;
          loading.value = false;

          // Subscribe to real-time contributions for each goal
          loadedGoals.forEach((goal) => {
            subscribeToGoalContributions(userId, goal.id);
          });
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
        if (goalsUnsubscribe) goalsUnsubscribe();
        clearContribSubscriptions();
        goals.value = [];
        contributionsMap.value = {};
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

    const uid = user.value.uid;

    // 1. Unsubscribe real-time listener for contributions
    if (contribUnsubscribers[id]) {
      contribUnsubscribers[id]();
      delete contribUnsubscribers[id];
    }
    const newContribMap = { ...contributionsMap.value };
    delete newContribMap[id];
    contributionsMap.value = newContribMap;

    // 2. Cascade delete all subcollection contribution documents in a Firestore batch
    const contribRef = collection(db, "users", uid, "goals", id, "contributions");
    const contribSnapshot = await getDocs(contribRef);

    if (!contribSnapshot.empty) {
      const batch = writeBatch(db);
      contribSnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }

    // 3. Delete parent goal document
    const docRef = doc(db, "users", uid, "goals", id);
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

    const contribAmount = Number(amount);

    // Optimistic local update for instant 0ms real-time reactivity
    const updatedSaved = targetGoal.currentSaved + contribAmount;
    targetGoal.currentSaved = updatedSaved;
    if (updatedSaved >= targetGoal.targetAmount && targetGoal.status === "active") {
      targetGoal.status = "completed";
    }

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
      amount: contribAmount,
      note,
      date: date || new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
    });

    await setDoc(newDocRef, contribPayload);

    // Update current saved and auto-complete status in Firestore
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

  const deleteContribution = async (
    goalId: string,
    contribId: string,
    amount: number,
  ): Promise<void> => {
    if (!user.value)
      throw new Error("User must be authenticated to delete a contribution");

    const targetGoal = goals.value.find((g) => g.id === goalId);
    if (!targetGoal) return;

    // Delete contribution doc
    const contribDocRef = doc(
      db,
      "users",
      user.value.uid,
      "goals",
      goalId,
      "contributions",
      contribId,
    );
    await deleteDoc(contribDocRef);

    // Deduct amount from currentSaved
    const newSaved = Math.max(0, targetGoal.currentSaved - Number(amount));
    targetGoal.currentSaved = newSaved;

    const updates: UpdateGoalDTO = {
      currentSaved: newSaved,
    };
    if (newSaved < targetGoal.targetAmount && targetGoal.status === "completed") {
      updates.status = "active";
    }

    await updateGoal(goalId, updates);
  };

  const getContributionsForGoal = (goalId: string): GoalProgressContribution[] => {
    return contributionsMap.value[goalId] || [];
  };

  onUnmounted(() => {
    if (goalsUnsubscribe) {
      goalsUnsubscribe();
    }
    clearContribSubscriptions();
  });

  return {
    goals,
    contributionsMap,
    loading,
    error,
    addGoal,
    updateGoal,
    togglePauseGoal,
    deleteGoal,
    logProgressContribution,
    deleteContribution,
    getContributionsForGoal,
  };
}
