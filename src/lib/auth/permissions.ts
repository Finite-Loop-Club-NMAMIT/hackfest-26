import { SYSTEM_ROLES } from "~/lib/validation/role";

export function isAdmin(dashboardUser: {
  roles: Array<{ name: string }>;
}): boolean {
  return dashboardUser.roles.some((role) => role.name === SYSTEM_ROLES.ADMIN);
}

export function hasPermission(
  dashboardUser: {
    roles: Array<{
      name: string;
      permissions: Array<{ key: string }>;
    }>;
  },
  permissionKey: string | RegExp,
): boolean {
  if (isAdmin(dashboardUser)) {
    return true;
  }

  const matchesPermission = (key: string): boolean => {
    if (permissionKey instanceof RegExp) {
      return permissionKey.test(key);
    }
    return key === permissionKey;
  };

  for (const role of dashboardUser.roles) {
    if (role.permissions.some((perm) => matchesPermission(perm.key))) {
      return true;
    }
  }
  return false;
}
