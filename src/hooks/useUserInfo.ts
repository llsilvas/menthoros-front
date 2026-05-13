import { useMemo } from 'react';

interface UserInfo {
  id?: string;
  name?: string;
  email?: string;
  tenantId?: string;
  roles?: string[];
  organizationName?: string;
}

export const useUserInfo = (): UserInfo => {
  return useMemo(() => {
    const token = localStorage.getItem('@Menthoros:token') ?? '';
    if (!token) return {};

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      let tenantId: string | undefined;
      let organizationName: string | undefined;

      // Try different claim paths for tenant ID
      if (payload.tenantId) tenantId = payload.tenantId;
      else if (payload.tenant_id) tenantId = payload.tenant_id;
      else if (payload.organizationId) tenantId = payload.organizationId;
      else if (payload.organization && typeof payload.organization === 'object') {
        const org = Object.values(payload.organization)[0] as any;
        if (org && Array.isArray(org.tenant_id) && org.tenant_id.length > 0) {
          tenantId = org.tenant_id[0];
        }
      }

      // Extract organization/assessoria name
      if (payload.organization && typeof payload.organization === 'object') {
        const org = Object.values(payload.organization)[0] as any;
        if (org && typeof org === 'object') {
          organizationName = org.name || org.displayName;
        }
      }

      return {
        id: payload.sub || payload.user_id,
        name: payload.name || payload.preferred_username,
        email: payload.email,
        tenantId,
        organizationName,
        roles: payload.roles ?? payload.realm_access?.roles ?? [],
      };
    } catch {
      return {};
    }
  }, []);
};
