/**
 * Astro loads `.env` into `import.meta.env`, while hosts (Cloudflare Pages, CI)
 * put build variables into `process.env`. Read both so a local build and the
 * real build behave identically — a mismatch here shows up as "works on my
 * machine, empty site in production".
 */
export function readEnv(name: string): string | undefined {
  const fromVite = (import.meta.env as Record<string, unknown>)[name];
  if (typeof fromVite === 'string' && fromVite.length > 0) return fromVite;

  const fromNode = process.env[name];
  if (typeof fromNode === 'string' && fromNode.length > 0) return fromNode;

  return undefined;
}
