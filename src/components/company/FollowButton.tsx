"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setFollowing } from "@/actions/follow";
import { Button } from "@/components/ui/Button";

/** Följ / Följer-knapp. Uppdateras direkt (optimistiskt) och sparas i bakgrunden. */
export function FollowButton({
  companyId,
  isFollowing,
  isLoggedIn,
}: {
  companyId: string;
  isFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [following, setOptimistic] = useOptimistic(isFollowing);

  function toggle() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    startTransition(async () => {
      setOptimistic(!following);
      await setFollowing(companyId, !following, pathname);
    });
  }

  return (
    <Button variant={following ? "subtle" : "primary"} onClick={toggle} disabled={pending}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
