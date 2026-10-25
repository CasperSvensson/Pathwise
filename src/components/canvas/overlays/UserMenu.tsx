import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import type { CurrentUser } from "@/lib/auth";

/** Avatar + kugghjul (inloggad) eller Login-knapp (utloggad). Återanvänds överallt. */
export function UserMenu({ user, loginNext = "/dashboard" }: { user: CurrentUser | null; loginNext?: string }) {
  if (!user) {
    return (
      <Button variant="ghost" href={`/login?next=${encodeURIComponent(loginNext)}`}>
        Login
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/dashboard" aria-label="Dashboard">
        <Avatar src={user.profile.avatar_url} name={user.profile.display_name ?? user.email} size={44} />
      </Link>
      <Link href="/settings/profile" aria-label="Settings" className="text-white transition hover:rotate-45">
        <Icon name="settings" size={30} />
      </Link>
    </div>
  );
}
