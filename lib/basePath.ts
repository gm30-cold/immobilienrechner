/**
 * basePath-aware URL-Builder. Nötig weil wir als static export unter
 * /<repo>/ auf GitHub Pages deployen — aber in dev leer.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prepend basePath zu einem absoluten App-Pfad (beginnt mit /). */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${BASE_PATH}${path}`;
}
