import { auth } from "~/auth/dashboard-config";
import { SYSTEM_ROLES } from "~/lib/validation/role";

export { hasPermission, isAdmin } from "./permissions";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.dashboardUser) {
    throw new Error("Unauthorized: Not logged in");
  }

  const hasAdminRole = session.dashboardUser.roles.some(
    (role) => role.name === SYSTEM_ROLES.ADMIN,
  );

  if (!hasAdminRole) {
    throw new Error("Unauthorized: ADMIN role required");
  }

  return session.dashboardUser;
}

export async function requireRole(roleName: string) {
  const session = await auth();

  if (!session?.dashboardUser) {
    throw new Error("Unauthorized: Not logged in");
  }
  const hasRole = session.dashboardUser.roles.some(
    (role) => role.name === roleName,
  );

  if (!hasRole) {
    throw new Error(`Unauthorized: ${roleName} role required`);
  }

  return session.dashboardUser;
}
