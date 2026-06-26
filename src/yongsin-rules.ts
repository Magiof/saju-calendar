import { STEM_ELEMENT } from "./constants.ts";
import type { DayStrengthDetail } from "./strength.ts";
import type { YongsinUseDetail } from "./types.ts";

type JohuEntry = {
  primaryStems: string[];
  secondaryStems?: string[];
  reason: string;
};

const MONTHS = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"] as const;

const ELEMENT_TO_STEMS: Record<string, string[]> = {
  목: ["甲", "乙"],
  화: ["丙", "丁"],
  토: ["戊", "己"],
  금: ["庚", "辛"],
  수: ["壬", "癸"],
};

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

function entry(primaryStems: string[], secondaryStems: string[] | undefined, reason: string): JohuEntry {
  return { primaryStems, secondaryStems, reason };
}

function seasonReason(month: string, focus: string): string {
  const season =
    ["寅", "卯", "辰"].includes(month)
      ? "봄"
      : ["巳", "午", "未"].includes(month)
      ? "여름"
      : ["申", "酉", "戌"].includes(month)
      ? "가을"
      : "겨울";
  return `${season} 절기의 한서·조습을 조절하기 위해 ${focus}을(를) 우선합니다.`;
}

function buildStemTable(
  stem: string,
  overrides: Partial<Record<(typeof MONTHS)[number], JohuEntry>>,
): Record<string, JohuEntry> {
  const dayElement = STEM_ELEMENT[stem] || "목";
  const out: Record<string, JohuEntry> = {};
  for (const month of MONTHS) {
    if (overrides[month]) {
      out[month] = overrides[month]!;
      continue;
    }
    if (["亥", "子", "丑"].includes(month)) {
      out[month] = entry(
        dayElement === "화" || dayElement === "목" ? ["丙", "甲"] : ["丙", "丁"],
        dayElement === "수" ? ["戊"] : ["甲"],
        seasonReason(month, "화기와 목기"),
      );
    } else if (["巳", "午", "未"].includes(month)) {
      out[month] = entry(
        ["壬", "癸"],
        dayElement === "화" ? ["庚", "甲"] : ["甲", "庚"],
        seasonReason(month, "수기"),
      );
    } else if (["申", "酉", "戌"].includes(month)) {
      out[month] = entry(
        dayElement === "금" ? ["丁", "甲"] : ["丙", "甲"],
        ["壬"],
        seasonReason(month, "화기와 목기"),
      );
    } else {
      out[month] = entry(
        dayElement === "목" ? ["癸", "丙"] : ["甲", "庚"],
        ["癸"],
        seasonReason(month, "조열 균형"),
      );
    }
  }
  return out;
}

