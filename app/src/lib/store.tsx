import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { addDays, formatISO, parseISO } from 'date-fns'
import type { AppState, CheckIn, FoodItem, FoodLogEntry, MacroPlan, MealType, Profile, WeightEntry } from '@/types'
import { FOOD_DB } from './foods'
import { buildCheckIn, initialPlan, summarizeWeek, todayStr, weightTrend } from './nutrition'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'

const STORAGE_KEY = 'nutriadapt-v1'

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error'

interface Store extends AppState {
  syncStatus: SyncStatus
  isAuthenticated: boolean
  completeOnboarding: (profile: Profile) => void
  /** Actualiza el perfil y, opcionalmente, aplica un nuevo plan */
  updateProfile: (profile: Profile, newPlan?: MacroPlan) => void
  addFoodEntry: (date: string, meal: MealType, foodId: string, grams: number) => void
  removeFoodEntry: (id: string) => void
  addCustomFood: (food: FoodItem) => void
  addWeight: (date: string, kg: number) => void
  removeWeight: (date: string) => void
  runCheckIn: () => CheckIn | null
  loadDemoData: () => void
  resetAll: () => void
}

const emptyState: AppState = {
  onboarded: false,
  profile: null,
  plan: null,
  foods: FOOD_DB,
  customFoods: [],
  foodLog: [],
  weightLog: [],
  checkIns: [],
}

