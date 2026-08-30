import { create } from "zustand";
import { TenantStatus, tenantService } from "../services/api/tenant.service";

interface TenantState {
  tenantStatus: TenantStatus | null;
  loading: boolean;
  error: string | null;
  fetchTenantStatus: () => Promise<TenantStatus | null>;
  setTenantStatus: (status: TenantStatus | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenantStatus: null,
  loading: false,
  error: null,
  fetchTenantStatus: async () => {
    set({ loading: true, error: null });
    try {
      const status = await tenantService.getCurrentTenant();
      set({ tenantStatus: status, loading: false });
      return status;
    } catch (err: unknown) {
      const e = err as { message?: string };
      set({
        error: e.message || "Erro ao obter dados da organização",
        loading: false,
      });
      return null;
    }
  },
  setTenantStatus: (status) => set({ tenantStatus: status }),
}));
