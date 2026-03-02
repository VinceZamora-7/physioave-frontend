export interface HMO {
  id: number
  name: string
  is_active: boolean
}

export interface HMOSaveRequestParams {
  name: string
}

export interface HMOEditRequestPayload extends HMOSaveRequestParams{
  id: number
}
