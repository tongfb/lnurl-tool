const USER_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;

export function parseLightningAddress(input: string) {
  const value = input.trim();
  if ((value.match(/@/g) ?? []).length !== 1) {
    throw new Error("Enter a Lightning Address with exactly one @ symbol.");
  }

  const [username, domain] = value.split("@");
  if (!username || !USER_RE.test(username)) {
    throw new Error("The username contains unsupported characters.");
  }

  const normalizedDomain = domain.toLowerCase();
  const labels = normalizedDomain.split(".");
  if (
    normalizedDomain.length > 253 ||
    labels.length < 2 ||
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        !/^[a-z0-9-]+$/.test(label) ||
        label.startsWith("-") ||
        label.endsWith("-"),
    )
  ) {
    throw new Error("Enter a valid domain name.");
  }

  return { username, domain: normalizedDomain, address: `${username}@${normalizedDomain}` };
}

export function lightningAddressToEndpoint(input: string) {
  const { username, domain } = parseLightningAddress(input);
  return `https://${domain}/.well-known/lnurlp/${encodeURIComponent(username)}`;
}

export function deriveLightningAddress(endpoint: string) {
  const url = new URL(endpoint);
  const match = url.pathname.match(/^\/\.well-known\/lnurlp\/([^/]+)$/);
  if (!match || url.search || url.hash) return null;
  try {
    return `${decodeURIComponent(match[1])}@${url.hostname}`;
  } catch {
    return null;
  }
}
