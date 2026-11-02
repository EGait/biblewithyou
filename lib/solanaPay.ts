import { randomBytes } from "node:crypto";

// Solana Pay (USDC) without extra SDKs: build the payment link, then confirm
// on chain with plain JSON RPC calls.

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_DECIMALS = 6;

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58(bytes: Uint8Array): string {
  let num = BigInt("0x" + Buffer.from(bytes).toString("hex"));
  let out = "";
  while (num > BigInt(0)) {
    out = ALPHABET[Number(num % BigInt(58))] + out;
    num = num / BigInt(58);
  }
  for (const b of bytes) {
    if (b !== 0) break;
    out = "1" + out;
  }
  return out;
}

// A random 32 byte key used only to find this payment on chain.
export function newReference(): string {
  return base58(randomBytes(32));
}

export function merchantWallet(): string {
  const w = process.env.SOLANA_MERCHANT_WALLET;
  if (!w) throw new Error("SOLANA_MERCHANT_WALLET is not set");
  return w;
}

export function paymentUrl(opts: { amount: string; reference: string; label: string; message: string }) {
  const p = new URLSearchParams({
    amount: opts.amount,
    "spl-token": USDC_MINT,
    reference: opts.reference,
    label: opts.label,
    message: opts.message,
  });
  return `solana:${merchantWallet()}?${p.toString()}`;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const url = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "RPC error");
  return data.result as T;
}

type TokenBal = { mint: string; owner?: string; uiTokenAmount: { amount: string } };

// Returns the signature if a confirmed USDC payment of at least `amount`
// reached the merchant wallet with this reference attached.
export async function findPayment(reference: string, amount: string): Promise<string | null> {
  const merchant = merchantWallet();
  const need = BigInt(Math.round(Number(amount) * 10 ** USDC_DECIMALS));
  const sigs = await rpc<{ signature: string; err: unknown }[]>("getSignaturesForAddress", [
    reference,
    { limit: 10, commitment: "confirmed" },
  ]);
  for (const s of sigs) {
    if (s.err) continue;
    const tx = await rpc<{ meta: { err: unknown; preTokenBalances?: TokenBal[]; postTokenBalances?: TokenBal[] } } | null>(
      "getTransaction",
      [s.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0, commitment: "confirmed" }],
    );
    if (!tx || tx.meta.err) continue;
    const sum = (list: TokenBal[] = []) =>
      list
        .filter((b) => b.mint === USDC_MINT && b.owner === merchant)
        .reduce((acc, b) => acc + BigInt(b.uiTokenAmount.amount), BigInt(0));
    const received = sum(tx.meta.postTokenBalances) - sum(tx.meta.preTokenBalances);
    if (received >= need) return s.signature;
  }
  return null;
}
