// Server-only TossPayments helpers: payment confirmation and webhook signature
// verification. TOSS_SECRET_KEY must never reach the client bundle.
import crypto from "crypto";

const TOSS_API_BASE = "https://api.tosspayments.com/v1";

interface ConfirmPaymentParams {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentResult {
  status: string;
  paymentKey: string;
  orderId: string;
  totalAmount: number;
  [key: string]: unknown;
}

// Confirms a payment with Toss's server (authoritative source of truth).
// Client-reported success must never be trusted on its own.
export async function confirmTossPayment({
  paymentKey,
  orderId,
  amount,
}: ConfirmPaymentParams): Promise<TossPaymentResult> {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("TOSS_SECRET_KEY is not configured");

  const basicAuth = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = (await res.json()) as TossPaymentResult;

  if (!res.ok) {
    const message =
      (data as { message?: string }).message ?? "Toss payment confirmation failed";
    throw new Error(message);
  }

  return data;
}

// Re-fetches the authoritative payment status directly from Toss by paymentKey.
// Used by the webhook handler so we never trust the webhook payload's own
// status field without cross-checking it against Toss's servers.
export async function fetchTossPayment(paymentKey: string): Promise<TossPaymentResult> {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("TOSS_SECRET_KEY is not configured");

  const basicAuth = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch(`${TOSS_API_BASE}/payments/${paymentKey}`, {
    headers: { Authorization: `Basic ${basicAuth}` },
  });

  const data = (await res.json()) as TossPaymentResult;
  if (!res.ok) {
    const message =
      (data as { message?: string }).message ?? "Failed to fetch Toss payment";
    throw new Error(message);
  }
  return data;
}

// Verifies the `TossPayments-Signature` header on incoming webhook requests
// using the shared secret from the Toss Developer Center. Requests that fail
// verification MUST be rejected (401) before any order state is touched.
export function verifyTossWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
