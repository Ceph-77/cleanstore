# Publier KLEAN'STOR sur le Google Play Store (TWA)

La PWA est déjà installable depuis le navigateur. Pour qu'elle apparaisse **dans
le Play Store**, on l'empaquette en **TWA** (Trusted Web Activity) : une coquille
Android minuscule qui affiche `https://app.kleanstor.org` en plein écran, sans
barre de navigateur. Aucune réécriture de code.

Durée réaliste : ~1 h de manipulation + **3 à 7 jours de révision Google**.
Coût : **25 $ US une fois** (compte développeur).

---

## Déjà préparé dans le repo

- **Manifest PWA** complet (`frontend/vite.config.ts`) : `id`, `name`,
  `short_name`, `start_url`, `scope`, `display: standalone`, `theme_color`,
  `background_color`, icônes 192/512 + maskable, `categories`.
- **`frontend/public/.well-known/assetlinks.json`** — servi à
  `https://app.kleanstor.org/.well-known/assetlinks.json`. Contient des
  **placeholders** à remplacer (étape 4).
- **Politique de confidentialité** : `https://app.kleanstor.org/confidentialite`
  (obligatoire pour le Play Store). À faire relire par un juriste.

---

## 1. Compte Google Play Developer

1. https://play.google.com/console/signup — connecte-toi avec un compte Google.
2. Choisis un compte **personnel** (ou organisation si tu as un DUNS).
3. Paie les **25 $ US** (une seule fois, à vie).
4. Vérification d'identité Google : pièce d'identité + parfois adresse. Peut
   prendre 1–2 jours.

---

## 2. Générer le paquet Android avec PWABuilder

Le plus simple, pas besoin d'Android Studio.

1. Va sur **https://www.pwabuilder.com**
2. Colle `https://app.kleanstor.org` → **Start**
3. Il analyse le manifest (score attendu : bon, tout est en place).
4. Onglet **Android** → **Generate Package**.
5. Options recommandées :
   - **Package ID** : `org.kleanstor.twa` *(doit correspondre à
     `assetlinks.json` — si tu changes ici, change là aussi)*
   - **App name** : `KLEAN'STOR`
   - **Launcher name** : `KLEAN'STOR`
   - **Display mode** : `standalone`
   - **Signing key** : *Create a new signing key* (PWABuilder la génère et te la
     redonne dans le zip — **garde ce fichier `.keystore` et son mot de passe en
     lieu sûr**, tu en auras besoin pour toutes les mises à jour futures).
     - *Alternative plus simple* : laisser **Play App Signing** gérer la clé
       (recommandé par Google). Dans ce cas la SHA‑256 de l'étape 4 vient de la
       **Play Console** au lieu du zip.
6. Télécharge le zip. Il contient :
   - `app-release-signed.aab` (ou `.aab`) — le fichier à téléverser
   - `assetlinks.json` — l'empreinte à recopier
   - la clé de signature + `signing-key-info.txt` (mot de passe, alias)

---

## 3. Créer l'app dans la Play Console

1. Play Console → **Create app**
   - Nom : `KLEAN'STOR`
   - Langue par défaut : Français (Canada)
   - App ou jeu : **App**
   - Gratuite ou payante : **Gratuite**
2. **Test interne d'abord** (recommandé) : menu **Testing → Internal testing →
   Create new release** → téléverse le `.aab` → ajoute ton adresse Gmail comme
   testeur → tu obtiens un lien pour installer et vérifier avant la prod.
3. Quand c'est bon : **Production → Create new release** → même `.aab`.

---

## 4. Lier l'app au domaine (Digital Asset Links)

C'est ce qui enlève la barre du navigateur.

1. Récupère la **SHA‑256 fingerprint** :
   - depuis le zip PWABuilder (`assetlinks.json` fourni), **ou**
   - Play Console → ton app → **Setup → App integrity → App signing** → copie le
     *SHA-256 certificate fingerprint*.
