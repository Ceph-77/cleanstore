import PDFDocument from "pdfkit";
import { prisma } from "../../db/prisma";
import { listLedgerForParty } from "../ledger/ledger.service";

type PDFDoc = InstanceType<typeof PDFDocument>;

const LEDGER_TYPE_LABELS: Record<string, string> = {
  gain_cree: "Gain créé",
  gain_dispo: "Gain disponible",
  commission: "Commission",
  penalite: "Pénalité",
  prime: "Prime",
  transfert_clan: "Transfert de clan",
  retrait: "Retrait",
  retrait_echoue: "Retrait échoué",
  abonnement: "Abonnement",
  charge_sous_traitant: "Charge sous-traitant",
  ajustement_inspecteur: "Ajustement inspecteur",
};

function money(n: number): string {
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
}

function date(d: Date): string {
  return d.toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
}

/** Rend un PDFKit.PDFDocument en Buffer — la seule pièce générique de ce fichier. */
function renderPdf(draw: (doc: PDFDoc) => void, footerNote?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 54 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    header(doc);
    draw(doc);
    footer(doc, footerNote);
    doc.end();
  });
}

function header(doc: PDFDoc): void {
  doc
    .fillColor("#2d5871")
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("KLEAN’STOR", { continued: false });
  doc.moveDown(0.3);
  doc.fillColor("#000").font("Helvetica");
}

const FINANCIAL_FOOTER_NOTE =
  "Petits fournisseurs — TPS/TVQ non applicables, sous réserve de la situation fiscale du travailleur. " +
  "Ce document est généré automatiquement et sert de référence ; il ne remplace pas les registres officiels de Stripe.";

function footer(doc: PDFDoc, note: string = FINANCIAL_FOOTER_NOTE): void {
  doc.moveDown(2);
  doc.fontSize(8).fillColor("#7a7362").text(note, { align: "left" });
}

/**
 * Reçu de retrait (Q58-60) : brut/commission/net/date/statut/réf Stripe.
 * Le retrait est déjà décidé au moment où ce document est généré — ce n'est
 * qu'une mise en forme, aucune écriture n'est créée ici.
 */
export async function buildWithdrawalReceipt(withdrawalId: string): Promise<Buffer> {
  const withdrawal = await prisma.withdrawal.findUniqueOrThrow({
    where: { id: withdrawalId },
    include: { worker: { select: { fullName: true, email: true } } },
  });

  return renderPdf((doc) => {
    doc.fontSize(14).text("Reçu de retrait");
    doc.moveDown();
    doc.fontSize(10).fillColor("#555").text(`Émis le ${date(new Date())}`);
    doc.moveDown(1.2);

    doc.fillColor("#000").fontSize(11);
    doc.text(`Travailleur : ${withdrawal.worker.fullName ?? withdrawal.worker.email}`);
    doc.text(`Date du retrait : ${date(withdrawal.createdAt)}`);
    doc.text(
      `Statut : ${withdrawal.status === "paid" ? "Payé" : withdrawal.status === "failed" ? "Échoué" : "En traitement"}`,
    );
    if (withdrawal.stripeTransferId) doc.text(`Référence Stripe : ${withdrawal.stripeTransferId}`);
    doc.moveDown();

    doc.text(`Montant brut : ${money(Number(withdrawal.grossAmount))}`);
    doc.text(`Commission KLEAN'STOR : ${money(Number(withdrawal.commissionAmount))}`);
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").fontSize(13).text(`Montant net versé : ${money(Number(withdrawal.netAmount))}`);
    doc.font("Helvetica").fontSize(11);
  });
}

/**
 * Relevé mensuel par travailleur (Q58-60) : tâches complétées + toutes les
 * écritures du grand livre où il est une des deux parties (gains, primes,
 * pénalités, transferts de clan reçus ou donnés) dans le mois demandé.
 */
