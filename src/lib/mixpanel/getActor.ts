import { auth } from "~/auth/dashboard-config";
import type { Actor } from "./tracker";

export async function getCurrentActor(): Promise<Actor> {
  const session = await auth();

  if (!session?.dashboardUser) {
    throw new Error("Unauthorized");
  }

  const startUser = session.dashboardUser;

  return {
    id: startUser.id,
    name: startUser.username,
    role: startUser.roles.map((role) => role.name),
    permissions: startUser.roles.flatMap((role) =>
      role.permissions.map((permission) => permission.key),
    ),
  };
}
