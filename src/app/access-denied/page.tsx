import { StatusPage } from "@/components/layout/StatusPage";

export const metadata = { title: "Access denied" };

export default function AccessDeniedPage() {
  return <StatusPage code="403" title="You don't have access to this community." />;
}
