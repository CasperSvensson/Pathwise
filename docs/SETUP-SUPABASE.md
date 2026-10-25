# Steg 1 – Sätt upp databasen (Supabase)

**Supabase** är en färdig databas + inloggningssystem + fillagring. Du slipper
driva en egen server. Gratisnivån räcker gott under utvecklingen.

Varför Supabase och inte Firebase? Plattformen har mycket "vem får se vad"
(ägare, moderatorer, blockerade, publicerat/utkast). Supabase bygger på
PostgreSQL där sådana regler skrivs direkt i databasen (Row Level Security),
så säkerheten gäller även om någon försöker gå runt vår kod.

Räkna med ca **20 minuter**.

---

## 1. Skapa projektet

1. Gå till <https://supabase.com> → **Start your project** → logga in med GitHub.
2. **New project**
   - *Name*: `pathwise`
   - *Database password*: klicka **Generate** och spara lösenordet i en lösenordshanterare.
   - *Region*: **North EU (Stockholm)** – nära dina användare och bra för GDPR.
3. Vänta ett par minuter medan projektet startar.

## 2. Kopiera nycklarna till `.env.local`

1. I projektroten: kopiera `.env.example` till en ny fil som heter `.env.local`.
2. I Supabase: **Project Settings → API** (kugghjulet nere till vänster).
3. Fyll i:

| I `.env.local`                    | Hämta från Supabase                          |
| --------------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | *Project URL*                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | *Project API keys → anon / public*           |
| `SUPABASE_SERVICE_ROLE_KEY`       | *Project API keys → service_role* (hemlig!)  |

> ⚠️ **service_role-nyckeln kringgår alla säkerhetsregler.** Den får bara finnas
> i `.env.local` och hos din hosting (t.ex. Vercel). Lägg den aldrig i kod som
> skickas till webbläsaren, och checka aldrig in `.env.local` i git.

## 3. Skapa tabellerna

1. I Supabase: **SQL Editor** → **New query**.
2. Öppna `supabase/migrations/0001_tables.sql` i din kodeditor, kopiera **allt**,
   klistra in i Supabase och tryck **Run**. Du ska se *Success. No rows returned*.
3. Gör likadant med, **i den här ordningen**:
   - `0002_functions.sql`
   - `0003_policies.sql`
   - `0004_storage.sql`
4. Kontroll: **Table Editor** ska nu visa tabellerna `profiles`, `companies`,
   `canvases`, `canvas_drafts`, `canvas_versions`, `widget_responses`, `follows`,
   `blocked_users`, `subscriptions` m.fl. **Storage** ska ha en bucket som heter `media`.

> Blev något fel halvvägs? Enklast är att skapa ett nytt Supabase-projekt och
> köra filerna igen – det tar två minuter.

## 4. Ställ in inloggningen

**Authentication → URL Configuration**

- *Site URL*: `http://localhost:3000` (byt till din riktiga domän när du lanserar)
- *Redirect URLs* → **Add URL**:
  - `http://localhost:3000/auth/callback`
  - senare även `https://dindomän.se/auth/callback`

**Authentication → Sign In / Providers → Email**

- *Confirm email*: **på** (användare måste verifiera sin e-post – enligt specen)

**E-postmallar (valfritt men rekommenderat)**
Supabase skickar själv verifierings- och återställningsmejl. Gratis-mejlen är
begränsade till ett fåtal per timme, så inför lansering:
**Project Settings → Authentication → SMTP Settings** och koppla t.ex. Resend
eller Postmark.

### Google-inloggning (valfritt)

1. <https://console.cloud.google.com> → skapa ett projekt →
   **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   typ *Web application*.
2. *Authorized redirect URIs*: klistra in den callback-URL som Supabase visar under
   **Authentication → Providers → Google** (ser ut som
   `https://xxxx.supabase.co/auth/v1/callback`).
3. Kopiera *Client ID* och *Client secret* tillbaka in i Supabase och slå på Google.

Apple-inloggning fungerar på samma sätt men kräver ett betalt Apple Developer-konto.

## 5. Testa

```bash
npm install
npm run dev
```

Öppna <http://localhost:3000> → **Create new** → skapa ett konto → klicka på
länken i mejlet → skapa en företagsprofil → du hamnar i editorn.

I **Table Editor → profiles** ska du nu se dig själv. 🎉

---

## Hur databasen hänger ihop

```
auth.users (Supabase)
   └─ profiles            1 per användare (skapas automatiskt)
        ├─ subscriptions  plan från Stripe (skrivs bara av webhooken)
        ├─ follows ──────────────┐
        └─ companies  (1 per konto)
              ├─ company_members   moderatorer / redigerare
              ├─ blocked_users
              └─ canvases          en delbar sida: /c/{företag}/{canvas}
                    ├─ canvas_drafts     utkastet (bara redigerare ser det)
                    ├─ canvas_versions   varje publicering = en version
                    └─ widget_responses  röster, betyg, feedback
```

**Var finns säkerheten?** I `0003_policies.sql`. Varje regel har ett namn på
svenska som beskriver vad den gör, t.ex. *"Inloggade svarar på publicerade canvas"*.
Publicering och abonnemang kan bara ändras av servern efter att den kontrollerat
planen – vanliga användare saknar helt rätt att ändra de kolumnerna.

## Bra att veta

- **Säkerhetskopior:** gratisnivån har inga automatiska backuper man kan återställa
  själv. Uppgradera till Pro innan riktiga kunder finns i systemet.
- **Pausning:** gratisprojekt pausas efter en veckas inaktivitet. Logga in och
  klicka *Restore* om det händer.
- **Typer:** när databasen ändras kan du generera TypeScript-typer automatiskt:
  `npx supabase gen types typescript --project-id <ditt-id> > src/lib/database.types.ts`
