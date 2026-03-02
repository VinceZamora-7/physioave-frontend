import {createStore, del, get, set, type UseStore} from "idb-keyval";
import type {FormFieldState} from "@primevue/forms";
import type {IndexedDBKey} from "@/utils/keys/indexeddb-key.ts";

export interface DraftService<T> {
  delete(): Promise<void | undefined>

  get(): Promise<T | undefined>

  save(values: Record<string, FormFieldState> | undefined): Promise<void | undefined>
}

export const createDraftService = <T>(key: IndexedDBKey): DraftService<T> => {
  const draftStore: UseStore = createStore(key, key)

  return {
    async delete(): Promise<void | undefined> {
      try {
        await del(key, draftStore)
      } catch (error: unknown) {
        console.error(error)
      }
    },

    async get(): Promise<T | undefined> {
      try {
        const storedDraft: string | undefined = await get<string | undefined>(key, draftStore)
        if (!storedDraft) return
        return JSON.parse(storedDraft) as T
      } catch (error: unknown) {
        console.error(error)
      }
    },

    async save(values: Record<string, FormFieldState> | undefined): Promise<void | undefined> {
      try {
        if (!values) return
        const flattened = Object.fromEntries(
          Object.entries(values).map(([key, obj]) => [key, obj.value]),
        ) as T

        await set(key, JSON.stringify(flattened) as T, draftStore);
      } catch (error: unknown) {
        console.error(error)
      }
    }
  }
}
