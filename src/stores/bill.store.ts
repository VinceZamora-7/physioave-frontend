import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useStorage} from "@vueuse/core";
import type {Patient} from "@/models/patient.ts";

export type BillingServiceType = 'single' | 'package' | 'home-service'
export type PaymentMethod = 'cash' | 'gcash' | 'bank-transfer' | 'card'

export interface SessionBillRecord {
  id: string
  patient_id: number
  patient_name: string
  session_date: string
  service_type: BillingServiceType
  service_name: string
  package_name?: string
  session_no?: number
  amount_due: number
  amount_paid: number
  payment_method: PaymentMethod
  notes?: string
  created_at: string
}

export interface ExpenseRecord {
  id: string
  expense_date: string
  category: string
  amount: number
  notes?: string
  created_by: string
  created_at: string
}

const makeId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const billStore = defineStore('billStore', () => {
  const patient = ref<Patient | undefined>()
  const bills = useStorage<SessionBillRecord[]>('pams:bills', [])
  const expenses = useStorage<ExpenseRecord[]>('pams:expenses', [])

  const resetPatient = () => {
    patient.value = undefined
  }

  const selectedPatientBills = computed(() => {
    if (!patient.value) return bills.value
    return bills.value.filter(bill => bill.patient_id === patient.value?.id)
  })

  const addBill = (payload: Omit<SessionBillRecord, 'id' | 'created_at'>): SessionBillRecord => {
    const newBill: SessionBillRecord = {
      ...payload,
      id: makeId(),
      created_at: new Date().toISOString()
    }
    bills.value = [newBill, ...bills.value]
    return newBill
  }

  const removeBill = (id: string): void => {
    bills.value = bills.value.filter(bill => bill.id !== id)
  }

  const addExpense = (payload: Omit<ExpenseRecord, 'id' | 'created_at'>): ExpenseRecord => {
    const newExpense: ExpenseRecord = {
      ...payload,
      id: makeId(),
      created_at: new Date().toISOString()
    }
    expenses.value = [newExpense, ...expenses.value]
    return newExpense
  }

  const removeExpense = (id: string): void => {
    expenses.value = expenses.value.filter(expense => expense.id !== id)
  }

  const getDailySummary = (date: string): {income: number; expenses: number; net: number} => {
    const income = bills.value
      .filter(bill => bill.session_date === date)
      .reduce((sum, bill) => sum + bill.amount_paid, 0)

    const expenseValue = expenses.value
      .filter(expense => expense.expense_date === date)
      .reduce((sum, expense) => sum + expense.amount, 0)

    return {
      income,
      expenses: expenseValue,
      net: income - expenseValue
    }
  }

  return {
    patient,
    bills,
    expenses,
    selectedPatientBills,
    resetPatient,
    addBill,
    removeBill,
    addExpense,
    removeExpense,
    getDailySummary
  }
})
