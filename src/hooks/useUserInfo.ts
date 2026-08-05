import { useMemo } from 'react';
import { extractOrganizationName, extractTenantId, extractUserRoles } from '../context/auth/jwt';
import { getClaims } from '../context/auth/session';

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
    const payload = getClaims();
    if (!payload) {
      return {};
    }

    return {
      id: payload.sub || payload.user_id,
      name: payload.name || payload.preferred_username,
      email: payload.email,
      tenantId: extractTenantId(payload),
      organizationName: extractOrganizationName(payload),
      roles: extractUserRoles(payload),
    };
  }, []);
};
