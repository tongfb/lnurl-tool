import assert from "node:assert/strict";
import test from "node:test";
import { bech32 } from "bech32";
import { decodeLnurl, encodeLnurl } from "../app/lib/lnurl.ts";
import { lightningAddressToEndpoint, parseLightningAddress } from "../app/lib/lightningAddress.ts";

test("Lightning Address maps to the LUD-16 endpoint", () => {
  assert.equal(lightningAddressToEndpoint("tong@example.com"), "https://example.com/.well-known/lnurlp/tong");
});

test("endpoint encodes to LNURL with the correct HRP", () => {
  const value = encodeLnurl("https://example.com/.well-known/lnurlp/tong");
  assert.match(value, /^lnurl1/);
});

test("URL → LNURL → URL round trip preserves the exact input", () => {
  const urls = [
    "https://example.com/.well-known/lnurlp/tong",
    "https://example.com/pay/%E2%9A%A1?note=%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B5",
  ];
  for (const url of urls) assert.equal(decodeLnurl(encodeLnurl(url)), url);
});

test("invalid checksum is rejected", () => {
  const valid = encodeLnurl("https://example.com/pay");
  const invalid = `${valid.slice(0, -1)}${valid.endsWith("q") ? "p" : "q"}`;
  assert.throws(() => decodeLnurl(invalid), /checksum|Bech32/i);
});

test("wrong HRP is rejected", () => {
  const words = bech32.toWords(new TextEncoder().encode("https://example.com/pay"));
  assert.throws(() => decodeLnurl(bech32.encode("other", words)), /prefix/i);
});

test("malformed Lightning Addresses are rejected", () => {
  for (const address of ["no-at", "two@@example.com", "@example.com", "user@localhost", "user@-bad.com"])
    assert.throws(() => parseLightningAddress(address));
});
