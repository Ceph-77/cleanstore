import { useState, type FormEvent } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { stripePromise, isStripeConfigured } from "../../utils/stripe";
import { useSaveFundingMethod } from "../../hooks/usePayments";
import { ApiError } from "../../api/client";

function FundingMethodForm() {
  const stripe = useStripe();
  const elements = useElements();
  const saveFundingMethod = useSaveFundingMethod();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (stripeError || !paymentMethod) {
      setError(stripeError?.message ?? "Erreur lors de l'enregistrement de la carte");
      return;
    }

    try {
      await saveFundingMethod.mutateAsync(paymentMethod.id);
      setMessage("Méthode de paiement enregistrée.");
      cardElement.clear();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5"
    >
      <h2 className="text-sm font-semibold text-canvas-900">Carte de paiement</h2>
      <p className="text-sm text-canvas-600">
        Cette carte sera chargée automatiquement pour chaque tâche complétée et approuvée par tes travailleurs.
      </p>
      <div className="rounded-lg border border-canvas-300 px-3 py-3">
        <CardElement options={{ style: { base: { fontSize: "15px" } } }} />
      </div>
      {message && <p className="rounded-lg bg-flow-50 px-3 py-2 text-sm text-flow-800">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" variant="accent" disabled={!stripe || saveFundingMethod.isPending}>
          {saveFundingMethod.isPending ? "Enregistrement..." : "Enregistrer la carte"}
        </Button>
      </div>
    </form>
  );
}

export function PaymentSettingsPage() {
  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Markettask</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Méthode de paiement</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Ta carte sert à payer tes travailleurs automatiquement quand une tâche est approuvée.
      </p>

      {isStripeConfigured() && stripePromise ? (
        <Elements stripe={stripePromise}>
          <FundingMethodForm />
        </Elements>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Le paiement n'est pas encore configuré.
        </p>
      )}
    </AppLayout>
  );
}
