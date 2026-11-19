// Contraste de cores (WCAG 2.x): usado para conferir a paleta do site no teste src/lib/contraste.test.ts.

function canal(valor: number): number {
  const c = valor / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminância relativa de uma cor "#rrggbb" (0 = preto, 1 = branco). */
export function luminancia(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Cor inválida: ${hex}`);
  const n = parseInt(m[1], 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}

/** Razão de contraste entre duas cores, de 1 (iguais) a 21 (preto e branco). A ordem não importa. */
export function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

/** Lê as cores "--nome: #rrggbb;" declaradas em :root de um arquivo CSS. */
export function lerCoresDoCss(css: string): Record<string, string> {
  const raiz = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const cores: Record<string, string> = {};
  for (const m of raiz.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) cores[m[1]] = m[2];
  return cores;
}
