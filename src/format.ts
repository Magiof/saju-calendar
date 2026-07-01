import type { PillarKey, SajuResult } from "./types.ts";

const PILLAR_KEYS: PillarKey[] = ["hour", "day", "month", "year"];
const PILLAR_KO: Record<PillarKey, string> = { hour: "시주", day: "일주", month: "월주", year: "연주" };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function yinYangSign(v: string): string {
  return v === "양" ? "+" : "-";
}

function compactPillarToken(data: SajuResult, key: PillarKey, part: "stem" | "branch"): string {
  const p = data.pillarDetails[key];
  if (part === "stem") return `${p.stem}(${p.stemKo})${p.element.stem}${yinYangSign(p.yinYang.stem)}`;
  return `${p.branch}(${p.branchKo})${p.element.branch}${yinYangSign(p.yinYang.branch)}`;
}

function compactHidden(data: SajuResult, key: PillarKey): string {
  const h = data.pillarDetails[key].hiddenStems;
  const hKo = data.pillarDetails[key].hiddenStemsKo;
  return (["여기", "중기", "정기"] as const)
    .map((position) => (h[position] ? `${h[position]}(${hKo[position]})` : "-"))
    .join(",");
}

function compactRow(label: string, values: string[]): string {
  return `${label} ${values.join(" | ")}`;
}

const BRANCH_REL_KEYS = ["방합", "삼합", "반합", "육합", "충", "형", "파", "해", "원진", "귀문"] as const;

function splitTokens(text: string): string[] {
  return text
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function collectRelationText(group: Record<string, string | undefined>): string {
  const uniq = new Set<string>();
  for (const raw of Object.values(group)) {
    if (!raw) continue;
    for (const token of splitTokens(raw)) {
      uniq.add(token);
    }
  }
  return Array.from(uniq).join(", ");
}

function countElementsByStemBranch(data: SajuResult): { stem: Record<string, number>; branch: Record<string, number> } {
  const stem: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const branch: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const k of PILLAR_KEYS) {
    const p = data.pillarDetails[k];
    if (p.element.stem) stem[p.element.stem]++;
    if (p.element.branch) branch[p.element.branch]++;
  }
  return { stem, branch };
}

function formatDayStrengthMetrics(data: SajuResult): string {
  const d = data.advanced.dayStrengthDetail;
  const jong =
    d.jonggyeokCandidate === "strong"
      ? "종왕후보"
      : d.jonggyeokCandidate === "weak"
        ? "종약후보"
        : "종격없음";
  return [
    `득령${d.deukryeong ? "O" : "X"}`,
    `득지${d.deukji ? "O" : "X"}`,
    `득세${d.deukse ? "O" : "X"}`,
    `득시${d.deuksi ? "O" : "X"}`,
    `통근${d.rootStrength}`,
    `설기${d.drainPressure}`,
    `극제${d.controlPressure}`,
    `부력${d.supportPressure}`,
    jong,
  ].join(" ");
}

