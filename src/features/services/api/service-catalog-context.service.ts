import { pamsAPI } from "@/utils/axios-interceptor";

export type ServiceCatalogScope = "GLOBAL" | "HMO" | "LGU";

export type ServiceCatalogItem = {
  id: number;
  name: string;
  price: number;
  base_price: number;
  effective_price: number;
  hmo_rate?: number;
  is_active: boolean;
};

export type ServiceCatalogBundleItemType =
  | "MACHINE"
  | "TECHNIQUE"
  | "EVALUATION"
  | "ADD_ON_MACHINE"
  | "ADD_ON_TECHNIQUE"
  | "ADD_ON_HOME_SERVICE";

export type ServiceCatalogBundleItem = {
  item_type: ServiceCatalogBundleItemType;
  item_id: number | null;
  quantity: number;
  item_price: number | null;
  display_order: number;
};

export type ServiceCatalogBundle = {
  id: number;
  name: string;
  bundled_price: number;
  is_active: boolean;
  items: ServiceCatalogBundleItem[];
};

export type ServiceCatalogPackageItem = {
  id: number;
  qty?: number;
  standardUnitPrice?: number;
  packageUnitPrice?: number;
  dropoutUnitPrice?: number;
  isComplimentary?: boolean;
};

export type ServiceCatalogInvoiceSubItem = {
  name: string;
  quantity: number;
  unitPrice?: number;
  dropoutUnitPrice?: number;
  children?: ServiceCatalogInvoiceSubItem[];
};

export type ServiceCatalogPackageOffer = {
  id: number;
  name: string;
  offer_scope: "GLOBAL" | "LGU";
  bundle_template_id: number | null;
  bundle_qty: number;
  bundle_items: ServiceCatalogPackageItem[];
  machine_ids: number[];
  machine_qty: number;
  machine_items: ServiceCatalogPackageItem[];
  technique_ids: number[];
  technique_qty: number;
  technique_items: ServiceCatalogPackageItem[];
  evaluation_ids: number[];
  evaluation_qty: number;
  evaluation_items: ServiceCatalogPackageItem[];
  add_on_ids?: number[];
  add_on_qty?: number;
  add_on_items?: ServiceCatalogPackageItem[];
  session_ids: number[];
  session_qty: number;
  session_items: ServiceCatalogPackageItem[];
  invoice_sub_items?: ServiceCatalogInvoiceSubItem[];
  package_price: number;
  is_active: boolean;
};

export type ServiceCatalogContext = {
  scope: ServiceCatalogScope;
  hmo_id: number | null;
  services: {
    machines: ServiceCatalogItem[];
    techniques: ServiceCatalogItem[];
    evaluations: ServiceCatalogItem[];
    add_on_machines: ServiceCatalogItem[];
    add_on_techniques: ServiceCatalogItem[];
    add_on_home_services: ServiceCatalogItem[];
  };
  bundles: ServiceCatalogBundle[];
  package_offers: ServiceCatalogPackageOffer[];
};

export type ServiceCatalogContextParams = {
  scope?: ServiceCatalogScope;
  hmo_id?: number | null;
};

export const serviceCatalogContextService = {
  async getContext(params: ServiceCatalogContextParams = {}): Promise<ServiceCatalogContext | undefined> {
    try {
      const { data } = await pamsAPI.get<ServiceCatalogContext>("/service-catalog/context", {
        params: {
          scope: params.scope ?? "GLOBAL",
          hmo_id: params.hmo_id ?? undefined,
        },
      });

      return data;
    } catch (error) {
      console.error("Failed to load service catalog context:", {
        params,
        error,
      });

      throw error;
    }
  },
};