2. Édite **`frontend/public/.well-known/assetlinks.json`** :
   - remplace `org.kleanstor.twa` si tu as choisi un autre Package ID
   - remplace `REPLACE_WITH_SHA256_FINGERPRINT...` par l'empreinte (format
     `AB:CD:EF:...`)
3. Commit + push → le CI Cloudflare redéploie.
4. Vérifie : `https://app.kleanstor.org/.well-known/assetlinks.json` doit
   renvoyer ton JSON, en `Content-Type: application/json`.
5. Test : https://developers.google.com/digital-asset-links/tools/generator
   (ou attends l'ouverture de l'app — si la barre d'URL apparaît en haut, le lien
   n'est pas validé).

---

## 5. Fiche Play Store

Champs obligatoires et texte prêt à coller :

- **Nom de l'app** : `KLEAN'STOR`
- **Description courte** (80 car.) :
  `Gérez le nettoyage de vos magasins : tâches, équipes, inspections, paiements.`
- **Description complète** :

  > KLEAN'STOR met en relation magasins, sociétés de gestion d'installations,
  > sous-traitants en nettoyage et travailleurs autonomes.
  >
  > • Fiches magasins, tâches avec prix, planification récurrente
  > • Marketplace de tâches : les travailleurs manifestent leur intérêt,
  >   l'admin confirme l'attribution
  > • Démarrage de tâche vérifié par la position (présence sur place)
  > • Inspections qualité avec photos avant/après
  > • Suivi des gains et paiements entre paliers via Stripe
  > • Système d'engagement : points, séries, récapitulatifs
  >
  > Application conçue pour l'industrie du nettoyage commercial au Québec.

- **Icône** : 512×512 — utilise `frontend/public/pwa-512.png`
- **Image de présentation (feature graphic)** : 1024×500 — **à créer** (bandeau
  simple : logo balai‑K + « KLEAN'STOR » sur fond `#2d5871`).
- **Captures d'écran téléphone** : min. 2, 16:9 ou 9:16 — **à faire** (écran
  connexion, liste des tâches, page magasin, classement).
- **Catégorie** : Entreprise (Business)
- **Politique de confidentialité** : `https://app.kleanstor.org/confidentialite`
- **Coordonnées** : un courriel de contact (ex. `support@kleanstor.org` — à
  activer via Cloudflare Email Routing).

---

## 6. Déclarations obligatoires (Play Console)

- **Content rating** : remplis le questionnaire → l'app obtiendra « Tout public ».
- **Data safety** (section « Sécurité des données ») — déclare :
  - Données personnelles : Nom, Courriel, Téléphone, Adresse → collectées,
    chiffrées en transit, non partagées à des fins pub, supprimables sur demande.
  - **Localisation précise** → collectée, utilisée pour « fonctionnalité de
    l'app » (vérification de présence), **non** partagée, non conservée.
  - Photos → collectées (inspections), stockées de façon sécurisée.
  - Infos financières → traitées par Stripe (tiers), pas stockées en clair.
  - ID de connexion / mot de passe → haché.
- **Target audience** : adultes (18+) — usage professionnel.
- **Ads** : Non.
- **Government app / Financial features** : Non (le paiement passe par Stripe,
  l'app n'est pas une institution financière).
- **App access** : l'app exige une connexion → fournis un **compte de test**
  (courriel + mot de passe d'un compte admin ou travailleur de démo) pour que le
  réviseur Google puisse entrer.

---

## 7. Soumettre

Production → **Send for review**. Première soumission : 3–7 jours ouvrables.
Tu recevras un courriel (acceptée / refusée avec motif).

---

## Mises à jour futures

À chaque nouvelle version de l'app web, **rien à faire** pour la TWA : elle
charge toujours `https://app.kleanstor.org` en direct. Tu ne re‑soumets un
`.aab` que si tu changes l'icône, le nom, le Package ID, ou la version Android
cible. Dans ce cas, réutilise **la même clé de signature** (d'où l'importance de
la garder).
