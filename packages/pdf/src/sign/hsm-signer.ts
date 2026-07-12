import type { PdfSigner } from "./pdf-signer.js";

export interface HsmSignerOptions {
  /**
   * Endpoint of the air-gapped HSM signing appliance. It receives the
   * unsigned PDF/A-3 and returns the PAdES-signed bytes. The appliance holds
   * Rocky's signing key and runs the seal itself — this server never sees
   * key material.
   *
   * Must be an absolute `https://` URL. If `trustedHosts` (or the
   * `ROCKY_HSM_TRUSTED_HOSTS` env, comma-separated) is set, the host must be
   * in the allowlist (defense against SSRF / config tampering).
   */
  endpoint: string;
  /** Optional auth headers (mTLS token, HMAC, etc.) to the appliance. */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default 30s). */
  timeoutMs?: number;
  /** Allowlist of trusted HSM hosts (overrides `ROCKY_HSM_TRUSTED_HOSTS`). */
  trustedHosts?: string[];
}

/**
 * Resolve the trusted-host allowlist for the HSM endpoint.
 * Precedence: explicit option → `ROCKY_HSM_TRUSTED_HOSTS` env → empty (any host).
 */
function resolveTrustedHosts(option?: string[]): string[] {
  if (option && option.length > 0) return option;
  const env = process.env.ROCKY_HSM_TRUSTED_HOSTS;
  if (!env) return [];
  return env
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h.length > 0);
}

/**
 * Validate the HSM endpoint URL: absolute, https-only, and (when an allowlist
 * is configured) the host must be on it. Throws on any violation — this is the
 * SSRF guard for the outbound fetch.
 */
function validateEndpoint(endpoint: string, trustedHosts: string[]): URL {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error(`Invalid HSM endpoint (not a URL): ${endpoint}`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`HSM endpoint must use https (got ${url.protocol}): ${endpoint}`);
  }
  if (trustedHosts.length > 0) {
    const host = url.host.toLowerCase();
    const allowed = trustedHosts.some(
      (h) => h === host || host.endsWith(`.${h}`),
    );
    if (!allowed) {
      throw new Error(`HSM endpoint host not in trusted allowlist: ${host}`);
    }
  }
  return url;
}

/**
 * HsmSigner — delegates the entire PAdES seal to an air-gapped HSM appliance.
 *
 * This is the production signer (ADR-0082 §2): the key is generated and used
 * inside the HSM and never leaves it. The PDF-generation server sends the
 * unsigned PDF/A-3 over an authenticated channel and receives the signed
 * buffer back. No key material is ever resident here.
 */
export class HsmSigner implements PdfSigner {
  readonly name = "hsm";
  private readonly endpoint: URL;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(options: HsmSignerOptions) {
    const trustedHosts = resolveTrustedHosts(options.trustedHosts);
    this.endpoint = validateEndpoint(options.endpoint, trustedHosts);
    this.headers = options.headers ?? {};
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  async sign(pdf: Uint8Array): Promise<Uint8Array> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/pdf",
        ...this.headers,
      },
      body: Buffer.from(pdf),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new Error(`HSM sign failed: ${response.status} ${detail}`);
    }
    const buf = Buffer.from(await response.arrayBuffer());
    return new Uint8Array(buf);
  }
}
