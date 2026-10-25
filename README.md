# Pathwise

En plattform där företag och kreatörer visar sina mål på en interaktiv canvas –
och låter communityt rösta, tycka till och följa resan.

**Teknik:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase
(databas, inloggning, filer) · Stripe (betalningar) · React Flow (canvasen)

---

## Kom igång

```bash
npm install
cp .env.example .env.local     # fyll i värdena – se guiderna nedan
npm run dev                    # http://localhost:3000
```

1. 📘 **[docs/SETUP-SUPABASE.md](docs/SETUP-SUPABASE.md)** – databas och inloggning
2. 💳 **[docs/SETUP-STRIPE.md](docs/SETUP-STRIPE.md)** – betalningar

Designskisserna ligger i `docs/design-*.png`.

---

## Mappstruktur

```
supabase/migrations/      Databasen: tabeller, funktioner, säkerhetsregler, fillagring
src/
├─ proxy.ts               Körs före varje sida: förnyar inloggning, skyddar sidor
├─ app/                   SIDOR (en mapp = en URL)
│  ├─ page.tsx                    /                  startsidan
│  ├─ explore/                    /explore           sök bland communities
│  ├─ c/[company]/                /c/califactory     företagsprofil
│  │  └─ [canvas]/                /c/califactory/road-to-1000   ← delbar canvas
│  ├─ editor/[canvasId]/          editorn (bara ägare/redigerare)
│  ├─ create/                     "Create new"
│  ├─ dashboard/                  översikt efter inloggning
│  ├─ settings/                   profil, företagssida, abonnemang
│  ├─ login, signup, …            inloggningssidor
│  └─ api/stripe/                 checkout, kundportal, webhook
├─ actions/               SERVER ACTIONS – allt som ändrar data (en fil per område)
├─ components/
│  ├─ ui/                 Byggklossar: Button, Panel, Field, Modal, Icon …
│  ├─ layout/             Sidram, meny, sidfot
│  ├─ canvas/             Delat mellan besökarvy och editor (arbetsyta, noder, toppbar)
│  ├─ editor/             Bara editorn (högerpanel, publicering, autosave)
│  ├─ viewer/             Bara besökarvyn
│  └─ widgets/            Widgetbiblioteket (se nedan)
└─ lib/                   Logik utan UI
   ├─ auth.ts             Vem är inloggad? Vilken plan? Får hen redigera?
   ├─ plans.ts            ⭐ Priser och gränser för Free / Premium / Enterprise
   ├─ billing.ts          Stripe ↔ databas
   ├─ canvas/             Canvasens datamodell, läsfrågor, publicering
   └─ supabase/           De tre databasklienterna (server, webbläsare, admin)
```

### Var ändrar jag …?

| Vill ändra                         | Fil                                         |
| ---------------------------------- | ------------------------------------------- |
| Färger, typsnitt                   | `src/app/globals.css` (överst, `@theme`)    |
| Pris, gränser, vad en plan får     | `src/lib/plans.ts`                          |
| Sajtens namn                       | `src/lib/site.ts`                           |
| Kategorier på Explore              | `src/lib/categories.ts`                     |
| Illustrationer i noder             | `src/lib/canvas/illustrations.tsx`          |
| Lägga till en widget               | `src/components/widgets/catalog.ts`         |
| Vem får se/göra vad i databasen    | `supabase/migrations/0003_policies.sql`     |

---

## Viktiga principer i koden

**1. Behörighet kontrolleras alltid på servern – två gånger.**
Varje server action börjar med en kontroll (`getEditableCanvas`, `getCurrentUser` …)
*och* databasen har egna regler (RLS). Att en knapp är dold i gränssnittet är
bara bekvämlighet, aldrig säkerhet.

**2. Plan och betalning bestäms bara av Stripe-webhooken.**
`subscriptions`-tabellen kan inte skrivas av användare. Publicering görs av
servern efter plankontroll – användare saknar rätt att ändra publiceringskolumnerna.

**3. En canvas är ett JSON-dokument.**
Noder, pilar och widgets sparas tillsammans. Utkastet ligger i `canvas_drafts`
(autosparas), varje publicering blir en rad i `canvas_versions` (historik).
Besökare ser bara den publicerade versionen – aldrig utkastet.

**4. Återanvänd hellre än duplicera.**
Samma `CanvasBoard` används av besökarvy och editor. Samma `ChoiceView` ritar
omröstning, ja/nej, betyg, likert, prioritering och reaktioner.
Samma `ImageUpload` används för nodbilder, logotyp och omslag.

### Widgetbiblioteket

```
components/widgets/
├─ catalog.ts        ⭐ Alla widgettyper – namn, beskrivning, standardinställningar
├─ validation.ts     Kontrollerar svar på servern
├─ WidgetView.tsx    Ritar valfri widget för besökare
├─ WidgetEditor.tsx  Ritar inställningarna i editorn
├─ WidgetResults.tsx Ritar resultatet i Results-fliken
├─ choice/           "Välj ett alternativ" (6 widgettyper delar dessa filer)
├─ text/             Fritext-feedback
└─ display/          Progress (måluppföljning)
```

**Ny widget av en befintlig sort** (t.ex. en ny omröstningsvariant): lägg till en
rad i `catalog.ts`. Klart.
**Helt ny sort:** skapa en mapp med `View`/`Editor`/`Results` och lägg till ett
`case` i de tre `Widget*.tsx`-filerna.

---

## Beslut där specifikationerna skilde sig åt

Projektbeskrivningen och sitemap-filen (`website_sitemap_specification_english.xlsx`)
säger delvis olika saker. Så här är det byggt – allt går att ändra i `src/lib/plans.ts`:

| Fråga                       | Valt                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| Planer                      | Free / Premium (5 publicerade canvas) / Enterprise (obegränsat)      |
| Företag per konto           | Ett (enligt sitemap). Ett företag kan ha flera canvas (enligt beskrivningen). |
| URL                         | `/c/{företag}` = profil, `/c/{företag}/{canvas}` = delbar canvas     |
| Free                        | Kan följa, svara, och ha 1 privat utkast. Kan inte publicera.        |
| Provperiod                  | 30 dagar, utan kort, en gång per konto (`TRIAL_DAYS`)                |
| Likert & Prioritering       | Bara Enterprise ("hela widgetbiblioteket")                           |
| Widgets per nod             | En, vald i en rullgardin (`MAX_WIDGETS_PER_NODE` i `lib/canvas/content.ts`) |
| Sidor (☰-menyn)             | Ögat sparas direkt men gäller för besökare först efter **Publish**. Nya sidor (+) är tomma och dolda tills man slår på ögat. Ägare och redigerare kan ta bort sidor (med bekräftelse). |
| Bakåtpilen                  | Betalande användare → `/dashboard`, gratis/utloggade → `/explore` (`backHrefForPlan` i `lib/plans.ts`) |

---

## Inte byggt än (nästa steg)

Grunden är modulär så dessa kan läggas till utan att ändra arkitekturen:

- [ ] Svenska/engelska gränssnitt (språkvalet sparas redan på profilen)
- [ ] Testa editorn utan konto (utkast i webbläsaren som flyttas till kontot vid registrering)
- [ ] Gränssnitt för att bjuda in moderatorer och blockera användare (tabellerna och reglerna finns)
- [ ] Notiser och daglig sammanfattning via e-post
- [ ] Kommentarer per nod och förslag som modereras
- [ ] Sessioner och kontoradering i Settings → Security
- [ ] Cookie-banner och granskade juridiska texter
- [ ] Statistik över tid (diagram) i dashboarden
- [ ] Apple-inloggning
# Pathwise
