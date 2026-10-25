"use client";

import { useActionState, useState } from "react";
import { saveCompany } from "@/actions/company";
import { CATEGORIES } from "@/lib/categories";
import { siteUrl, slugify } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { SectionLabel } from "@/components/ui/Panel";
import { IDLE, type ActionResult, type Company } from "@/lib/types";

/** Formuläret för företagsprofilen. Samma formulär för att skapa och redigera. */
export function CompanyForm({ company }: { company: Company | null }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(saveCompany, IDLE);
  const [slug, setSlug] = useState(company?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!company);
  const [logoUrl, setLogoUrl] = useState(company?.logo_url ?? null);
  const [coverUrl, setCoverUrl] = useState(company?.cover_url ?? null);

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <TextInput
        label="Name"
        name="name"
        defaultValue={company?.name}
        required
        maxLength={80}
        // Föreslå URL-namn från företagsnamnet tills man ändrar det själv
        onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
      />

      <TextInput
        label="URL name"
        name="slug"
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(slugify(e.target.value));
        }}
        hint={`${siteUrl("/c/")}${slug || "…"}${company ? " · old links keep working if you change it" : ""}`}
        required
      />

      <TextInput label="Tagline" name="tagline" defaultValue={company?.tagline ?? ""} maxLength={120} placeholder="One sentence about you" />

      <Select label="Category" name="category" defaultValue={company?.category ?? ""}>
        <option value="">Choose…</option>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>

      <TextArea label="About" name="description" defaultValue={company?.description ?? ""} maxLength={1000} />
      <TextArea label="Vision" name="vision" defaultValue={company?.vision ?? ""} maxLength={1000} placeholder="Where are you heading, together with your community?" />

      {/* Bilder kan laddas upp först när företaget finns (filerna sparas i dess mapp) */}
      {company ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <SectionLabel>Logo</SectionLabel>
            <ImageUpload companyId={company.id} value={logoUrl} onChange={setLogoUrl} label="Upload logo" />
          </div>
          <div>
            <SectionLabel>Cover image</SectionLabel>
            <ImageUpload companyId={company.id} value={coverUrl} onChange={setCoverUrl} label="Upload cover" />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">You can add a logo and cover image after saving.</p>
      )}
      <input type="hidden" name="logo_url" value={logoUrl ?? ""} />
      <input type="hidden" name="cover_url" value={coverUrl ?? ""} />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_listed" defaultChecked={company?.is_listed ?? true} />
        Show my company in Explore
      </label>

      <FormMessage state={state} successText="Saved." />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : company ? "Save" : "Create and continue"}
      </Button>
    </form>
  );
}
