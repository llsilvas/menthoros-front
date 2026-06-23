export interface KeycloakRealmAccess {
  roles?: string[];
}

export interface KeycloakOrganizationClaims {
  tenant_id?: string[];
  name?: string;
  displayName?: string;
}

export interface KeycloakJwtPayload {
  exp?: number;
  sub?: string;
  user_id?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  tenantId?: string;
  tenant_id?: string;
  organizationId?: string;
  roles?: string[];
  realm_access?: KeycloakRealmAccess;
  organization?: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const decodeBase64Url = (segment: string): string => {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(normalized + padding);
};

const getFirstOrganizationClaims = (organization: unknown): KeycloakOrganizationClaims | null => {
  if (!isRecord(organization)) {
    return null;
  }

  const firstOrganization = Object.values(organization).find(isRecord);
  if (!firstOrganization) {
    return null;
  }

  const tenantIds = Array.isArray(firstOrganization.tenant_id)
    ? firstOrganization.tenant_id.filter((value): value is string => typeof value === 'string')
    : undefined;

  return {
    tenant_id: tenantIds,
    name: typeof firstOrganization.name === 'string' ? firstOrganization.name : undefined,
    displayName:
      typeof firstOrganization.displayName === 'string' ? firstOrganization.displayName : undefined,
  };
};

export const decodeJwtPayload = (token: string): KeycloakJwtPayload | null => {
  try {
    const [, payloadSegment = ''] = token.split('.');
    if (!payloadSegment) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(payloadSegment));
    return isRecord(payload) ? (payload as KeycloakJwtPayload) : null;
  } catch {
    return null;
  }
};

export const extractTenantId = (payload: KeycloakJwtPayload): string | undefined => {
  if (typeof payload.tenantId === 'string') return payload.tenantId;
  if (typeof payload.tenant_id === 'string') return payload.tenant_id;
  if (typeof payload.organizationId === 'string') return payload.organizationId;

  const organizationClaims = getFirstOrganizationClaims(payload.organization);
  return organizationClaims?.tenant_id?.[0];
};

export const extractOrganizationName = (payload: KeycloakJwtPayload): string | undefined => {
  const organizationClaims = getFirstOrganizationClaims(payload.organization);
  return organizationClaims?.name ?? organizationClaims?.displayName;
};

export const extractUserRoles = (payload: KeycloakJwtPayload): string[] => {
  if (Array.isArray(payload.roles)) {
    return payload.roles.filter((role): role is string => typeof role === 'string');
  }

  const realmRoles = payload.realm_access?.roles;
  if (!Array.isArray(realmRoles)) {
    return [];
  }

  return realmRoles.filter((role): role is string => typeof role === 'string');
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  return !payload?.exp || payload.exp * 1000 < Date.now();
};

export const hasRequiredTenantClaims = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  return Boolean(payload && extractTenantId(payload));
};

export const isTokenValid = (token: string): boolean =>
  Boolean(token) && !isTokenExpired(token) && hasRequiredTenantClaims(token);
