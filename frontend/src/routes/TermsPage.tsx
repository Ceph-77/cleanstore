import { Link } from "react-router-dom";
import { Logo } from "../components/common/Logo";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas-0 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Logo size="lg" />
        <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-canvas-900">
          Conditions d'utilisation et politique de confidentialité
        </h1>
        <p className="mt-1 text-sm text-canvas-600">Version 1.0 — en vigueur depuis le 21 août 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-canvas-800">
          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">1. Objet de la plateforme</h2>
            <p className="mt-2">
              KLEAN'STOR est une plateforme technologique de mise en relation entre des magasins, des grandes
              compagnies de gestion d'installations, des sous-traitants en nettoyage commercial et des travailleurs
              autonomes. KLEAN'STOR permet à ces différents acteurs de publier des besoins de nettoyage, de réclamer
              des tâches disponibles, de suivre l'exécution du travail et, le cas échéant, de traiter des paiements
              entre eux.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">
              2. Nature de la relation entre les utilisateurs
            </h2>
            <p className="mt-2">
              KLEAN'STOR agit exclusivement à titre d'intermédiaire technologique. L'utilisation de la plateforme ne
              crée, entre KLEAN'STOR et un utilisateur, ni lien d'emploi, ni lien de subordination, ni société en
              participation, ni coentreprise. De même, aucune relation d'emploi n'est créée entre les différents
              utilisateurs (magasins, grandes compagnies, sous-traitants, travailleurs autonomes) du seul fait de
              leur mise en relation par la plateforme. Chaque utilisateur demeure responsable de la nature juridique
              de ses propres relations contractuelles avec les autres utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">
              3. Responsabilité fiscale et administrative
            </h2>
            <p className="mt-2">
              Chaque utilisateur est seul responsable de déclarer ses revenus auprès de Revenu Québec et de l'Agence
              du revenu du Canada, de percevoir et de remettre les taxes applicables (TPS/TVQ) lorsque les seuils
              légaux sont atteints, et de respecter toute autre obligation fiscale ou administrative qui lui
              incombe. KLEAN'STOR ne fournit aucun conseil fiscal, comptable ou juridique et recommande à chaque
              utilisateur de consulter un professionnel qualifié pour toute question relative à sa situation
              personnelle.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">4. Statut légal pour travailler ou faire affaire au Canada</h2>
            <p className="mt-2">
              En s'inscrivant sur la plateforme, chaque utilisateur garantit détenir le droit légal d'exercer une
              activité rémunérée ou de faire affaire au Canada, conformément aux lois sur l'immigration et à toute
              autorisation applicable à son statut (citoyen, résident permanent, permis d'études, permis de travail,
              ou autre). Il est de la responsabilité de chaque utilisateur de s'assurer que son usage de la
              plateforme respecte les conditions de son propre statut légal, y compris, le cas échéant, toute limite
              d'heures de travail applicable.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">
              5. Protection des renseignements personnels
            </h2>
            <p className="mt-2">
              KLEAN'STOR collecte uniquement les renseignements personnels nécessaires au fonctionnement de la
              plateforme : nom, coordonnées, adresse, et informations de paiement (traitées directement par notre
              fournisseur de services de paiement, sans que KLEAN'STOR ne conserve les données bancaires complètes).
              Ces renseignements sont utilisés exclusivement pour la mise en relation des utilisateurs, la gestion
              des comptes et le traitement des paiements. KLEAN'STOR prend des mesures raisonnables pour protéger
              ces renseignements, notamment par le chiffrement des communications. Conformément à la Loi sur la
              protection des renseignements personnels dans le secteur privé (Loi 25), tout utilisateur peut
              demander l'accès, la rectification ou la suppression de ses renseignements personnels en contactant
              l'administrateur de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">6. Modification des conditions</h2>
            <p className="mt-2">
              KLEAN'STOR peut modifier les présentes conditions en tout temps. Toute modification substantielle sera
              accompagnée d'une nouvelle version numérotée, et une nouvelle acceptation pourra être demandée aux
              utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-canvas-900">7. Acceptation</h2>
            <p className="mt-2">
              En cochant la case d'acceptation lors de l'inscription ou de la connexion, l'utilisateur reconnaît
              avoir lu, compris et accepté les présentes conditions d'utilisation et la politique de confidentialité
              qui en fait partie intégrante.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm">
          <Link to="/login" className="font-medium text-flow-700 hover:text-flow-900">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
