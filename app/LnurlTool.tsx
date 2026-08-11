"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { decodeLnurl, encodeLnurl } from "./lib/lnurl";
import { deriveLightningAddress, lightningAddressToEndpoint, parseLightningAddress } from "./lib/lightningAddress";
import { LnurlPayResponse, verifyLnurlPayEndpoint } from "./lib/verify";

type Mode = "address" | "endpoint" | "lnurl";
type Result = { address?: string; endpoint: string; lnurl: string };

const samples: Record<Mode, string> = {
  address: "tong@example.com",
  endpoint: "https://example.com/.well-known/lnurlp/tong",
  lnurl: "lnurl1dp68gurn8ghj7etcv9khqmr99e3k7mf0d3h82unvwqhkxmmww3sk6atn9e5k7te3xqhkcmn4wfk8qtmhd9jkw6twye4nz0f3x5crxwfcx5mnxwrpx56nyv34xvmn2vf4vgunvvrrxq6ngdrpx5cnzv3sxv6rxc3sv93ngdf5vdnrvvf4x4jryc3sxe3rjcm9xg6nws6xwfu8qtmhd9jkw6twye4nz0f3x5crxwfcx5mnxwrpx56nyv34xvmn2vf4vgunvvrrxq6ngdrpx5cnzv3sxv6rxc3sv93ngdf5vdnrvvf4x4jryc3sxe3rjcm9xg6nws6xwfu8qvpsxs6nqwpkxcmnwv3jxgurjv3ex56n2wfjx5unywfcx5mrxwfjx5cnsvf4x4jryc3sxe3rjcm9xg6nws6xwfu8q0f3x5crxwfcx5mnxwrpx56nyv34xvmn2vf4vgunvvrrxq6ngdrpx5cnzv3sxv6rxc3sv93ngdf5vdnrvvf4x4jryc3sxe3rjcm9xg6nws6xwfu8q",
};

