import { requireUser } from "@/lib/auth";
import { PageTitle } from "@/components/layout/PageShell";
import { ProfileForm } from "@/app/settings/profile/ProfileForm";

export const metadata = { title: "Profile" };

export default async function ProfileSettingsPage() {
  const user = await requireUser("/settings/profile");

  return (
    <>
      <PageTitle title="Profile" subtitle={user.email} />
      <ProfileForm displayName={user.profile.display_name ?? ""} locale={user.profile.locale} />
    </>
  );
}