const JOHU_TABLE: Record<string, Record<string, JohuEntry>> = {
  甲: buildStemTable("甲", {
    子: entry(["丙", "癸"], ["庚"], seasonReason("子", "화기와 수기")),
    丑: entry(["丙", "癸"], ["庚"], seasonReason("丑", "화기와 수기")),
    寅: entry(["癸", "丙"], ["庚"], seasonReason("寅", "수기와 화기")),
    卯: entry(["癸", "丙"], ["庚"], seasonReason("卯", "수기와 화기")),
    辰: entry(["癸", "庚"], ["丙"], seasonReason("辰", "수기와 금기")),
    巳: entry(["癸", "庚"], ["丙"], seasonReason("巳", "수기")),
    午: entry(["癸", "庚"], ["丙"], seasonReason("午", "수기")),
    未: entry(["癸", "庚"], ["丙"], seasonReason("未", "수기")),
    申: entry(["丁", "庚"], ["壬"], seasonReason("申", "화기와 금기")),
    酉: entry(["丁", "庚"], ["壬"], seasonReason("酉", "화기와 금기")),
    戌: entry(["丁", "庚"], ["壬"], seasonReason("戌", "화기와 금기")),
    亥: entry(["丙", "癸"], ["庚"], seasonReason("亥", "화기와 수기")),
  }),
  乙: buildStemTable("乙", {
    子: entry(["丙", "癸"], ["戊"], seasonReason("子", "화기와 수기")),
    丑: entry(["丙", "癸"], ["戊"], seasonReason("丑", "화기와 수기")),
    寅: entry(["癸", "丙"], ["戊"], seasonReason("寅", "수기")),
    卯: entry(["癸", "丙"], ["戊"], seasonReason("卯", "수기")),
    辰: entry(["癸", "丙"], ["庚"], seasonReason("辰", "수기")),
    巳: entry(["癸", "丙"], ["庚"], seasonReason("巳", "수기")),
    午: entry(["癸", "丙"], ["庚"], seasonReason("午", "수기")),
    未: entry(["癸", "丙"], ["庚"], seasonReason("未", "수기")),
    申: entry(["丙", "癸"], ["庚"], seasonReason("申", "화기")),
    酉: entry(["丙", "癸"], ["庚"], seasonReason("酉", "화기")),
    戌: entry(["丙", "癸"], ["庚"], seasonReason("戌", "화기")),
    亥: entry(["丙", "癸"], ["戊"], seasonReason("亥", "화기")),
  }),
  丙: buildStemTable("丙", {
    子: entry(["壬", "甲"], ["戊"], seasonReason("子", "수기와 목기")),
    丑: entry(["壬", "甲"], ["戊"], seasonReason("丑", "수기와 목기")),
    寅: entry(["壬", "庚"], ["甲"], seasonReason("寅", "수기")),
    卯: entry(["壬", "庚"], ["甲"], seasonReason("卯", "수기")),
    辰: entry(["壬", "甲"], ["庚"], seasonReason("辰", "수기")),
    巳: entry(["壬", "庚"], ["甲"], seasonReason("巳", "수기")),
    午: entry(["壬", "庚"], ["甲"], seasonReason("午", "수기")),
    未: entry(["壬", "庚"], ["甲"], seasonReason("未", "수기")),
    申: entry(["壬", "甲"], ["庚"], seasonReason("申", "수기")),
    酉: entry(["壬", "甲"], ["庚"], seasonReason("酉", "수기")),
    戌: entry(["壬", "甲"], ["庚"], seasonReason("戌", "수기")),
    亥: entry(["甲", "庚"], ["壬"], seasonReason("亥", "목기와 금기")),
  }),
  丁: buildStemTable("丁", {
    子: entry(["甲", "庚"], ["丙"], seasonReason("子", "목기와 금기")),
    丑: entry(["甲", "庚"], ["丙"], seasonReason("丑", "목기와 금기")),
    寅: entry(["庚", "甲"], ["癸"], seasonReason("寅", "금기와 목기")),
    卯: entry(["庚", "甲"], ["癸"], seasonReason("卯", "금기와 목기")),
    辰: entry(["甲", "庚"], ["癸"], seasonReason("辰", "목기와 금기")),
    巳: entry(["壬", "庚"], ["癸"], seasonReason("巳", "수기")),
    午: entry(["壬", "庚"], ["癸"], seasonReason("午", "수기")),
    未: entry(["壬", "甲"], ["庚"], seasonReason("未", "수기와 목기")),
    申: entry(["甲", "庚"], ["壬"], seasonReason("申", "목기와 금기")),
    酉: entry(["甲", "丙"], ["壬"], seasonReason("酉", "목기와 화기")),
    戌: entry(["甲", "庚"], ["丙"], seasonReason("戌", "목기와 금기")),
    亥: entry(["甲", "庚"], ["丙"], seasonReason("亥", "목기와 금기")),
  }),
  戊: buildStemTable("戊", {
    子: entry(["丙", "甲"], ["癸"], seasonReason("子", "화기와 목기")),
    丑: entry(["丙", "甲"], ["癸"], seasonReason("丑", "화기와 목기")),
    寅: entry(["丙", "甲"], ["癸"], seasonReason("寅", "화기")),
    卯: entry(["丙", "甲"], ["癸"], seasonReason("卯", "화기")),
    辰: entry(["甲", "丙"], ["癸"], seasonReason("辰", "목기")),
    巳: entry(["癸", "丙"], ["甲"], seasonReason("巳", "수기")),
    午: entry(["癸", "丙"], ["甲"], seasonReason("午", "수기")),
    未: entry(["癸", "丙"], ["甲"], seasonReason("未", "수기")),
    申: entry(["丙", "癸"], ["甲"], seasonReason("申", "화기")),
    酉: entry(["丙", "癸"], ["甲"], seasonReason("酉", "화기")),
    戌: entry(["甲", "丙"], ["癸"], seasonReason("戌", "목기")),
    亥: entry(["丙", "甲"], ["癸"], seasonReason("亥", "화기")),
  }),
  己: buildStemTable("己", {
    子: entry(["丙", "甲"], ["癸"], seasonReason("子", "화기")),
    丑: entry(["丙", "甲"], ["癸"], seasonReason("丑", "화기")),
    寅: entry(["丙", "癸"], ["甲"], seasonReason("寅", "화기")),
    卯: entry(["丙", "癸"], ["甲"], seasonReason("卯", "화기")),
    辰: entry(["丙", "癸"], ["甲"], seasonReason("辰", "화기")),
    巳: entry(["癸", "丙"], ["甲"], seasonReason("巳", "수기")),
    午: entry(["癸", "丙"], ["甲"], seasonReason("午", "수기")),
    未: entry(["癸", "丙"], ["甲"], seasonReason("未", "수기")),
    申: entry(["丙", "癸"], ["甲"], seasonReason("申", "화기")),
    酉: entry(["丙", "癸"], ["甲"], seasonReason("酉", "화기")),
    戌: entry(["丙", "甲"], ["癸"], seasonReason("戌", "화기")),
    亥: entry(["丙", "甲"], ["癸"], seasonReason("亥", "화기")),
  }),
  庚: buildStemTable("庚", {
    子: entry(["丁", "甲"], ["丙"], seasonReason("子", "화기와 목기")),
    丑: entry(["丁", "甲"], ["丙"], seasonReason("丑", "화기와 목기")),
    寅: entry(["丙", "壬"], ["甲"], seasonReason("寅", "화기와 수기")),
    卯: entry(["丁", "甲"], ["壬"], seasonReason("卯", "화기")),
    辰: entry(["甲", "壬"], ["丁"], seasonReason("辰", "목기와 수기")),
    巳: entry(["壬", "戊"], ["丁"], seasonReason("巳", "수기")),
    午: entry(["壬", "癸"], ["丁"], seasonReason("午", "수기")),
    未: entry(["壬", "癸"], ["丁"], seasonReason("未", "수기")),
    申: entry(["丁", "甲"], ["壬"], seasonReason("申", "화기")),
    酉: entry(["丁", "甲"], ["壬"], seasonReason("酉", "화기")),
    戌: entry(["甲", "壬"], ["丁"], seasonReason("戌", "목기")),
    亥: entry(["丁", "甲"], ["丙"], seasonReason("亥", "화기")),
  }),
  辛: buildStemTable("辛", {
    子: entry(["丙", "壬"], ["甲"], seasonReason("子", "화기와 수기")),
    丑: entry(["丙", "壬"], ["甲"], seasonReason("丑", "화기와 수기")),
    寅: entry(["壬", "甲"], ["丙"], seasonReason("寅", "수기")),
    卯: entry(["壬", "甲"], ["丙"], seasonReason("卯", "수기")),
    辰: entry(["壬", "甲"], ["丙"], seasonReason("辰", "수기")),
    巳: entry(["壬", "癸"], ["甲"], seasonReason("巳", "수기")),
    午: entry(["壬", "癸"], ["甲"], seasonReason("午", "수기")),
    未: entry(["壬", "癸"], ["甲"], seasonReason("未", "수기")),
    申: entry(["壬", "甲"], ["丙"], seasonReason("申", "수기")),
    酉: entry(["壬", "甲"], ["丙"], seasonReason("酉", "수기")),
    戌: entry(["壬", "甲"], ["丙"], seasonReason("戌", "수기")),
    亥: entry(["丙", "壬"], ["甲"], seasonReason("亥", "화기")),
  }),
  壬: buildStemTable("壬", {
    子: entry(["戊", "丙"], ["甲"], seasonReason("子", "토기와 화기")),
    丑: entry(["丙", "甲"], ["戊"], seasonReason("丑", "화기")),
    寅: entry(["庚", "丙"], ["甲"], seasonReason("寅", "금기")),
    卯: entry(["庚", "戊"], ["丙"], seasonReason("卯", "금기")),
    辰: entry(["甲", "庚"], ["丙"], seasonReason("辰", "목기")),
    巳: entry(["庚", "辛"], ["癸"], seasonReason("巳", "금기")),
    午: entry(["庚", "癸"], ["辛"], seasonReason("午", "금기")),
    未: entry(["辛", "甲"], ["庚"], seasonReason("未", "금기")),
    申: entry(["戊", "丁"], ["甲"], seasonReason("申", "토기")),
    酉: entry(["甲", "戊"], ["丙"], seasonReason("酉", "목기")),
    戌: entry(["甲", "丙"], ["戊"], seasonReason("戌", "목기")),
    亥: entry(["戊", "丙"], ["甲"], seasonReason("亥", "토기")),
  }),
  癸: buildStemTable("癸", {
    子: entry(["丙", "戊"], ["甲"], seasonReason("子", "화기")),
    丑: entry(["丙", "甲"], ["戊"], seasonReason("丑", "화기")),
    寅: entry(["辛", "丙"], ["甲"], seasonReason("寅", "금기")),
    卯: entry(["庚", "辛"], ["丙"], seasonReason("卯", "금기")),
    辰: entry(["丙", "甲"], ["庚"], seasonReason("辰", "화기")),
    巳: entry(["辛", "庚"], ["癸"], seasonReason("巳", "금기")),
    午: entry(["庚", "辛"], ["癸"], seasonReason("午", "금기")),
    未: entry(["庚", "辛"], ["癸"], seasonReason("未", "금기")),
    申: entry(["丁", "甲"], ["庚"], seasonReason("申", "화기")),
    酉: entry(["丙", "丁"], ["甲"], seasonReason("酉", "화기")),
    戌: entry(["甲", "丙"], ["庚"], seasonReason("戌", "목기")),
    亥: entry(["戊", "丙"], ["甲"], seasonReason("亥", "토기")),
  }),
};

