/** repo-radar — Org health: stale PRs, bus factor, hot paths. Author: zAx4hub */
export type PR = { id: string; title: string; ageDays: number; author: string };
export type Commit = { file: string; author: string; at: string };
export type Report = {
  project: string;
  author: string;
  summary: string;
  score: number;
  findings: Array<Record<string, unknown>>;
  metrics: Record<string, number>;
};

const AUTHOR = "zAx4hub";

export function stalePrs(prs: PR[], staleAfterDays = 7): PR[] {
  return prs.filter((p) => p.ageDays >= staleAfterDays).sort((a, b) => b.ageDays - a.ageDays);
}

export function busFactor(commits: Commit[]): { authors: number; topShare: number; factor: number } {
  const counts = new Map<string, number>();
  for (const c of commits) counts.set(c.author, (counts.get(c.author) ?? 0) + 1);
  const total = commits.length || 1;
  const shares = [...counts.values()].map((n) => n / total).sort((a, b) => b - a);
  const topShare = shares[0] ?? 1;
  let acc = 0;
  let factor = 0;
  for (const s of shares) {
    acc += s;
    factor++;
    if (acc >= 0.5) break;
  }
  return { authors: counts.size, topShare: Math.round(topShare * 1000) / 1000, factor: Math.max(1, factor) };
}

export function hotPaths(commits: Commit[], limit = 5): Array<{ file: string; touches: number }> {
  const m = new Map<string, number>();
  for (const c of commits) m.set(c.file, (m.get(c.file) ?? 0) + 1);
  return [...m.entries()]
    .map(([file, touches]) => ({ file, touches }))
    .sort((a, b) => b.touches - a.touches)
    .slice(0, limit);
}

export function healthScore(stale: number, factor: number, hot: number): number {
  const stalePen = Math.min(0.5, stale * 0.08);
  const busPen = factor <= 1 ? 0.25 : factor === 2 ? 0.1 : 0;
  const churnPen = Math.min(0.2, Math.max(0, hot - 8) * 0.02);
  return Math.round((1 - stalePen - busPen - churnPen) * 1000) / 1000;
}

export function run(input: { prs?: PR[]; commits?: Commit[]; staleAfterDays?: number } = {}): Report {
  const prs =
    input.prs ??
    [
      { id: "1", title: "Add auth", ageDays: 12, author: "a" },
      { id: "2", title: "Docs", ageDays: 2, author: "b" },
      { id: "3", title: "Refactor", ageDays: 20, author: "a" },
    ];
  const commits =
    input.commits ??
    [
      { file: "src/auth.ts", author: "a", at: "2026-01-01" },
      { file: "src/auth.ts", author: "a", at: "2026-01-02" },
      { file: "src/auth.ts", author: "b", at: "2026-01-03" },
      { file: "src/billing.ts", author: "a", at: "2026-01-04" },
      { file: "README.md", author: "c", at: "2026-01-05" },
    ];
  const stale = stalePrs(prs, input.staleAfterDays ?? 7);
  const bus = busFactor(commits);
  const hot = hotPaths(commits);
  const score = healthScore(stale.length, bus.factor, hot[0]?.touches ?? 0);
  const findings = [
    ...stale.map((p) => ({
      id: `pr-${p.id}`,
      text: `stale PR: ${p.title} (${p.ageDays}d)`,
      score: Math.max(0, 1 - p.ageDays / 30),
      tag: "stale",
    })),
    {
      id: "bus",
      text: `bus factor=${bus.factor} authors=${bus.authors} topShare=${bus.topShare}`,
      score: Math.min(1, bus.factor / 3),
      tag: bus.factor <= 1 ? "risk" : "ok",
    },
    ...hot.map((h) => ({
      id: h.file,
      text: `hot path ${h.file} touches=${h.touches}`,
      score: Math.min(1, h.touches / 10),
      tag: "hot",
    })),
  ];
  return {
    project: "repo-radar",
    author: AUTHOR,
    summary: `Health=${score}; stale=${stale.length}; bus=${bus.factor}; hot=${hot[0]?.file ?? "-"}`,
    score,
    findings,
    metrics: { stale: stale.length, busFactor: bus.factor, authors: bus.authors, hotFiles: hot.length },
  };
}

export function demo(): Report {
  return run();
}

export function inspect() {
  return {
    name: "repo-radar",
    author: AUTHOR,
    oneLiner: "Org health: stale PRs, bus factor, hot paths",
    features: ["stale PRs", "bus factor", "hot paths", "health score"],
    version: "0.1.0",
    commands: ["demo", "run", "inspect"],
  };
}

export function similarity(a: string, b: string): number {
  return a === b ? 1 : 0;
}
export function rank(text: string): number {
  return Math.min(1, text.length / 80);
}
