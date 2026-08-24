# ZAPM LN Tools

Open-source Lightning Address and LNURL toolkit by HereTong.

ZAPM LN Tools is a local-first, provider-agnostic browser utility for converting between Lightning Addresses, reusable LNURL-pay HTTPS endpoints, Bech32 LNURLs, and high-resolution QR codes.

All encoding, decoding, and QR generation happen locally in the visitor's browser. The only network request initiated by the interface is the optional endpoint check after the user presses **Verify LNURL-pay endpoint**. The verifier never calls the callback and never requests an invoice.

## How the mapping works

Under LUD-16, a Lightning Address such as:

```text
tong@example.com
```

maps to the LUD-06 endpoint:

```text
https://example.com/.well-known/lnurlp/tong
```

The UTF-8 bytes of that HTTPS URL are converted to five-bit words and encoded with standard Bech32 using the `lnurl` human-readable prefix. LNURL does not use Bech32m. The resulting `lnurl1...` value can be used as the QR payload.

## Why control your own domain?

When you control the domain and keep the same LNURL-pay endpoint, you can change the wallet, Lightning service, or node behind it without changing the public QR.

The QR remains usable only while the domain, DNS, HTTPS, and LNURL-pay endpoint remain available.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by the development server.

## Tests and production build

```bash
npm test
npm run build
npm run build:static
```

The tests cover Lightning Address mapping, endpoint encoding, exact round trips, UTF-8 URLs, invalid checksums, wrong prefixes, and malformed addresses.

## Deployment

The application has no database, authentication, cookies, analytics, or server-side business logic. Its protocol operations run entirely in the visitor's browser.

For Sites, deploy the validated `dist/` build through the project publishing flow.

For ordinary static hosting, run `npm run build:static`, then publish the **contents** of `static-dist/` to the path of your choice.

The static bundle uses relative asset paths, so it can run from a repository subdirectory or a nested path such as `/lntool/`. No Node.js, PHP, database, or server-side application is needed after upload.

## Forking and reuse

ZAPM LN Tools is designed to remain provider-agnostic and easy to fork. The Lightning conversion logic is not tied to `zapm.uk` or to a specific wallet provider. A fork can change branding, examples, copy, and deployment location while keeping the protocol logic intact.

## Source structure

- `app/LnurlTool.tsx` — interactive one-page interface
- `app/lib/lightningAddress.ts` — LUD-16 address parsing and mapping
- `app/lib/lnurl.ts` — Bech32 LNURL encoding and decoding
- `app/lib/verify.ts` — optional LUD-06 response validation
- `app/globals.css` — responsive visual design
- `tests/lnurl.test.mjs` — protocol-focused automated tests
- `static/` and `vite.static.config.ts` — static entry point and build configuration
- `static-dist/` — generated upload-ready static files

## Credits

ZAPM LN Tools — by HereTong

Built on open standards including LUD-06, LUD-16, and Bech32.