const StoreContext = createContext<Store | null>(null)

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState
    const parsed = JSON.parse(raw) as AppState
    return { ...emptyState, ...parsed, foods: FOOD_DB }
  } catch {
    return emptyState
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/* ---------- Mapeos servidor → cliente ---------- */

interface ServerData {
  profile: {
    name: string; sex: 'male' | 'female'; age: number; heightCm: number; startWeightKg: number
    activity: Profile['activity']; goal: Profile['goal']; rateKgPerWeek: number; createdOn: string
  } | null
  plan: {
    calories: number; proteinG: number; carbsG: number; fatG: number
    estimatedExpenditure: number; effectiveFrom: string
  } | null
  entries: { id: number; date: string; meal: MealType; foodId: string; grams: number }[]
  foods: {
    foodId: string; name: string; brand: string | null; category: string; barcode: string | null
    source: string; kcal: number; protein: number; carbs: number; fat: number
    servingDesc: string; servingG: number
  }[]
  weights: { date: string; kg: number }[]
  checks: (Omit<CheckIn, never>)[]
}

function serverToState(data: ServerData): AppState {
  return {
    onboarded: !!data.profile,
    profile: data.profile
      ? {
          name: data.profile.name,
          sex: data.profile.sex,
          age: data.profile.age,
          heightCm: data.profile.heightCm,
          startWeightKg: data.profile.startWeightKg,
          activity: data.profile.activity,
          goal: data.profile.goal,
          rateKgPerWeek: data.profile.rateKgPerWeek,
          createdAt: data.profile.createdOn,
        }
      : null,
    plan: data.plan
      ? {
          calories: data.plan.calories,
          proteinG: data.plan.proteinG,
          carbsG: data.plan.carbsG,
          fatG: data.plan.fatG,
          effectiveFrom: data.plan.effectiveFrom,
          estimatedExpenditure: data.plan.estimatedExpenditure,
        }
      : null,
    foods: FOOD_DB,
    customFoods: data.foods.map((f) => ({
      id: f.foodId,
      name: f.name,
      brand: f.brand ?? undefined,
      category: f.category,
      barcode: f.barcode ?? undefined,
      source: f.source as FoodItem['source'],
      kcal: f.kcal,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      servingDesc: f.servingDesc,
      servingG: f.servingG,
    })),
    foodLog: data.entries.map((e) => ({
      id: String(e.id),
      date: e.date,
      meal: e.meal,
      foodId: e.foodId,
      grams: e.grams,
    })),
    weightLog: data.weights.map((w) => ({ date: w.date, kg: w.kg })),
    checkIns: data.checks.map((c) => ({ ...c })),
  }
}

/** Estado local → entrada de importLocal/replaceAll */
function stateToImport(s: AppState) {
  return {
    profile: {
      name: s.profile!.name,
      sex: s.profile!.sex,
      age: s.profile!.age,
      heightCm: s.profile!.heightCm,
      startWeightKg: s.profile!.startWeightKg,
      activity: s.profile!.activity,
      goal: s.profile!.goal,
      rateKgPerWeek: s.profile!.rateKgPerWeek,
      createdOn: s.profile!.createdAt,
    },
    plan: {
      calories: s.plan!.calories,
      proteinG: s.plan!.proteinG,
      carbsG: s.plan!.carbsG,
      fatG: s.plan!.fatG,
      estimatedExpenditure: s.plan!.estimatedExpenditure,
      effectiveFrom: s.plan!.effectiveFrom,
    },
    foodEntries: s.foodLog.map((e) => ({ date: e.date, meal: e.meal, foodId: e.foodId, grams: e.grams })),
    customFoods: s.customFoods.map((f) => ({
      foodId: f.id,
      name: f.name,
      brand: f.brand ?? null,
      category: f.category,
      barcode: f.barcode ?? null,
      source: f.source ?? 'openfoodfacts',
      kcal: f.kcal,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      servingDesc: f.servingDesc,
      servingG: f.servingG,
    })),
    weightEntries: s.weightLog.map((w) => ({ date: w.date, kg: w.kg })),
    checkIns: s.checkIns.map((c) => ({ ...c })),
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local')
  const { user, isAuthenticated } = useAuth()
  const hydratedFor = useRef<number | null>(null)
  const importAttempted = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  /* ---------- Persistencia local (caché offline / modo invitado) ---------- */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  /* ---------- Mutaciones tRPC (todas fire-and-forget con marca de error) ---------- */
  const onSyncError = useCallback(() => setSyncStatus('error'), [])
  const mSaveProfile = trpc.nutria.saveProfile.useMutation({ onError: onSyncError })
  const mSavePlan = trpc.nutria.savePlan.useMutation({ onError: onSyncError })
  const mAddEntry = trpc.nutria.addFoodEntry.useMutation({ onError: onSyncError })
  const mDelEntry = trpc.nutria.deleteFoodEntry.useMutation({ onError: onSyncError })
  const mAddFood = trpc.nutria.addCustomFood.useMutation({ onError: onSyncError })
  const mUpsertWeight = trpc.nutria.upsertWeight.useMutation({ onError: onSyncError })
  const mDelWeight = trpc.nutria.deleteWeight.useMutation({ onError: onSyncError })
  const mAddCheckIn = trpc.nutria.addCheckIn.useMutation({ onError: onSyncError })
  const mImport = trpc.nutria.importLocal.useMutation({ onError: onSyncError })
  const mReplaceAll = trpc.nutria.replaceAll.useMutation({ onError: onSyncError })
  const mReset = trpc.nutria.resetData.useMutation({ onError: onSyncError })

  /* ---------- Hidratación desde el servidor al iniciar sesión ---------- */
  const getAll = trpc.nutria.getAll.useQuery(undefined, { enabled: isAuthenticated, retry: 1 })

  useEffect(() => {
    if (!isAuthenticated || !user) {
      hydratedFor.current = null
      importAttempted.current = false
      setSyncStatus('local')
      return
    }
    if (hydratedFor.current === user.id) return
    if (!getAll.data) return

    const data = getAll.data as unknown as ServerData
    if (data.profile) {
      // El servidor manda: hidrata el estado local
      setState(serverToState(data))
      hydratedFor.current = user.id
      setSyncStatus('synced')
    } else if (stateRef.current.onboarded && stateRef.current.profile && stateRef.current.plan && !importAttempted.current) {
      // Primera vez: sube los datos locales al servidor
      importAttempted.current = true
      setSyncStatus('syncing')
      mImport.mutate(stateToImport(stateRef.current), {
        onSuccess: () => {
          hydratedFor.current = user.id
          setSyncStatus('synced')
        },
      })
    } else {
      hydratedFor.current = user.id
      setSyncStatus('synced')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, getAll.data])

  const authed = isAuthenticated && hydratedFor.current === user?.id

  /* ---------- Acciones (optimistas en local + espejo en servidor) ---------- */

  const completeOnboarding = useCallback(
    (profile: Profile) => {
      const plan = initialPlan(profile)
      setState((s) => ({
        ...s,
        onboarded: true,
        profile,
        plan,
        weightLog: [...s.weightLog.filter((w) => w.date !== todayStr()), { date: todayStr(), kg: profile.startWeightKg }].sort((a, b) => a.date.localeCompare(b.date)),
      }))
      if (authed) {
        mSaveProfile.mutate({
          name: profile.name, sex: profile.sex, age: profile.age, heightCm: profile.heightCm,
          startWeightKg: profile.startWeightKg, activity: profile.activity, goal: profile.goal,
          rateKgPerWeek: profile.rateKgPerWeek, createdOn: profile.createdAt,
        })
        mSavePlan.mutate({
          calories: plan.calories, proteinG: plan.proteinG, carbsG: plan.carbsG, fatG: plan.fatG,
          estimatedExpenditure: plan.estimatedExpenditure, effectiveFrom: plan.effectiveFrom,
        })
        mUpsertWeight.mutate({ date: todayStr(), kg: profile.startWeightKg })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed],
  )

  const updateProfile = useCallback(
    (profile: Profile, newPlan?: MacroPlan) => {
      setState((s) => ({ ...s, profile, ...(newPlan ? { plan: newPlan } : {}) }))
      if (authed) {
        mSaveProfile.mutate({
          name: profile.name, sex: profile.sex, age: profile.age, heightCm: profile.heightCm,
          startWeightKg: profile.startWeightKg, activity: profile.activity, goal: profile.goal,
          rateKgPerWeek: profile.rateKgPerWeek, createdOn: profile.createdAt,
        })
        if (newPlan) {
          mSavePlan.mutate({
            calories: newPlan.calories, proteinG: newPlan.proteinG, carbsG: newPlan.carbsG,
            fatG: newPlan.fatG, estimatedExpenditure: newPlan.estimatedExpenditure,
            effectiveFrom: newPlan.effectiveFrom,
          })
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed],
  )

  const addFoodEntry = useCallback(
    (date: string, meal: MealType, foodId: string, grams: number) => {
      const id = uid()
      setState((s) => ({ ...s, foodLog: [...s.foodLog, { id, date, meal, foodId, grams }] }))
      if (authed) {
        mAddEntry.mutate(
          { date, meal, foodId, grams },
          {
            onSuccess: (r) => {
              // Sustituye el id optimista por el id real del servidor
              setState((s) => ({
                ...s,
                foodLog: s.foodLog.map((e) => (e.id === id ? { ...e, id: String(r.id) } : e)),
              }))
            },
          },
        )
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed],
  )

  const removeFoodEntry = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, foodLog: s.foodLog.filter((e) => e.id !== id) }))
      if (authed && /^\d+$/.test(id)) mDelEntry.mutate({ id: Number(id) })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed],
  )

  const addCustomFood = useCallback(
    (food: FoodItem) => {
      setState((s) =>
        s.customFoods.some((f) => f.id === food.id) || s.foods.some((f) => f.id === food.id)
          ? s
          : { ...s, customFoods: [...s.customFoods, food] },
      )
      if (authed) {
        mAddFood.mutate({
          foodId: food.id, name: food.name, brand: food.brand ?? null, category: food.category,
          barcode: food.barcode ?? null, source: food.source ?? 'openfoodfacts',
          kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat,
          servingDesc: food.servingDesc, servingG: food.servingG,
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed],
  )

  const addWeight = useCallback(
    (date: string, kg: number) => {
      setState((s) => {
        const rest = s.weightLog.filter((w) => w.date !== date)
        return { ...s, weightLog: [...rest, { date, kg }].sort((a, b) => a.date.localeCompare(b.date)) }
      })
      if (authed) mUpsertWeight.mutate({ date, kg })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed],
  )

  const removeWeight = useCallback(
    (date: string) => {
      setState((s) => ({ ...s, weightLog: s.weightLog.filter((w) => w.date !== date) }))
      if (authed) mDelWeight.mutate({ date })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed],
  )

  const runCheckIn = useCallback((): CheckIn | null => {
    let result: CheckIn | null = null
    setState((s) => {
      if (!s.profile || !s.plan) return s
      const summary = summarizeWeek(s.foodLog, [...s.foods, ...s.customFoods], s.weightLog, todayStr())
      const trend = weightTrend(s.weightLog)
      const currentKg = trend.length ? trend[trend.length - 1].trend : s.profile.startWeightKg
      const checkIn = buildCheckIn(s.profile, s.plan, summary, currentKg)
      const newPlan: MacroPlan = {
        calories: checkIn.newCalories,
        proteinG: checkIn.newProteinG,
        carbsG: checkIn.newCarbsG,
        fatG: checkIn.newFatG,
        effectiveFrom: checkIn.date,
        estimatedExpenditure: checkIn.estimatedExpenditure,
      }
      result = checkIn
      if (authed) {
        mAddCheckIn.mutate({
          checkIn: { ...checkIn },
          plan: {
            calories: newPlan.calories, proteinG: newPlan.proteinG, carbsG: newPlan.carbsG,
            fatG: newPlan.fatG, estimatedExpenditure: newPlan.estimatedExpenditure,
            effectiveFrom: newPlan.effectiveFrom,
          },
        })
      }
      return { ...s, plan: newPlan, checkIns: [...s.checkIns, checkIn] }
    })
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  const loadDemoData = useCallback(() => {
    const profile: Profile = {
      name: 'Alex',
      sex: 'male',
      age: 32,
      heightCm: 178,
      startWeightKg: 82,
      activity: 'moderate',
      goal: 'lose',
      rateKgPerWeek: 0.5,
      createdAt: formatISO(addDays(new Date(), -27), { representation: 'date' }),
    }
    const plan = initialPlan(profile)

    const weights: WeightEntry[] = []
    const noise = [0.3, -0.2, 0.4, 0.1, -0.3, 0.2, 0.5, -0.1, 0.3, -0.4, 0.2, 0.1, -0.2, 0.4, 0.3, -0.3, 0.1, 0.2, -0.1, 0.4, -0.2, 0.3, 0.1, -0.3, 0.2, 0.4, -0.2, 0.1]
    for (let i = 27; i >= 0; i--) {
      const idx = 27 - i
      const date = formatISO(addDays(new Date(), -i), { representation: 'date' })
      const kg = Math.round((82 - idx * 0.068 + noise[idx % noise.length]) * 10) / 10
      weights.push({ date, kg })
    }

    const foodLog: FoodLogEntry[] = []
    const breakfastPool = [
      { foodId: 'f025', g: 60 }, { foodId: 'f018', g: 250 }, { foodId: 'f037', g: 120 },
      { foodId: 'f016', g: 170 }, { foodId: 'f008', g: 110 }, { foodId: 'f029', g: 60 },
    ]
    const lunchPool = [
      { foodId: 'f001', g: 150 }, { foodId: 'f026', g: 180 }, { foodId: 'f047', g: 150 },
      { foodId: 'f005', g: 140 }, { foodId: 'f032', g: 180 }, { foodId: 'f060', g: 200 },
      { foodId: 'f004', g: 130 }, { foodId: 'f028', g: 180 }, { foodId: 'f063', g: 10 },
      { foodId: 'ec13', g: 300 }, { foodId: 'ec01', g: 400 },
    ]
    const dinnerPool = [
      { foodId: 'f007', g: 160 }, { foodId: 'f058', g: 150 }, { foodId: 'f048', g: 80 },
      { foodId: 'f010', g: 130 }, { foodId: 'f059', g: 160 }, { foodId: 'f015', g: 110 },
      { foodId: 'f064', g: 60 }, { foodId: 'f063', g: 10 }, { foodId: 'ec16', g: 250 },
    ]
    const snackPool = [
      { foodId: 'f016', g: 170 }, { foodId: 'f038', g: 150 }, { foodId: 'f065', g: 25 },
      { foodId: 'f014', g: 30 }, { foodId: 'f040', g: 150 }, { foodId: 'f071', g: 60 },
      { foodId: 'ec23', g: 90 },
    ]
    let seed = 42
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    for (let i = 27; i >= 0; i--) {
      if (rnd() < 0.15) continue
      const date = formatISO(addDays(new Date(), -i), { representation: 'date' })
      const meals: [MealType, typeof breakfastPool, number][] = [
        ['breakfast', breakfastPool, 3],
        ['lunch', lunchPool, 3],
        ['dinner', dinnerPool, 3],
        ['snacks', snackPool, 2],
      ]
      for (const [meal, pool, count] of meals) {
        const used = new Set<number>()
        for (let k = 0; k < count; k++) {
          let idx = Math.floor(rnd() * pool.length)
          if (used.has(idx)) idx = (idx + 1) % pool.length
          used.add(idx)
          const item = pool[idx]
          foodLog.push({ id: uid(), date, meal, foodId: item.foodId, grams: Math.round(item.g * 1.4 * (0.85 + rnd() * 0.3)) })
        }
      }
    }

    const checkIns: CheckIn[] = []
    let currentPlan = plan
    for (let w = 3; w >= 1; w--) {
      const endDate = formatISO(addDays(new Date(), -7 * w + 6), { representation: 'date' })
      const logUntil = foodLog.filter(
        (e) => e.date <= endDate && e.date > formatISO(addDays(parseISO(endDate), -7), { representation: 'date' }),
      )
      const wUntil = weights.filter((x) => x.date <= endDate)
      const summary = summarizeWeek(logUntil, FOOD_DB, wUntil, endDate)
      const trend = weightTrend(wUntil)
      const kg = trend.length ? trend[trend.length - 1].trend : profile.startWeightKg
      const ci = buildCheckIn(profile, currentPlan, summary, kg)
      ci.date = endDate
      checkIns.push(ci)
      currentPlan = {
        calories: ci.newCalories,
        proteinG: ci.newProteinG,
        carbsG: ci.newCarbsG,
        fatG: ci.newFatG,
        effectiveFrom: endDate,
        estimatedExpenditure: ci.estimatedExpenditure,
      }
    }

    const newState: AppState = {
      onboarded: true,
      profile,
      plan: currentPlan,
      foods: FOOD_DB,
      customFoods: [],
      foodLog,
      weightLog: weights,
      checkIns,
    }
    setState(newState)
    if (authed) {
      setSyncStatus('syncing')
      mReplaceAll.mutate(stateToImport(newState), { onSuccess: () => setSyncStatus('synced') })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState(emptyState)
    if (authed) mReset.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  const value = useMemo<Store>(
    () => ({
      ...state,
      foods: [...state.foods, ...state.customFoods],
      syncStatus,
      isAuthenticated: authed,
      completeOnboarding,
      updateProfile,
      addFoodEntry,
      addCustomFood,
      removeFoodEntry,
      addWeight,
      removeWeight,
      runCheckIn,
      loadDemoData,
      resetAll,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, syncStatus, authed, completeOnboarding, updateProfile, addFoodEntry, addCustomFood, removeFoodEntry, addWeight, removeWeight, runCheckIn, loadDemoData, resetAll],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}
