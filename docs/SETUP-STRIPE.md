# Steg 2 – Sätt upp betalningar (Stripe)

**Stripe** sköter allt med kort och pengar: betalsidan, kvitton, moms, misslyckade
betalningar och uppsägningar. Vi lagrar **aldrig** kortuppgifter själva.

Räkna med ca **30 minuter**. Gör först allt i **testläge** (inga riktiga pengar).

---

## Så fungerar flödet

```
 Användaren                Vår sajt                         Stripe
 ──────────               ─────────                        ───────
 Klickar "Start trial" ─▶ /api/stripe/checkout ──────────▶ Betalsida
                                                             │
 Betalar / startar trial ◀───────────────────────────────────┘
                                                             │
                          /api/stripe/webhook  ◀─────────────┘  "prenumeration skapad"
                          └─ sparar plan i tabellen subscriptions
                          └─ avpublicerar canvas som inte ryms i planen
```

Det viktiga: **planen sätts bara av webhooken**, som Stripe anropar med en
signatur vi kontrollerar. Användaren kan alltså inte fuska sig till Premium.

---

## 1. Skapa konto

1. <https://dashboard.stripe.com/register>
2. Se till att **Test mode** är påslaget (reglage uppe till höger).
   Du kan bygga och testa allt innan företaget är verifierat.

## 2. Skapa produkterna (Premium och Enterprise)

1. **Product catalog → + Add product**
   - *Name*: `Premium`
   - *Pricing*: **Recurring**, `1000`, **SEK**, *Billing period*: **Monthly**
   - Spara.
2. Klicka på priset du just skapade och kopiera **Price ID** (börjar med `price_`).
   Klistra in i `.env.local` som `STRIPE_PRICE_PREMIUM=price_...`
3. Gör samma sak för `Enterprise` (5000 SEK/månad) → `STRIPE_PRICE_ENTERPRISE=price_...`

> **Vill du ändra priset senare?** I Stripe skapar man då ett *nytt* pris på
> samma produkt och byter ID:t i `.env.local`. Texten som visas på sajten
> ("1 000 kr / month") och vad varje plan får göra ändrar du i `src/lib/plans.ts`.

## 3. API-nyckeln

**Developers → API keys** → kopiera *Secret key* (`sk_test_...`) →
`STRIPE_SECRET_KEY` i `.env.local`.

## 4. Webhooken – lokalt på din dator

Stripe kan inte nå `localhost` direkt, så under utveckling använder vi Stripe CLI
som "vidarebefordrar" händelserna.

1. Installera Stripe CLI: <https://docs.stripe.com/stripe-cli>
   (Mac: `brew install stripe/stripe-cli/stripe`)
2. Logga in: `stripe login`
3. Starta vidarebefordringen (låt terminalen vara öppen medan du utvecklar):

   ```bash
   npm run stripe:listen
   ```

4. Den skriver ut en rad som börjar med `whsec_...` → klistra in som
   `STRIPE_WEBHOOK_SECRET` i `.env.local` och starta om `npm run dev`.

## 5. Kundportalen (byta kort, kvitton, säga upp)

**Settings → Billing → Customer portal** → **Activate test link**, och slå på:

- ✅ Customers can update payment methods
- ✅ Customers can view invoice history
- ✅ Customers can cancel subscriptions → välj **At end of billing period**
  (specen: Premium gäller tills den betalda perioden tar slut)
- ✅ Customers can switch plans → lägg till Premium och Enterprise

## 6. Misslyckade betalningar (3 dagars respit)

**Settings → Billing → Subscriptions and emails → Manage failed payments**

- Slå på **Smart Retries** och sätt försöken till inom **3 dagar**.
- *If all retries for a payment fail*: **Cancel the subscription**.
- Slå på mejl till kunden när en betalning misslyckas.

Under respiten har prenumerationen status `past_due` – vår kod räknar den fortfarande
som aktiv. När Stripe till slut säger upp den skickas en webhook, planen blir `free`
och canvasarna avpubliceras (innehållet finns kvar privat).

## 7. Testa ett köp

1. Logga in på sajten → **Settings → Subscription & billing** → **Start 30-day free trial**.
2. På Stripes betalsida: testkort **4242 4242 4242 4242**, valfritt framtida datum,
   valfri CVC.
3. Tillbaka på sajten ska planen visa *Premium* (ladda om om webhooken inte hunnit).
4. Kontroll i Supabase: **Table Editor → subscriptions** → din rad har
   `plan = premium` och `status = trialing`.

Fler testkort (nekade kort, 3D Secure osv.): <https://docs.stripe.com/testing>

---

## När du lanserar (live)

1. Aktivera kontot i Stripe (företagsuppgifter, bankkonto).
2. Slå av *Test mode* och gör om steg 2, 3, 5 och 6 i live-läget
   (produkter och nycklar är separata för test och live).
3. **Developers → Webhooks → + Add endpoint**
   - *URL*: `https://dindomän.se/api/stripe/webhook`
   - *Events*: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`,
     `customer.subscription.paused`, `customer.subscription.resumed`
   - Kopiera *Signing secret* → `STRIPE_WEBHOOK_SECRET` hos din hosting.
4. Lägg in alla live-nycklar som miljövariabler hos din hosting (t.ex. Vercel →
   Project → Settings → Environment Variables).
5. **Moms:** slå på *Stripe Tax* om du säljer till andra länder. Prata med en
   revisor om hur moms på digitala tjänster ska hanteras för dina kunder.

## Felsökning

| Problem                                         | Troligen                                                        |
| ----------------------------------------------- | --------------------------------------------------------------- |
| Planen ändras inte efter köp                    | `npm run stripe:listen` körs inte, eller fel `STRIPE_WEBHOOK_SECRET` |
| "Invalid signature" i terminalen                | Webhook-hemligheten matchar inte – kopiera den igen och starta om |
| "Unknown plan" vid klick på knappen             | `STRIPE_PRICE_...` saknas i `.env.local`                         |
| `[stripe] Unknown customer` i loggen            | Kunden skapades i Stripe utan att gå via sajten – ignorera i test |
