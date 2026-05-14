import { pamsAPI } from "@/utils/axios-interceptor"

export type SetupStatus = boolean | null

let setupChecked = false
let isInitialized = false

export const getSetupStatus = async (force = false): Promise<SetupStatus> => {
  if (setupChecked && !force) return isInitialized

  try {
    const { data } = await pamsAPI.get<{ isInitialized: boolean }>("/setup/status")
    isInitialized = Boolean(data?.isInitialized)
    setupChecked = true
    return isInitialized
  } catch {
    return null
  }
}

export const markSetupInitialized = (): void => {
  setupChecked = true
  isInitialized = true
}

export const clearSetupStatusCache = (): void => {
  setupChecked = false
  isInitialized = false
}
