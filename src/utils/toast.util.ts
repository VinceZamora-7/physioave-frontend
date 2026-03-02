import type {ToastServiceMethods} from "primevue";

export const successToast = (toast: ToastServiceMethods, message: string) => {
  return toast.add({
    severity: 'success',
    summary: 'Success Message',
    detail: `${message}`,
    life: 3000
  })
}

export const errorToast = (toast: ToastServiceMethods, message: string) => {
  return toast.add({severity: 'error', summary: 'Error Message', detail: `${message}`, life: 3000})
}

export const warningToast = (toast: ToastServiceMethods, message: string): void => {
  toast.add({
    severity: 'warn',
    summary: 'Warning Message',
    detail: message,
    life: 3000,
  })
}

export const infoToast = (toast: ToastServiceMethods, message: string): void => {
  toast.add({
    severity: 'info',
    summary: 'Information Message',
    detail: message,
    life: 3000,
  })
}
