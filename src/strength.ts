import { BRANCH_ELEMENT, BRANCH_HIDDEN_STEMS, STEM_ELEMENT, TEN_GODS } from "./constants.ts";
import type { PillarDetail, PillarKey } from "./types.ts";

const PILLAR_KEYS: readonly PillarKey[] = ["hour", "day", "month", "year"];

const SUPPORT_GODS = new Set(["비견", "겁재", "정인", "편인"]);
const DRAIN_GODS = new Set(["식신", "상관", "정재", "편재"]);
const CONTROL_GODS = new Set(["정관", "편관"]);

const GENERATES: Record<string, string> = {
  목: "화",
  화: "토",
  토: "금",
  금: "수",
  수: "목",
};

const CONTROLS: Record<string, string> = {
  목: "토",
  화: "금",
  토: "수",
  금: "목",
  수: "화",
};

const STRONG_STAGES = new Set(["장생", "건록", "제왕", "관대"]);
const WEAK_STAGES = new Set(["사", "묘", "절", "병"]);

export type DayStrengthDetail = {
  deukryeong: boolean;
  deukji: boolean;
  deukse: boolean;
  deuksi: boolean;
  rootStrength: number;
  drainPressure: number;
  controlPressure: number;
  supportPressure: number;
  jonggyeokCandidate: "strong" | "weak" | null;
};

export type DayStrengthResult = {
  strength: "strong" | "weak" | "neutral";
  score: number;
  detail: DayStrengthDetail;
};

type StrengthContext = {
  dayStem: string;
  monthBranch: string;
  hourBranch: string;
  pillarDetails: Record<PillarKey, PillarDetail>;
  tenGods: Record<PillarKey, { stem: string; branch: string }>;
  fiveElements: Record<string, number>;
  get12Stage: (dayStem: string, branch: string) => string;
};

function getTenGod(dayStem: string, otherStem: string): string {
  return TEN_GODS[dayStem]?.[otherStem] || "";
}

function hiddenStemsForBranch(branch: string): string[] {
  const hidden = BRANCH_HIDDEN_STEMS[branch];
  if (!hidden) return [];
  return [hidden.여기, hidden.중기, hidden.정기].filter((stem): stem is string => Boolean(stem));
}

function hasRoot(dayStem: string, branch: string): boolean {
  const dayElement = STEM_ELEMENT[dayStem];
  return hiddenStemsForBranch(branch).some((stem) => {
    if (stem === dayStem) return true;
    return STEM_ELEMENT[stem] === dayElement;
  });
}

function rootScore(dayStem: string, pillarDetails: Record<PillarKey, PillarDetail>): number {
  let score = 0;
  for (const key of PILLAR_KEYS) {
    const detail = pillarDetails[key];
    if (hasRoot(dayStem, detail.branch)) score += key === "day" ? 18 : key === "month" ? 14 : 10;
    if (detail.stem === dayStem) score += 8;
  }
  return Math.min(100, score);
}

function countGodPressure(
  dayStem: string,
  pillarDetails: Record<PillarKey, PillarDetail>,
  tenGods: Record<PillarKey, { stem: string; branch: string }>,
  target: Set<string>,
): number {
  let pressure = 0;
  for (const key of PILLAR_KEYS) {
    if (key === "day") continue;
    const stemGod = tenGods[key].stem;
    const branchGod = tenGods[key].branch;
    if (target.has(stemGod)) pressure += 12;
    if (target.has(branchGod)) pressure += 10;
    for (const hidden of hiddenStemsForBranch(pillarDetails[key].branch)) {
      const hiddenGod = getTenGod(dayStem, hidden);
      if (target.has(hiddenGod)) pressure += 4;
    }
  }
  return Math.min(100, pressure);
}

function isSeasonSupport(dayElement: string, monthBranch: string, monthStage: string): boolean {
  const monthElement = BRANCH_ELEMENT[monthBranch];
  const supportElement = Object.entries(GENERATES).find(([, generated]) => generated === dayElement)?.[0];
  if (monthElement === dayElement) return true;
  if (supportElement && monthElement === supportElement) return true;
  return STRONG_STAGES.has(monthStage);
}

function isDayBranchSupport(dayStem: string, dayBranch: string, monthStage: string): boolean {
  if (hasRoot(dayStem, dayBranch)) return true;
  return STRONG_STAGES.has(monthStage);
}