function stemsForElement(element: string, baseYongsin: string[]): string[] {
  const stems = ELEMENT_TO_STEMS[element] || [];
  const preferred = baseYongsin.filter((stem) => STEM_ELEMENT[stem] === element);
  return preferred.length ? preferred : stems;
}

function buildYongsinUse(
  element: string,
  stems: string[],
  reason: string,
  priority: "primary" | "secondary",
): YongsinUseDetail {
  return {
    element,
    stems,
    reason,
    priority,
    source: "궁통보감",
  };
}

export function selectJohuYongsin(args: {
  dayStem: string;
  monthBranch: string;
  baseYongsin: string[];
}): YongsinUseDetail | null {
  const table = JOHU_TABLE[args.dayStem];
  const entry = table?.[args.monthBranch];
  if (!entry) return null;

  const primaryElement = STEM_ELEMENT[entry.primaryStems[0]] || "목";
  const preferredFromBase = stemsForElement(primaryElement, args.baseYongsin);
  const primaryStems = preferredFromBase.length
    ? preferredFromBase
    : entry.primaryStems.filter((stem) => STEM_ELEMENT[stem] === primaryElement);

  return buildYongsinUse(
    primaryElement,
    primaryStems.length ? primaryStems : stemsForElement(primaryElement, args.baseYongsin),
    entry.reason,
    "primary",
  );
}

