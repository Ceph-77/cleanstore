import { Link } from "react-router-dom";
import { Logo } from "../components/common/Logo";

// Politique de confidentialité destinée notamment à satisfaire l'exigence du
// Google Play Store (URL publique). Rédigée de bonne foi — à faire relire par un
// conseiller juridique avant toute portée officielle.

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas-0 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Logo size="lg" />
        <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-canvas-900">
          Politique de confidentialité
        </h1>
        <p className="mt-1 text-sm text-canvas-600">
          En vigueur depuis le 4 septembre 2026 · s'applique au site et à l'application KLEAN'STOR
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-canvas-800">
          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">1. Qui nous sommes</h2>
            <p className="mt-2">
              KLEAN'STOR est une plateforme de mise en relation pour le nettoyage commercial (magasins, grandes
              compagnies de gestion d'installations, sous-traitants, travailleurs autonomes). Cette politique décrit
              les renseignements que nous recueillons, pourquoi, avec qui ils sont partagés, et comment les gérer.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">2. Renseignements recueillis</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Identité et contact</strong> : nom, courriel, numéro de téléphone, adresse postale.
              </li>
              <li>
                <strong>Compte</strong> : rôle (admin, sous-traitant, travailleur), organisation, mot de passe (stocké
                sous forme chiffrée / hachée), disponibilités, photo de profil si fournie.
              </li>
              <li>
                <strong>Localisation précise</strong> : lorsqu'un travailleur démarre une tâche, l'application demande
                sa position GPS afin de vérifier qu'il se trouve à proximité du magasin. La position n'est utilisée
                que pour cette vérification au moment de l'action ; il n'y a pas de suivi en arrière-plan.
              </li>
              <li>
                <strong>Contenu lié au travail</strong> : tâches, notes, photos d'inspection avant/après, scores
                d'inspection, remarques.
              </li>
              <li>
                <strong>Paiement</strong> : les informations bancaires et de carte sont saisies et traitées
                directement par Stripe. KLEAN'STOR ne conserve pas les numéros de carte complets ni les
                identifiants bancaires ; nous conservons uniquement des identifiants de transaction et des montants.
              </li>
              <li>
                <strong>Données d'utilisation</strong> : historique des tâches, points et « moments » du système
                d'engagement, journaux techniques nécessaires à la sécurité et au bon fonctionnement.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">3. Finalités</h2>
            <p className="mt-2">
              Ces renseignements servent uniquement à : créer et gérer les comptes ; publier et attribuer des
              tâches ; vérifier la présence sur place au démarrage d'une tâche ; assurer le suivi et l'inspection du
              travail ; traiter les paiements entre utilisateurs ; envoyer des courriels transactionnels
              (réinitialisation de mot de passe, décisions, récapitulatifs) ; prévenir la fraude et sécuriser la
              plateforme. Nous ne vendons aucune donnée et ne faisons pas de publicité ciblée.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">4. Partage avec des tiers</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Autres utilisateurs</strong> : un sous-traitant et un admin voient les informations
                nécessaires à l'attribution et au suivi des tâches (nom, coordonnées professionnelles, historique,
                inspections).
              </li>
              <li>
                <strong>Stripe</strong> (paiements) — <span className="text-canvas-600">stripe.com/privacy</span>
              </li>
              <li>
                <strong>Cloudflare</strong> (hébergement du site et stockage sécurisé des documents et photos)
              </li>
              <li>
                <strong>Resend</strong> (envoi des courriels transactionnels)
              </li>
              <li>
                <strong>Render</strong> et <strong>Neon</strong> (hébergement de l'application et de la base de
                données)
              </li>
            </ul>
            <p className="mt-2">
              Nous pouvons divulguer des renseignements si la loi l'exige. Certains de ces fournisseurs traitent des
              données à l'extérieur du Canada.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">5. Conservation</h2>
            <p className="mt-2">
              Les renseignements sont conservés tant que le compte est actif et aussi longtemps que nécessaire pour
              les obligations comptables, fiscales et légales. Les données de localisation ne sont pas conservées
              au-delà de la vérification de présence.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">6. Vos droits</h2>
            <p className="mt-2">
              Conformément à la Loi 25 (Québec) et aux lois applicables, vous pouvez demander l'accès, la
              rectification ou la suppression de vos renseignements personnels, ainsi que le retrait de votre
              consentement. Un administrateur peut désactiver ou supprimer un compte dans l'application ; pour toute
              demande, écrivez à <strong>confidentialite@kleanstor.org</strong>. Nous répondons dans les délais
              prévus par la loi.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">7. Sécurité</h2>
            <p className="mt-2">
              Communications chiffrées (HTTPS), mots de passe hachés, accès restreint selon le rôle, stockage des
              fichiers sur un service à accès contrôlé. Aucun système n'est infaillible ; en cas d'incident touchant
              des renseignements personnels, nous prendrons les mesures et notifications exigées par la loi.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">8. Modifications</h2>
            <p className="mt-2">
              Cette politique peut être mise à jour. La date d'entrée en vigueur en haut de page indique la version
              courante.
            </p>
          </section>

          <p className="pt-4 text-xs text-canvas-500">
            Ce document est fourni de bonne foi et devrait être revu par un conseiller juridique avant d'être invoqué
            officiellement.
          </p>
        </div>

        <div className="mt-10 flex gap-4 text-sm">
          <Link to="/terms" className="font-medium text-flow-700 hover:text-flow-900">
            Conditions d'utilisation
          </Link>
          <Link to="/login" className="font-medium text-flow-700 hover:text-flow-900">
            Connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
