export type LnurlPayResponse = {
  tag: "payRequest";
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
  commentAllowed?: number;
  allowsNostr?: boolean;
  nostrPubkey?: string;
};

export function validateLnurlPayResponse(value: unknown): value is LnurlPayResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.tag === "payRequest" &&
    typeof v.callback === "string" &&
    typeof v.minSendable === "number" &&
    typeof v.maxSendable === "number" &&
    typeof v.metadata === "string"
  );
}

export async function verifyLnurlPayEndpoint(endpoint: string) {
  let response: Response;
  try {
    response = await fetch(endpoint, { method: "GET", headers: { Accept: "application/json" } });
  } catch {
    throw new Error("COULD_NOT_VERIFY");
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("NON_JSON");
  }
  if (!response.ok || !validateLnurlPayResponse(data)) throw new Error("INVALID_LNURL_PAY");
  return data;
}
