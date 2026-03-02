export interface Offer {
  id: number
  name: string
  price: number
  is_active: boolean
}

export type Machine = Offer
export type Technique = Offer
export type Evaluation = Offer


export interface OfferRequest {
  name: string
  price: number
}

export interface OfferEditPayload extends OfferRequest {
  id: number
}
