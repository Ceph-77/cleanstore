# KLEAN'STOR

Application web pour l'industrie du nettoyage de magasins (nom de code technique : `CleanStore`).

## Modèle d'affaires

Chaîne de délégation : Magasin → Grande compagnie (GDI, Derko, United...) → Sous-traitant → Travailleur autonome.
Marketplace de tâches (inspiré de Turno), gestion multi-sites (inspiré de Swept), inspection qualité (inspiré de CleanTelligent/Otuvy).

## Portée

- **Fiche magasin** (MVP actuel) — identité/contact, caractéristiques physiques, contrat/fréquence, assignation
- **Tâches avec prix** (MVP actuel) — description, prix négociable ou non, échéance, statut
- Marketplace de réclamation de tâches, chaîne de facturation, inspection avec photos, inventaire — phases futures

## Stack technique

TypeScript partout, PostgreSQL (hébergé sur Neon), Express + Prisma (backend), React + Vite + Tailwind + TanStack Query (frontend), authentification par session.

## Structure

- `frontend/` — interface web (React + Vite)
- `backend/` — API REST (Express + Prisma)
- `docs/` — spécifications, notes de conception

## Démarrage local

Voir `backend/.env.example` et `frontend/.env.example` pour les variables d'environnement requises.

```
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## Statut

MVP en cours : enregistrement de magasins + tâches avec prix, connecté à une base PostgreSQL Neon.
