import {Status} from "@/utils/global.type.ts";

export interface Pageable<T> {
  content: T[]
  page_request: PageRequest
  total_elements: number
  total_pages: number

  has_next_page: boolean
  has_previous_page: boolean

  next_page: number | null
  previous_page: number | null
}

export interface PageRequest {
  page: number
  size: number
}

export interface PageableRequest extends PageRequest {
  name: string | undefined
  status: Status | undefined
}

export type PageRequestWithName = Omit<PageableRequest, 'status'>
export type PageRequestWithStatus = Omit<PageableRequest, 'name'>
export type PageRequestWithNameAndStatus = Omit<PageableRequest, 'page' | 'size'>

export const defaultPage: number = 1
export const defaultPageSize: number = 100
export const defaultStatus: Status = Status.ACTIVE
