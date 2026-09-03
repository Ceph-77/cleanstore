# Passer KLEAN'STOR sur `kleanstor.org`

Objectif : `app.kleanstor.org` (frontend, Cloudflare Worker) et `api.kleanstor.org`
(backend, Render). Bénéfices : courriels Resend activés, cookie de session propre
(sous-domaines = *same-site*), URL crédible sous l'icône PWA.

Le **code est déjà prêt** (voir « Ce qui est déjà fait »). Il reste des étapes
dans les tableaux de bord, dans cet ordre.

---

## 1. Acheter le domaine

Le plus simple, vu que le compte Cloudflare existe déjà :

1. Cloudflare → **Domain Registration → Register Domains**
2. Chercher `kleanstor.org`, l'acheter (~12 $/an, au prix coûtant, sans majoration)
3. La zone DNS est créée automatiquement sur le compte — rien à déléguer.

*(Alternative : acheter ailleurs (Namecheap, etc.) puis Cloudflare → Add a Site →
`kleanstor.org` → copier les 2 nameservers Cloudflare chez le registrar. Attendre
la propagation.)*

---

## 2. `api.kleanstor.org` → Render

### 2a. Render
1. Render → service **cleanstore-backend** → **Settings → Custom Domains → Add**
2. Saisir `api.kleanstor.org`
3. Render affiche une cible **CNAME** (du genre `cleanstore-backend.onrender.com`).

*(Le `render.yaml` déclare déjà `domains: [api.kleanstor.org]` ; l'ajouter à la
main garantit juste que c'est pris en compte tout de suite.)*

### 2b. Cloudflare DNS
1. Cloudflare → zone `kleanstor.org` → **DNS → Records → Add record**
2. Type **CNAME**, Name `api`, Target = la cible donnée par Render
3. **Proxy status : DNS only (nuage gris)** — Render gère lui-même le TLS ; laisser
   le proxy Cloudflare orange casserait le certificat.
4. Revenir sur Render, attendre que le domaine passe **Verified** + certificat émis
   (quelques minutes).

Vérif : `https://api.kleanstor.org/api/health` doit répondre `{"ok":true}`.

---

## 3. `app.kleanstor.org` → Cloudflare Worker

1. Cloudflare → **Workers & Pages → cleanstore → Settings → Domains & Routes → Add → Custom Domain**
2. Saisir `app.kleanstor.org` → Add. Cloudflare crée l'enregistrement DNS et le
   certificat tout seul (la zone est sur le même compte).

*(Alternative CLI : décommenter le bloc `routes` dans `frontend/wrangler.toml`,
puis `wrangler deploy`.)*

Vérif : `https://app.kleanstor.org` charge l'app (elle parlera encore à l'ancienne
API tant que l'étape 5 n'est pas faite).

---

## 4. Variables d'environnement

### Render → cleanstore-backend → Environment
- `FRONTEND_URL` = `https://app.kleanstor.org,https://cleanstore1.cephbookman.workers.dev`
  (les deux pendant la transition — le code accepte une liste séparée par virgules ;
  le **premier** sert à construire les liens des courriels et le retour Stripe).
- Plus tard, une fois `app.kleanstor.org` validé partout : enlever l'ancienne URL.

### Frontend
`frontend/.env.production` (commité) contient `VITE_API_URL`. Il pointe pour
l'instant sur l'URL Render actuelle **pour ne rien casser**. À la bascule :

1. Vérifier qu'aucune variable `VITE_API_URL` n'est définie dans l'environnement
   de build Cloudflare (elle écraserait le fichier). La supprimer si présente.
2. Éditer `frontend/.env.production` :
   `VITE_API_URL=https://api.kleanstor.org/api`
3. Commit + push → rebuild frontend.

---

## 5. Redéployer

1. **Backend** : Render redéploie au push (ou « Manual Deploy »). Vérifier dans les
   logs que ça démarre sans erreur CORS.
2. **Frontend** : rebuild + redeploy (push GitHub si Workers Builds est branché,
   sinon `npm run build` puis `wrangler deploy` dans `frontend/`).
3. Ouvrir `https://app.kleanstor.org`, se connecter, cliquer partout. Le cookie de
   session doit tenir (sous-domaines *same-site*).

---

## 6. Courriels — Resend

1. Resend → **Domains → Add Domain** → `kleanstor.org`
2. Resend donne 3 enregistrements (SPF/`TXT`, DKIM/`CNAME` ou `TXT`, souvent un
   `MX` pour le retour). Les ajouter dans Cloudflare DNS **tels quels**,
   **Proxy = DNS only**.
3. Attendre le statut **Verified** dans Resend.
4. Render → env :
   - `RESEND_API_KEY` = la clé API Resend
   - `RESEND_FROM_EMAIL` = `KLEAN'STOR <no-reply@kleanstor.org>`
5. Redéployer le backend. Tester : « mot de passe oublié » doit envoyer un vrai
   courriel. Ça active aussi les courriels de décision de candidature, les
   « moments » d'engagement et le récap mensuel (tout est déjà codé).

---

## 7. Stripe

Rien de spécial : le retour d'onboarding Connect utilise `FRONTEND_URL` (donc
`https://app.kleanstor.org/wallet` une fois l'étape 4 faite). Juste revérifier
qu'un onboarding Stripe Express se termine bien et retombe sur `/wallet`.
Le `STRIPE_WEBHOOK_SECRET` reste un chantier séparé.

---

## 8. Nettoyage (quand tout est stable)

- Render `FRONTEND_URL` : enlever l'ancienne URL `workers.dev`, garder seulement
  `https://app.kleanstor.org`. Redéployer.
- Optionnel : sur l'ancien domaine `cleanstore1.cephbookman.workers.dev`, mettre
  une redirection 301 vers `app.kleanstor.org`.
- `frontend/index.html` / manifest PWA : rien à changer, tout est en chemins
  relatifs.

---

## Rollback

Tout est réversible sans redéploiement de code :
- remettre `FRONTEND_URL` (Render) à l'ancienne URL `workers.dev` seule → redeploy
- remettre `VITE_API_URL` à l'ancienne API + rebuild/redeploy frontend
- les domaines custom peuvent rester configurés sans effet

---

## Ce qui est déjà fait dans le code (commit domaine)

- `backend/src/config/env.ts` : `FRONTEND_URL` accepte une liste séparée par
  virgules → `env.FRONTEND_URL` (premier, pour les liens) + `env.FRONTEND_URLS`
  (tous, pour CORS).
- `backend/src/app.ts` : CORS accepte toutes les origines de la liste.
- `frontend/.env.production` : nouveau fichier, `VITE_API_URL` (sur l'URL Render
  actuelle ; à basculer sur `api.kleanstor.org` au moment voulu).
- `render.yaml` : `domains: [api.kleanstor.org]`.
- `frontend/wrangler.toml` : bloc `routes` custom domain prêt (commenté).
- `.env.example` (front + back) : mis à jour.
