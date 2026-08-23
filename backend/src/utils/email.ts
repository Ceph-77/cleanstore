import { Resend } from "resend";
import { env } from "../config/env";

let client: Resend | null = null;

function getClient(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error("Email sending is not configured (missing RESEND_API_KEY)");
  }
  if (!client) {
    client = new Resend(env.RESEND_API_KEY);
  }
  return client;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = env.RESEND_FROM_EMAIL ?? "KLEAN'STOR <onboarding@resend.dev>";
  await getClient().emails.send({
    from,
    to,
    subject: "Réinitialisation de ton mot de passe KLEAN'STOR",
    html: `
      <p>Tu as demandé à réinitialiser ton mot de passe.</p>
      <p><a href="${resetUrl}">Clique ici pour choisir un nouveau mot de passe</a></p>
      <p>Ce lien expire dans 1 heure. Si tu n'as pas demandé ça, ignore ce courriel.</p>
    `,
  });
}

export async function sendClaimDecisionEmail(
  to: string,
  data: { itemLabel: string; status: "approved" | "rejected"; reason?: string | null }
) {
  const from = env.RESEND_FROM_EMAIL ?? "KLEAN'STOR <onboarding@resend.dev>";
  const subject =
    data.status === "approved"
      ? `Demande approuvée : ${data.itemLabel}`
      : `Demande refusée : ${data.itemLabel}`;
  const body =
    data.status === "approved"
      ? `<p>Ta demande pour « ${data.itemLabel} » a été approuvée. Connecte-toi à KLEAN'STOR pour voir les détails.</p>`
      : `<p>Ta demande pour « ${data.itemLabel} » a été refusée.</p>${
          data.reason ? `<p><strong>Raison :</strong> ${data.reason}</p>` : ""
        }`;
  await getClient().emails.send({ from, to, subject, html: body });
}

export function isEmailConfigured() {
  return Boolean(env.RESEND_API_KEY);
}
