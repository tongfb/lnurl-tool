import { bech32 } from "bech32";

function requireHttps(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a valid HTTPS URL.");
  }
  if (url.protocol !== "https:") throw new Error("LNURL endpoints must use HTTPS.");
  if (url.username || url.password) throw new Error("URLs with credentials are not supported.");
  return value.trim();
}

export function encodeLnurl(endpoint: string) {
  const value = requireHttps(endpoint);
  const bytes = new TextEncoder().encode(value);
  return bech32.encode("lnurl", bech32.toWords(bytes), 2000);
}

export function decodeLnurl(value: string) {
  let decoded: ReturnType<typeof bech32.decode>;
  try {
    decoded = bech32.decode(value.trim().toLowerCase(), 2000);
  } catch {
    throw new Error("Invalid Bech32 value or checksum.");
  }
  if (decoded.prefix !== "lnurl") throw new Error("Wrong Bech32 prefix. Expected lnurl.");

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(bech32.fromWords(decoded.words));
  } catch {
    throw new Error("The LNURL payload is invalid.");
  }

  let endpoint: string;
  try {
    endpoint = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Decoded LNURL is not valid UTF-8.");
  }
  return requireHttps(endpoint);
}
