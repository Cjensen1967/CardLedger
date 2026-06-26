import { useState, useEffect, useCallback } from 'react';
import type {
  AdminStore,
  CardType,
  Color,
  Employee,
  PropertySettings,
  PackagingRules,
} from '../types';

const STORAGE_KEY = 'cardledger_admin';

// ─── Seed defaults ────────────────────────────────────────────────────────────

const DEFAULT_STORE: AdminStore = {
  settings: {
    propertyName: '',
    pdfHeaderText: 'CONFIDENTIAL — Card Storage Log',
    pdfFooterText: 'Authorized personnel only',
    pdfOutputDir: '',
    printMode: 'pdf_only',
  },
  packagingRules: {
    allowPartialBoxes: false,
  },
  cardTypes: [
    { id: 'ct-baccarat', name: 'Baccarat', decksPerBox: 8, boxesPerCase: 0, active: true },
    { id: 'ct-singledeck', name: 'Single Deck', decksPerBox: 12, boxesPerCase: 0, active: true },
  ],
  colors: [],
  employees: [],
};

// ─── Persistence helpers ──────────────────────────────────────────────────────

function load(): AdminStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    return JSON.parse(raw) as AdminStore;
  } catch {
    return DEFAULT_STORE;
  }
}

function save(store: AdminStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminStore() {
  const [store, setStore] = useState<AdminStore>(load);

  // Persist on every change
  useEffect(() => {
    save(store);
  }, [store]);

  const update = useCallback((updater: (prev: AdminStore) => AdminStore) => {
    setStore(prev => updater(prev));
  }, []);

  // ── Settings ──────────────────────────────────────────────────────────────

  const saveSettings = useCallback(
    (settings: PropertySettings) => update(s => ({ ...s, settings })),
    [update]
  );

  const savePackagingRules = useCallback(
    (packagingRules: PackagingRules) => update(s => ({ ...s, packagingRules })),
    [update]
  );

  // ── Card Types ────────────────────────────────────────────────────────────

  const addCardType = useCallback(
    (ct: Omit<CardType, 'id'>) =>
      update(s => ({
        ...s,
        cardTypes: [...s.cardTypes, { ...ct, id: generateId() }],
      })),
    [update]
  );

  const updateCardType = useCallback(
    (updated: CardType) =>
      update(s => ({
        ...s,
        cardTypes: s.cardTypes.map(ct => (ct.id === updated.id ? updated : ct)),
      })),
    [update]
  );

  const toggleCardTypeActive = useCallback(
    (id: string) =>
      update(s => ({
        ...s,
        cardTypes: s.cardTypes.map(ct =>
          ct.id === id ? { ...ct, active: !ct.active } : ct
        ),
      })),
    [update]
  );

  // ── Colors ────────────────────────────────────────────────────────────────

  const addColor = useCallback(
    (c: Omit<Color, 'id'>) =>
      update(s => ({
        ...s,
        colors: [...s.colors, { ...c, id: generateId() }],
      })),
    [update]
  );

  const updateColor = useCallback(
    (updated: Color) =>
      update(s => ({
        ...s,
        colors: s.colors.map(c => (c.id === updated.id ? updated : c)),
      })),
    [update]
  );

  const toggleColorActive = useCallback(
    (id: string) =>
      update(s => ({
        ...s,
        colors: s.colors.map(c =>
          c.id === id ? { ...c, active: !c.active } : c
        ),
      })),
    [update]
  );

  // ── Employees ─────────────────────────────────────────────────────────────

  const addEmployee = useCallback(
    (e: Omit<Employee, 'id'>) =>
      update(s => ({
        ...s,
        employees: [...s.employees, { ...e, id: generateId() }],
      })),
    [update]
  );

  const updateEmployee = useCallback(
    (updated: Employee) =>
      update(s => ({
        ...s,
        employees: s.employees.map(e => (e.id === updated.id ? updated : e)),
      })),
    [update]
  );

  const toggleEmployeeActive = useCallback(
    (id: string) =>
      update(s => ({
        ...s,
        employees: s.employees.map(e =>
          e.id === id ? { ...e, active: !e.active } : e
        ),
      })),
    [update]
  );

  return {
    store,
    saveSettings,
    savePackagingRules,
    addCardType,
    updateCardType,
    toggleCardTypeActive,
    addColor,
    updateColor,
    toggleColorActive,
    addEmployee,
    updateEmployee,
    toggleEmployeeActive,
  };
}