/** 만세력·LLM용 압축 텍스트 (해석 라벨 + 일간지표, 신살은 길흉 구분 없음) */
export function generateCompactText(data: SajuResult): string {
  const lines: string[] = [];
  const currentYear = data.currentYear;
  const dayDetail = data.pillarDetails.day;
  const pillarKeys = PILLAR_KEYS;
  const strengthChar = data.advanced.dayStrength.strength === "strong" ? "강" : data.advanced.dayStrength.strength === "weak" ? "약" : "중";

  const calendarKo = data.input.calendar === "solar" ? "양력" : "음력";

  lines.push(`## 기본`);
  lines.push(`${data.input.year}.${pad2(data.input.month)}.${pad2(data.input.day)} ${pad2(data.input.hour)}:${pad2(data.input.minute)} ${data.input.gender} ${calendarKo} ${data.input.timezone} 만 ${data.currentAge}세`);
  const johu = data.advanced.yongsinDetail.johu;
  const eokbu = data.advanced.yongsinDetail.eokbu;
  const yongsinParts = [
    `용신: ${data.advanced.yongsin.join(", ") || "-"}`,
    johu ? `조후 ${johu.element}(${johu.stems.join(",")})` : "",
    eokbu ? `억부 ${eokbu.element}(${eokbu.stems.join(",")})` : "",
  ].filter(Boolean);
  lines.push(`일간 ${data.dayStem}(${dayDetail.stemKo})${dayDetail.element.stem}${yinYangSign(dayDetail.yinYang.stem)} 강약: ${strengthChar}(${data.advanced.dayStrength.score}) 격: ${data.advanced.geukguk} ${yongsinParts.join(" ")}`);
  if (data.normalized.localMeanTime) {
    const lmt = data.normalized.localMeanTime;
    lines.push(
      `LMT ${lmt.year}-${pad2(lmt.month)}-${pad2(lmt.day)} ${pad2(lmt.hour)}:${pad2(lmt.minute)} (경도 ${lmt.longitude.toFixed(3)}° ${lmt.offsetMinutes >= 0 ? "+" : ""}${lmt.offsetMinutes.toFixed(1)}분)`,
    );
  }
  lines.push(`일간지표 ${formatDayStrengthMetrics(data)}`);

  lines.push("");
  lines.push("## 원국");
  lines.push(compactRow("", ["시", "일", "월", "연"]));
  lines.push(compactRow("干", pillarKeys.map((k) => compactPillarToken(data, k, "stem"))));
  lines.push(compactRow("支", pillarKeys.map((k) => compactPillarToken(data, k, "branch"))));
  lines.push(compactRow("장간", pillarKeys.map((k) => compactHidden(data, k))));
  lines.push(compactRow("干성", pillarKeys.map((k) => data.tenGods[k].stem)));
  lines.push(compactRow("支성", pillarKeys.map((k) => data.tenGods[k].branch)));
  lines.push(compactRow("봉12", pillarKeys.map((k) => data.stages12.bong[k])));
  lines.push(compactRow("거12", pillarKeys.map((k) => data.stages12.geo[k])));
  lines.push(compactRow("12살", pillarKeys.map((k) => data.sals[k].twelveSal)));
  lines.push(compactRow("신살", pillarKeys.map((k) => data.sals[k].specialSals.join(",") || "-")));

  const el = countElementsByStemBranch(data);
  const fmtEl = (r: Record<string, number>) => `목${r["목"]} 화${r["화"]} 토${r["토"]} 금${r["금"]} 수${r["수"]}`;
  lines.push("");
  lines.push("## 오행");
  lines.push(`干: ${fmtEl(el.stem)} | 支: ${fmtEl(el.branch)} | 계: ${fmtEl(data.fiveElements)}`);
  lines.push(`공망 ${data.gongmang.branches[0]}(${data.gongmang.branchesKo[0]}) ${data.gongmang.branches[1]}(${data.gongmang.branchesKo[1]})`);
  if (data.advanced.sinsal.names.length) {
    lines.push(`신살 ${data.advanced.sinsal.names.join(", ")}`);
  }
  const tierParts: string[] = [];
  if (data.advanced.sinsalDetail.core.length) {
    tierParts.push(`core ${data.advanced.sinsalDetail.core.join(",")}`);
  }
  if (data.advanced.sinsalDetail.secondary.length) {
    tierParts.push(`secondary ${data.advanced.sinsalDetail.secondary.join(",")}`);
  }
  if (tierParts.length) {
    lines.push(`신살중요도 ${tierParts.join(" | ")}`);
  }

  const relParts: string[] = [];
  const stemHap = data.stemRelations.filter((r) => r.type === "합");
  const stemChung = data.stemRelations.filter((r) => r.type === "충");
  if (stemHap.length) relParts.push(`干합: ${stemHap.map((r) => r.desc.replace(/ 합/, "")).join("; ")}`);
  if (stemChung.length) relParts.push(`干충: ${stemChung.map((r) => r.desc.replace(/ 충/, "")).join("; ")}`);
  for (const key of BRANCH_REL_KEYS) {
    const text = collectRelationText(data.branchRelations[key]);
    if (text) relParts.push(`${key}: ${text.replaceAll(` ${key}`, "")}`);
  }
  lines.push("");
  lines.push("## 관계");
  lines.push(relParts.join(" | ") || "없음");

  lines.push("");
  const dirKo = data.daeun.basis.direction === "forward" ? "순행" : "역행";
  let daeunHead = `## 대운 ${dirKo} 시작 ${data.daeun.startAge}세`;
  if (data.daeun.current) {
    const rem = data.daeun.current.endAge - data.currentAge;
    daeunHead += ` 현재 ★${data.daeun.current.ganzhi}(${data.daeun.current.startAge}~${data.daeun.current.endAge} 잔여 ${rem}년)`;
  }
  lines.push(daeunHead);
  for (const item of data.daeun.list) {
    const mark = data.daeun.current && item.age_range === data.daeun.current.age_range ? "★" : " ";
    const sal = item.sal.length ? item.sal.join(",") : "-";
    lines.push(`${mark}${item.startAge}(${item.startYear}) ${item.ganzhi} ${item.stemTenGod}/${item.branchTenGod} ${item.stage12} ${sal}`);
  }

  lines.push("");
  lines.push(`## 세운 ${currentYear} 기준`);
  for (const s of data.seyun) {
    const mark = s.year === currentYear ? "★" : " ";
    lines.push(`${mark}${s.year} ${s.ganzhi} ${s.tenGodStem}/${s.tenGodBranch} ${s.stage12}`);
  }

  lines.push("");
  lines.push(`## 월운 ${currentYear}`);
  for (const w of data.wolun) {
    lines.push(`${w.month}월 ${w.ganzhi} ${w.stemTenGod}/${w.branchTenGod} ${w.stage12}`);
  }

  const c = data.reference.codes;
  lines.push("");
  lines.push("## 만세력");
  lines.push(`이달 ${c.thisMonth} 다음 ${c.nextMonth} 오늘 ${c.today} 내일 ${c.tomorrow} (${data.reference.now.split(" ")[0]})`);

  return lines.join("\n");
}
