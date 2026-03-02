import {Day} from "@/utils/global.type.ts";

interface BaseClinic {
  name: string
  start_day: Day
  end_day: Day
}

export interface Clinic extends BaseClinic {
  id: number

  start_time: Date // '08:00:00' format
  end_time: Date // '08:00:00' format
  start_day_name: string
  end_day_name: string
  start_time_formatted: string
  end_time_formatted: string
  is_active: boolean
}

export interface ClinicRequestBody extends BaseClinic {
  start_time: string // '08:00:00' format
  end_time: string // '08:00:00' format
}

export interface ClinicEditRequestPayload extends ClinicRequestBody {
  id: number
}