export function selectEokbuYongsin(args: {
  dayStem: string;
  dayStrength: "strong" | "weak" | "neutral";
  dayStrengthDetail: DayStrengthDetail;
  fiveElements: Record<string, number>;
  baseYongsin: string[];
}): YongsinUseDetail {
  const dayElement = STEM_ELEMENT[args.dayStem];
  const supportElement = Object.entries(GENERATES).find(([, generated]) => generated === dayElement)?.[0] || dayElement;
  const drainElement = GENERATES[dayElement] || dayElement;
  const controlElement = CONTROLS[dayElement] || dayElement;
  const sameElement = dayElement;

  let element = supportElement;
  let reason = "약한 일간을 생조하는 오행으로 보완합니다.";

  if (args.dayStrengthDetail.jonggyeokCandidate === "strong") {
    element = args.dayStrengthDetail.drainPressure <= args.dayStrengthDetail.controlPressure ? drainElement : controlElement;
    reason = "종강 후보 명식으로 설기·극제 오행을 우선합니다.";
  } else if (args.dayStrength === "strong") {
    element =
      (args.fiveElements[drainElement] || 0) <= (args.fiveElements[controlElement] || 0) ? drainElement : controlElement;
    reason = "강한 일간의 기운을 식상·재성 또는 관성으로 조절합니다.";
  } else if (
    args.dayStrength === "weak" ||
    (!args.dayStrengthDetail.deukryeong && !args.dayStrengthDetail.deukji)
  ) {
    if ((args.fiveElements[supportElement] || 0) <= (args.fiveElements[sameElement] || 0)) {
      element = supportElement;
      reason = "득령·득지가 부족해 인성·비겁 생조 오행을 보완합니다.";
    } else {
      element = sameElement;
      reason = "통근은 있으나 세력이 약해 비겁 오행을 보완합니다.";
    }
  } else if (args.dayStrength === "neutral") {
    const weakest = Object.entries(args.fiveElements).sort((a, b) => a[1] - b[1])[0]?.[0];
    element = weakest && weakest !== dayElement ? weakest : supportElement;
    reason = "중화권 명식에서 부족하거나 병이 되는 오행을 보완합니다.";
  }

  return buildYongsinUse(
    element,
    stemsForElement(element, args.baseYongsin),
    reason,
    "primary",
  );
}

export function selectYongsinDetail(args: {
  dayStem: string;
  monthBranch: string;
  dayStrength: "strong" | "weak" | "neutral";
  dayStrengthDetail: DayStrengthDetail;
  fiveElements: Record<string, number>;
  baseYongsin: string[];
}): { johu: YongsinUseDetail | null; eokbu: YongsinUseDetail } {
  return {
    johu: selectJohuYongsin({
      dayStem: args.dayStem,
      monthBranch: args.monthBranch,
      baseYongsin: args.baseYongsin,
    }),
    eokbu: selectEokbuYongsin(args),
  };
}
