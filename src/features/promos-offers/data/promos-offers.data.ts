export type PromoBillingType = "INDIVIDUAL_PRICING" | "PACKAGE_BILLING" | "ALA_CARTE"
export type PromoServiceType = "SINGLE" | "PACKAGE" | "HMO"

export interface PromoOfferCatalogItem {
  id: string
  category: string
  name: string
  regular_price: number
  promo_price: number
  billing_type: PromoBillingType
  service_type: PromoServiceType
}

export const PROMO_OFFERS_CATALOG: PromoOfferCatalogItem[] = [
  {id: "trial-starter-ortho", category: "Trials & Initial Assessments", name: "Starter Ortho Trial Session", regular_price: 1900, promo_price: 1199, billing_type: "INDIVIDUAL_PRICING", service_type: "SINGLE"},
  {id: "trial-starter-neuro", category: "Trials & Initial Assessments", name: "Starter Neuro Trial Session", regular_price: 1350, promo_price: 999, billing_type: "INDIVIDUAL_PRICING", service_type: "SINGLE"},
  {id: "coip-initial", category: "Trials & Initial Assessments", name: "Comprehensive (COIP) Initial", regular_price: 2800, promo_price: 2499, billing_type: "INDIVIDUAL_PRICING", service_type: "SINGLE"},
  {id: "cnip-initial", category: "Trials & Initial Assessments", name: "Comprehensive (CNIP) Initial", regular_price: 2800, promo_price: 2249, billing_type: "INDIVIDUAL_PRICING", service_type: "SINGLE"},
  {id: "ortho-recovery-6", category: "Orthopedic Recovery", name: "Orthopedic Recovery 6 Sessions", regular_price: 10300, promo_price: 7999, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "ortho-recovery-8", category: "Orthopedic Recovery", name: "Orthopedic Recovery 8 Sessions", regular_price: 13300, promo_price: 10499, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "ortho-recovery-10", category: "Orthopedic Recovery", name: "Orthopedic Recovery 10 Sessions", regular_price: 16300, promo_price: 13499, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "ortho-recovery-12", category: "Orthopedic Recovery", name: "Orthopedic Recovery 12 Sessions", regular_price: 19300, promo_price: 15999, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "neuro-recovery-45-8", category: "Neurologic Recovery", name: "Neurologic Recovery 45-Min Standard 8 Sessions", regular_price: 9200, promo_price: 7999, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "neuro-recovery-45-12", category: "Neurologic Recovery", name: "Neurologic Recovery 45-Min Standard 12 Sessions", regular_price: 13000, promo_price: 11999, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "neuro-recovery-60-8", category: "Neurologic Recovery", name: "Neurologic Recovery 60-Min Intensive 8 Sessions", regular_price: 11200, promo_price: 9499, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "neuro-recovery-60-12", category: "Neurologic Recovery", name: "Neurologic Recovery 60-Min Intensive 12 Sessions", regular_price: 16000, promo_price: 13499, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "rehab-basic-8", category: "Rehab Basic / Pain Therapy", name: "Rehab Basic 8 Sessions", regular_price: 8000, promo_price: 6400, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "rehab-basic-12", category: "Rehab Basic / Pain Therapy", name: "Rehab Basic 12 Sessions", regular_price: 12000, promo_price: 9600, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "rehab-basic-16", category: "Rehab Basic / Pain Therapy", name: "Rehab Basic 16 Sessions", regular_price: 16000, promo_price: 12800, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
  {id: "rehab-basic-24", category: "Rehab Basic / Pain Therapy", name: "Rehab Basic 24 Sessions", regular_price: 24000, promo_price: 19200, billing_type: "PACKAGE_BILLING", service_type: "PACKAGE"},
]