function isDeukse(dayStem: string, pillarDetails: Record<PillarKey, PillarDetail>, tenGods: Record<PillarKey, { stem: string; branch: string }>): boolean {
  let support = 0;
  for (const key of PILLAR_KEYS) {
    if (key === "day") continue;
    const stemGod = tenGods[key].stem;
    const branchGod = tenGods[key].branch;
    if (SUPPORT_GODS.has(stemGod)) support += 1;
    if (SUPPORT_GODS.has(branchGod)) support += 1;
  }
  return support >= 2;
}

function isDeuksi(dayStem: string, hourBranch: string, get12Stage: (dayStem: string, branch: string) => string): boolean {
  const hourStage = get12Stage(dayStem, hourBranch);
  if (hasRoot(dayStem, hourBranch)) return true;
  return STRONG_STAGES.has(hourStage);
}

export function calculateDayStrengthDetailed(ctx: StrengthContext): DayStrengthResult {
  const dayElement = STEM_ELEMENT[ctx.dayStem];
  if (!dayElement) {
    return {
      strength: "neutral",
      score: 50,
      detail: {
        deukryeong: false,
        deukji: false,
        deukse: false,
        deuksi: false,
        rootStrength: 0,
        drainPressure: 0,
        controlPressure: 0,
        supportPressure: 0,
        jonggyeokCandidate: null,
      },
    };
  }

  const monthStage = ctx.get12Stage(ctx.dayStem, ctx.monthBranch);
  const dayStage = ctx.get12Stage(ctx.dayStem, ctx.pillarDetails.day.branch);

  const deukryeong = isSeasonSupport(dayElement, ctx.monthBranch, monthStage);
  const deukji = isDayBranchSupport(ctx.dayStem, ctx.pillarDetails.day.branch, dayStage);
  const deukse = isDeukse(ctx.dayStem, ctx.pillarDetails, ctx.tenGods);
  const deuksi = isDeuksi(ctx.dayStem, ctx.hourBranch, ctx.get12Stage);

  const rootStrength = rootScore(ctx.dayStem, ctx.pillarDetails);
  const drainPressure = countGodPressure(ctx.dayStem, ctx.pillarDetails, ctx.tenGods, DRAIN_GODS);
  const controlPressure = countGodPressure(ctx.dayStem, ctx.pillarDetails, ctx.tenGods, CONTROL_GODS);
  const supportPressure = countGodPressure(ctx.dayStem, ctx.pillarDetails, ctx.tenGods, SUPPORT_GODS);

  const supportElement = Object.entries(GENERATES).find(([, generated]) => generated === dayElement)?.[0];
  const attackElement = CONTROLS[dayElement];

  let score = 50;
  const monthElement = BRANCH_ELEMENT[ctx.monthBranch];
  if (monthElement === dayElement) score += 20;
  score += (ctx.fiveElements[dayElement] || 0) * 10;
  if (supportElement) score += (ctx.fiveElements[supportElement] || 0) * 8;
  if (attackElement) score -= (ctx.fiveElements[attackElement] || 0) * 8;
  if (monthStage === "건록" || monthStage === "제왕") score += 15;
  if (monthStage === "사" || monthStage === "절" || monthStage === "묘") score -= 15;

  if (deukryeong) score += 4;
  if (deukji) score += 3;
  if (deukse) score += 3;
  if (deuksi) score += 2;
  if (rootStrength >= 50) score += 4;
  if (drainPressure >= 55) score -= 4;
  if (controlPressure >= 55) score -= 4;
  if (supportPressure >= 55) score += 4;

  score = Math.max(0, Math.min(100, score));

  let strength: "strong" | "weak" | "neutral" = "neutral";
  if (score >= 70) strength = "strong";
  else if (score <= 30) strength = "weak";

  let jonggyeokCandidate: "strong" | "weak" | null = null;
  if (score >= 88 && drainPressure + controlPressure < 30 && deukryeong && deukse) {
    jonggyeokCandidate = "strong";
  }
  if (score <= 15 && supportPressure < 20 && !deukryeong && !deukji) {
    jonggyeokCandidate = "weak";
  }

  return {
    strength,
    score,
    detail: {
      deukryeong,
      deukji,
      deukse,
      deuksi,
      rootStrength,
      drainPressure,
      controlPressure,
      supportPressure,
      jonggyeokCandidate,
    },
  };
}
