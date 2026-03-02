export const defaultFilterDebounce: number = 500
export const defaultDraftDebounce: number = 2000
export const defaultDraftMaxWaitDebounce: number = 3500
export const defaultThrottle: number = 2000
export type UUID = string & { readonly __brand: unique symbol }
export const toUUID = (value: string): UUID => {
  return value as UUID
}

export const acceptedFileTypes: string = 'image/jpeg, image/png, application/pdf'
export const maxFileSize = Number(import.meta.env.VITE_MAX_FILE_SIZE_IN_BYTES)

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ALL = 'ALL'
}

export const statuses: Status[] = Object.values(Status) satisfies Status[]

export const rowPerPageOptions: number[] = [
  5,
  10,
  20,
  50,
  100,
]

export interface DialogExpose {
  toggleDialog: () => void
}

export interface DayOfWeek {
  id: number
  name: string
}

export enum Day {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7,
}