export async function buildMonthlyStatement(workerId: string, year: number, month: number): Promise<Buffer> {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));

  const [worker, tasks, entries] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: workerId }, select: { fullName: true, email: true } }),
    prisma.task.findMany({
      where: { assignedToId: workerId, status: { in: ["completed", "inspected"] }, updatedAt: { gte: from, lt: to } },
      select: { id: true, description: true, price: true, updatedAt: true, store: { select: { name: true } } },
      orderBy: { updatedAt: "asc" },
    }),
    listLedgerForParty(workerId, from, to),
  ]);

  const monthLabel = from.toLocaleDateString("fr-CA", { year: "numeric", month: "long" });

  // Sous-totaux transparents plutôt qu'un seul chiffre "net" combiné — un
  // relevé qui sert potentiellement pour les impôts du travailleur ne doit
  // jamais mélanger des types d'écriture dans une formule qu'on ne peut pas
  // vérifier ligne par ligne (gain_cree/gain_dispo sont deux vues du MÊME
  // gain, ne compter que gain_dispo pour ne pas le doubler).
  const totals = { gains: 0, primes: 0, penalites: 0, transfertsRecus: 0, transfertsDonnes: 0, retraits: 0 };
  for (const e of entries) {
    const amt = Number(e.amount);
    if (e.type === "gain_dispo") totals.gains += amt;
    else if (e.type === "prime") totals.primes += amt;
    else if (e.type === "penalite") totals.penalites += amt;
    else if (e.type === "transfert_clan") {
      if (e.partyBId === workerId) totals.transfertsRecus += amt;
      else totals.transfertsDonnes += amt;
    } else if (e.type === "retrait") totals.retraits += amt;
  }
  const gagneAvantRetrait = totals.gains + totals.primes + totals.transfertsRecus - totals.penalites - totals.transfertsDonnes;

  return renderPdf((doc) => {
    doc.fontSize(14).text(`Relevé mensuel — ${monthLabel}`);
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor("#555").text(worker.fullName ?? worker.email);
    doc.moveDown(1.2);
    doc.fillColor("#000");

    doc.font("Helvetica-Bold").fontSize(11).text("Tâches complétées");
    doc.font("Helvetica").fontSize(10);
    if (tasks.length === 0) {
      doc.fillColor("#777").text("Aucune tâche complétée ce mois-ci.");
      doc.fillColor("#000");
    } else {
      for (const t of tasks) {
        doc.text(`${date(t.updatedAt)} — ${t.store?.name ?? ""} — ${t.description} — ${money(Number(t.price))}`);
      }
    }
    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(11).text("Mouvements du grand livre");
    doc.font("Helvetica").fontSize(10);
    if (entries.length === 0) {
      doc.fillColor("#777").text("Aucun mouvement ce mois-ci.");
      doc.fillColor("#000");
    } else {
      for (const e of entries) {
        const label = LEDGER_TYPE_LABELS[e.type] ?? e.type;
        const sign = e.partyAId === workerId ? "" : "(reçu) ";
        doc.text(`${date(e.createdAt)} — ${label} ${sign}— ${money(Number(e.amount))}${e.reason ? ` — ${e.reason}` : ""}`);
      }
    }
    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(11).text("Sommaire du mois");
    doc.font("Helvetica").fontSize(10);
    doc.text(`Gains devenus disponibles : ${money(totals.gains)}`);
    if (totals.primes) doc.text(`Primes : ${money(totals.primes)}`);
    if (totals.penalites) doc.text(`Pénalités : -${money(totals.penalites)}`);
    if (totals.transfertsRecus) doc.text(`Parts de clan reçues : ${money(totals.transfertsRecus)}`);
    if (totals.transfertsDonnes) doc.text(`Parts de clan données : -${money(totals.transfertsDonnes)}`);
    doc.font("Helvetica-Bold").text(`Gagné ce mois (avant retrait/commission) : ${money(gagneAvantRetrait)}`);
    doc.font("Helvetica");
    doc.text(`Retiré ce mois (net, après commission) : ${money(totals.retraits)}`);
    doc.font("Helvetica").fontSize(10);
  });
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  blessure: "Blessure",
  degat: "Dégât matériel",
  vol: "Vol",
  incendie: "Incendie",
  sante: "Problème de santé",
  autre: "Autre",
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  ouverte: "Ouverte",
  en_traitement: "En traitement",
  resolue: "Résolue",
};

/**
 * Rapport d'incident imprimable (Q41-43, "Générer le rapport" — utile pour
 * l'assurance). Ne dépend pas du push/VAPID (encore absent) : c'est juste
 * une mise en forme de ce qui est déjà consigné sur l'incident.
 */
export async function buildIncidentReport(incidentId: string): Promise<Buffer> {
  const incident = await prisma.incident.findUniqueOrThrow({
    where: { id: incidentId },
    include: {
      store: { select: { id: true, name: true, address: true, city: true } },
      task: { select: { id: true, description: true } },
      reportedBy: { select: { fullName: true, email: true } },
      assignedTo: { select: { fullName: true, email: true } },
      notes: { orderBy: { createdAt: "asc" }, include: { author: { select: { fullName: true, email: true } } } },
    },
  });

  return renderPdf((doc) => {
    doc.fontSize(14).text("Rapport d'incident");
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor("#555").text(`Généré le ${date(new Date())}`);
    doc.moveDown(1.2);
    doc.fillColor("#000").fontSize(11);

    doc.text(`Type : ${INCIDENT_TYPE_LABELS[incident.type] ?? incident.type}`);
    doc.text(`Gravité : ${incident.severity}`);
    doc.text(`Statut : ${INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}`);
    doc.text(`Signalé le : ${date(incident.createdAt)}`);
    if (incident.store) doc.text(`Magasin : ${incident.store.name}${incident.store.city ? ` (${incident.store.city})` : ""}`);
    if (incident.task) doc.text(`Tâche liée : ${incident.task.description}`);
    doc.text(`Signalé par : ${incident.reportedBy?.fullName ?? incident.reportedBy?.email ?? "Anonyme"}`);
    if (incident.assignedTo) {
      doc.text(`Assigné à : ${incident.assignedTo.fullName ?? incident.assignedTo.email}`);
    }
    doc.moveDown();

    doc.font("Helvetica-Bold").text("Description");
    doc.font("Helvetica").text(incident.description, { width: 480 });
    doc.moveDown();

    doc.font("Helvetica-Bold").text("Notes de suivi");
    doc.font("Helvetica").fontSize(10);
    if (incident.notes.length === 0) {
      doc.fillColor("#777").text("Aucune note de suivi.");
      doc.fillColor("#000");
    } else {
      for (const n of incident.notes) {
        doc.text(`${date(n.createdAt)} — ${n.author?.fullName ?? n.author?.email ?? "—"} : ${n.body}`, {
          width: 480,
        });
      }
    }
  }, "Ce rapport reflète les informations consignées dans l'application au moment de sa génération et sert de référence pour un dossier d'assurance ou de suivi interne.");
}