function short(value: string, max = 58) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export default function LnurlTool() {
  const [mode, setMode] = useState<Mode>("address");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<{ state: "valid" | "invalid" | "unreachable"; data?: LnurlPayResponse; note?: string } | null>(null);

  const conversion = useMemo<{ result?: Result; error?: string }>(() => {
    if (!input.trim()) return {};
    try {
      if (mode === "address") {
        const parsed = parseLightningAddress(input);
        const endpoint = lightningAddressToEndpoint(input);
        return { result: { address: parsed.address, endpoint, lnurl: encodeLnurl(endpoint) } };
      }
      if (mode === "endpoint") {
        const endpoint = input.trim();
        return { result: { endpoint, address: deriveLightningAddress(endpoint) ?? undefined, lnurl: encodeLnurl(endpoint) } };
      }
      const endpoint = decodeLnurl(input);
      return { result: { endpoint, address: deriveLightningAddress(endpoint) ?? undefined, lnurl: input.trim().toLowerCase() } };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "That value could not be converted." };
    }
  }, [input, mode]);

  const [qrDataUrl, setQrDataUrl] = useState("");
  useEffect(() => {
    let active = true;
    if (!conversion.result) {
      return;
    }
    QRCode.toDataURL(conversion.result.lnurl, {
      width: 1000,
      margin: 5,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" },
    }).then((url) => active && setQrDataUrl(url));
    return () => { active = false; };
  }, [conversion.result]);

  async function copy(label: string, value?: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1500);
  }

  async function verify() {
    if (!conversion.result) return;
    setVerifying(true);
    setVerification(null);
    try {
      const data = await verifyLnurlPayEndpoint(conversion.result.endpoint);
      setVerification({ state: "valid", data });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "COULD_NOT_VERIFY") {
        setVerification({ state: "unreachable", note: "The endpoint may still be valid. Browser verification can fail if the provider does not allow cross-origin requests." });
      } else if (code === "NON_JSON") {
        setVerification({ state: "invalid", note: "The endpoint returned a non-JSON response." });
      } else {
        setVerification({ state: "invalid", note: "The endpoint returned JSON, but it is not a valid LNURL-pay response." });
      }
    } finally {
      setVerifying(false);
    }
  }

  const fieldLabel = mode === "address" ? "Lightning Address" : mode === "endpoint" ? "LNURL-pay HTTPS endpoint" : "Bech32 LNURL";
  const placeholder = mode === "address" ? "tong@example.com" : mode === "endpoint" ? "https://example.com/.well-known/lnurlp/tong" : "lnurl1…";

  return (
    <main>
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="LNURL Tool home"><span className="bolt">ϟ</span> LNURL <b>TOOL</b></a>
        <a className="nav-link" href="#learn">How it works <span>→</span></a>
      </nav>

      <section className="hero" id="top">
        <div className="eyebrow"><i /> OPEN PROTOCOL · LOCAL BY DEFAULT</div>
        <h1>One address.<br /><em>Every Lightning wallet.</em></h1>
        <p className="lede">Convert a Lightning Address to its LNURL-pay endpoint, encode it as Bech32, and create a wallet-ready QR — all in your browser.</p>
      </section>

      <section className="tool-shell" aria-label="LNURL converter">
        <div className="step-label"><span>01</span> CHOOSE YOUR STARTING POINT</div>
        <div className="tabs" role="tablist" aria-label="Input format">
          {(["address", "endpoint", "lnurl"] as Mode[]).map((item, index) => (
            <button key={item} role="tab" aria-selected={mode === item} className={mode === item ? "active" : ""} onClick={() => { setMode(item); setInput(""); setVerification(null); }}>
              <span>{index + 1}</span>{item === "address" ? "Lightning Address" : item === "endpoint" ? "LNURL-pay Endpoint" : "LNURL Decoder"}
            </button>
          ))}
        </div>

        <div className="workspace">
          <div className="input-pane">
            <label htmlFor="source"><span className="field-index">INPUT</span>{fieldLabel}</label>
            <div className={`input-wrap ${conversion.error ? "has-error" : ""}`}>
              <input id="source" value={input} onChange={(event) => { setInput(event.target.value); setVerification(null); }} placeholder={placeholder} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
              {input && <button className="clear" onClick={() => { setInput(""); setVerification(null); }} aria-label="Clear input">×</button>}
            </div>
            {conversion.error ? <p className="error" role="alert">{conversion.error}</p> : <p className="hint">Processed locally. Nothing leaves your browser.</p>}
            {!input && <button className="sample" onClick={() => setInput(mode === "lnurl" ? encodeLnurl("https://example.com/.well-known/lnurlp/tong") : samples[mode])}>Try an example <span>↗</span></button>}
          </div>

          <div className={`result-pane ${conversion.result ? "ready" : ""}`}>
            {!conversion.result ? (
              <div className="empty-state"><div className="qr-ghost"><span /><span /><span /></div><p>Your conversion will<br />appear here</p></div>
            ) : (
              <div className="results">
                <div className="result-head"><span>OUTPUT</span><b>Ready to scan</b><i /></div>
                <div className="qr-card">
                  {/* Generated locally as a data URL; image optimization is neither useful nor private here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {qrDataUrl && <img src={qrDataUrl} alt="QR code containing the Bech32 LNURL" />}
                  <a className="download" href={qrDataUrl} download="lnurl-qr.png">↓ Download PNG · 1000 px</a>
                </div>
                {conversion.result.address && <OutputRow label={mode === "address" ? "Lightning Address" : "Derived Lightning Address"} value={conversion.result.address} onCopy={() => copy("address", conversion.result?.address)} copied={copied === "address"} />}
                <OutputRow label="LNURL-pay Endpoint" value={conversion.result.endpoint} onCopy={() => copy("endpoint", conversion.result?.endpoint)} copied={copied === "endpoint"} />
                <OutputRow label="Bech32 LNURL" value={conversion.result.lnurl} onCopy={() => copy("lnurl", conversion.result?.lnurl)} copied={copied === "lnurl"} mono />
                <button className="verify" onClick={verify} disabled={verifying}>{verifying ? "VERIFYING…" : "VERIFY LNURL-PAY ENDPOINT"}<span>↗</span></button>
                {verification && <Verification result={verification} />}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div><span>◎</span><p><b>100% local conversion</b>No data uploaded</p></div>
        <div><span>◇</span><p><b>Open protocol</b>Provider-agnostic</p></div>
        <div><span>⌁</span><p><b>Wallet-ready</b>Standard Bech32 LNURL</p></div>
      </section>

      <section className="learn" id="learn">
        <div className="section-copy"><span className="kicker">HOW IT WORKS</span><h2>A small address.<br />A dependable path.</h2><p>A Lightning Address is a human-readable pointer to a domain-controlled LNURL-pay endpoint. That endpoint is encoded into the QR — not a wallet provider.</p></div>
        <div className="flow">
          <FlowItem number="01" title="Public identity" value="tong@example.com" />
          <FlowItem number="02" title="Stable endpoint" value="example.com/.well-known/lnurlp/tong" />
          <FlowItem number="03" title="Bech32 + QR" value="lnurl1dp68gurn8ghj7…" />
        </div>
      </section>

      <section className="domain-section">
        <div><span className="kicker">WHY YOUR OWN DOMAIN?</span><h2>Keep the address.<br /><em>Change the engine.</em></h2></div>
        <div className="domain-copy"><p>Your public QR can stay the same while the backend changes between a wallet, Lightning service, or self-hosted node — provided the domain and endpoint remain unchanged.</p><p>This is not a guarantee of permanent availability. Your domain, DNS, HTTPS, and endpoint must continue to operate.</p></div>
      </section>

      <section className="safety">
        <div><span>◉</span><p><b>Privacy by design</b>Encoding, decoding, and QR generation happen locally. Verification contacts the endpoint only when you press Verify.</p></div>
        <div><span>!</span><p><b>Keep secrets secret</b>Never enter a seed phrase, recovery phrase, private key, or wallet password into this tool.</p></div>
      </section>

      <footer><a className="brand" href="#top"><span className="bolt">ϟ</span> LNURL <b>TOOL</b></a><p>Built on open standards · LUD-06 · LUD-16 · Bech32</p><p>No cookies. No analytics. No tracking.</p></footer>
    </main>
  );
}

function OutputRow({ label, value, onCopy, copied, mono = false }: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean }) {
  return <div className="output-row"><span>{label}</span><div><code className={mono ? "mono" : ""} title={value}>{short(value)}</code><button onClick={onCopy}>{copied ? "Copied ✓" : "Copy"}</button></div></div>;
}

function Verification({ result }: { result: { state: "valid" | "invalid" | "unreachable"; data?: LnurlPayResponse; note?: string } }) {
  return <div className={`verification ${result.state}`}><b>{result.state === "valid" ? "VALID LNURL-PAY" : result.state === "unreachable" ? "COULD NOT VERIFY FROM BROWSER" : "INVALID LNURL-PAY"}</b>{result.note && <p>{result.note}</p>}{result.data && <dl><dt>Tag</dt><dd>{result.data.tag}</dd><dt>Callback</dt><dd>{result.data.callback}</dd><dt>Minimum sendable</dt><dd>{result.data.minSendable} msat</dd><dt>Maximum sendable</dt><dd>{result.data.maxSendable} msat</dd><dt>Metadata</dt><dd>{result.data.metadata}</dd>{result.data.commentAllowed !== undefined && <><dt>Comment allowed</dt><dd>{result.data.commentAllowed}</dd></>}{result.data.allowsNostr !== undefined && <><dt>allowsNostr</dt><dd>{String(result.data.allowsNostr)}</dd></>}{result.data.nostrPubkey && <><dt>nostrPubkey</dt><dd>{result.data.nostrPubkey}</dd></>}</dl>}</div>;
}

function FlowItem({ number, title, value }: { number: string; title: string; value: string }) {
  return <div className="flow-item"><span>{number}</span><div><b>{title}</b><code>{value}</code></div><i>→</i></div>;
}
