import { signOut } from "~/auth/config";
import { Button } from "~/components/ui/button";

interface SignOutProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

export default function SignOut({
  className,
  variant,
  size,
  children,
}: SignOutProps) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button type="submit" className={className} variant={variant} size={size}>
        {children || "Sign Out"}
      </Button>
    </form>
  );
}
