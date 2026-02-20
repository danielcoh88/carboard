import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Car, CarStatus } from '../types/car';
import * as db from '../db';

export interface Filters {
  search: string;
  make: string;
  yearFrom: number | null;
  yearTo: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  status: CarStatus | '';
  engineType: string;
  transmission: string;
}

export type SortField = 'createdAt' | 'price' | 'year' | 'mileage' | 'rating' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

interface State {
  cars: Car[];
  loading: boolean;
  filters: Filters;
  sortField: SortField;
  sortOrder: SortOrder;
  viewMode: 'grid' | 'list';
}

type Action =
  | { type: 'SET_CARS'; cars: Car[] }
  | { type: 'ADD_CAR'; car: Car }
  | { type: 'UPDATE_CAR'; car: Car }
  | { type: 'DELETE_CAR'; id: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_FILTERS'; filters: Partial<Filters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_SORT'; field: SortField; order: SortOrder }
  | { type: 'SET_VIEW_MODE'; mode: 'grid' | 'list' };

const defaultFilters: Filters = {
  search: '',
  make: '',
  yearFrom: null,
  yearTo: null,
  priceFrom: null,
  priceTo: null,
  status: '',
  engineType: '',
  transmission: '',
};

const initialState: State = {
  cars: [],
  loading: true,
  filters: defaultFilters,
  sortField: 'createdAt',
  sortOrder: 'desc',
  viewMode: 'grid',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CARS':
      return { ...state, cars: action.cars, loading: false };
    case 'ADD_CAR':
      return { ...state, cars: [action.car, ...state.cars] };
    case 'UPDATE_CAR':
      return {
        ...state,
        cars: state.cars.map(c => (c.id === action.car.id ? action.car : c)),
      };
    case 'DELETE_CAR':
      return { ...state, cars: state.cars.filter(c => c.id !== action.id) };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'RESET_FILTERS':
      return { ...state, filters: defaultFilters };
    case 'SET_SORT':
      return { ...state, sortField: action.field, sortOrder: action.order };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };
    default:
      return state;
  }
}

interface CarContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  addCar: (car: Car) => Promise<void>;
  updateCar: (car: Car) => Promise<void>;
  removeCar: (id: string) => Promise<void>;
  loadCars: () => Promise<void>;
  filteredCars: Car[];
}

const CarContext = createContext<CarContextValue | null>(null);

function matchesSearch(car: Car, search: string): boolean {
  if (!search) return true;
  const s = search.toLowerCase();
  return (
    car.make.toLowerCase().includes(s) ||
    car.model.toLowerCase().includes(s) ||
    car.subModel.toLowerCase().includes(s) ||
    car.city.toLowerCase().includes(s) ||
    car.sellerName.toLowerCase().includes(s) ||
    car.color.toLowerCase().includes(s) ||
    car.notes.some(n => n.text.toLowerCase().includes(s))
  );
}

function applyFilters(cars: Car[], filters: Filters): Car[] {
  return cars.filter(car => {
    if (!matchesSearch(car, filters.search)) return false;
    if (filters.make && car.make !== filters.make) return false;
    if (filters.yearFrom && (car.year === null || car.year < filters.yearFrom)) return false;
    if (filters.yearTo && (car.year === null || car.year > filters.yearTo)) return false;
    if (filters.priceFrom && (car.price === null || car.price < filters.priceFrom)) return false;
    if (filters.priceTo && (car.price === null || car.price > filters.priceTo)) return false;
    if (filters.status && car.status !== filters.status) return false;
    if (filters.engineType && car.engineType !== filters.engineType) return false;
    if (filters.transmission && car.transmission !== filters.transmission) return false;
    return true;
  });
}

function applySorting(cars: Car[], field: SortField, order: SortOrder): Car[] {
  const sorted = [...cars].sort((a, b) => {
    let valA: number | string;
    let valB: number | string;
    switch (field) {
      case 'price':
        valA = a.price ?? 0;
        valB = b.price ?? 0;
        break;
      case 'year':
        valA = a.year ?? 0;
        valB = b.year ?? 0;
        break;
      case 'mileage':
        valA = a.mileage ?? 0;
        valB = b.mileage ?? 0;
        break;
      case 'rating':
        valA = a.rating;
        valB = b.rating;
        break;
      case 'updatedAt':
        valA = a.updatedAt;
        valB = b.updatedAt;
        break;
      case 'createdAt':
      default:
        valA = a.createdAt;
        valB = b.createdAt;
        break;
    }
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function CarProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadCars = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const cars = await db.getAllCars();
      dispatch({ type: 'SET_CARS', cars });
    } catch (err) {
      console.error('Failed to load cars:', err);
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  const addCar = useCallback(async (car: Car) => {
    await db.saveCar(car);
    dispatch({ type: 'ADD_CAR', car });
  }, []);

  const updateCar = useCallback(async (car: Car) => {
    const updated = { ...car, updatedAt: new Date().toISOString() };
    await db.saveCar(updated);
    dispatch({ type: 'UPDATE_CAR', car: updated });
  }, []);

  const removeCar = useCallback(async (id: string) => {
    await db.deleteCar(id);
    dispatch({ type: 'DELETE_CAR', id });
  }, []);

  const filteredCars = applySorting(
    applyFilters(state.cars, state.filters),
    state.sortField,
    state.sortOrder
  );

  return (
    <CarContext.Provider value={{ state, dispatch, addCar, updateCar, removeCar, loadCars, filteredCars }}>
      {children}
    </CarContext.Provider>
  );
}

export function useCars() {
  const ctx = useContext(CarContext);
  if (!ctx) throw new Error('useCars must be used within CarProvider');
  return ctx;
}
