export type SinsalTier = "core" | "secondary" | "hidden";

export type SinsalMatchContext = {
  dayStem: string;
  dayBranch: string;
  targetBranch: string;
  yearBranch: string;
};

export type SinsalRule = {
  name: string;
  tier: SinsalTier;
  match: (ctx: SinsalMatchContext) => boolean;
};

const CHEON_EUL_GWIIN_MAP: Record<string, string[]> = {
  甲: ["丑", "未"],
  戊: ["丑", "未"],
  庚: ["丑", "未"],
  乙: ["子", "申"],
  己: ["子", "申"],
  丙: ["亥", "酉"],
  丁: ["亥", "酉"],
  壬: ["卯", "巳"],
  癸: ["卯", "巳"],
  辛: ["午", "寅"],
};

const MUNCHANG_GWIIN_MAP: Record<string, string> = {
  甲: "巳",
  乙: "午",
  丙: "申",
  丁: "酉",
  戊: "申",
  己: "酉",
  庚: "亥",
  辛: "子",
  壬: "寅",
  癸: "卯",
};

const TWELVE_STAGE_START_BRANCH: Record<string, string> = {
  甲: "亥",
  乙: "午",
  丙: "寅",
  丁: "酉",
  戊: "寅",
  己: "酉",
  庚: "巳",
  辛: "子",
  壬: "申",
  癸: "卯",
};

const TAEGEUK_GWIIN_MAP: Record<string, string[]> = {
  甲: ["子", "午"],
  乙: ["子", "午"],
  丙: ["卯", "酉"],
  丁: ["卯", "酉"],
  戊: ["辰", "戌", "丑", "未"],
  己: ["辰", "戌", "丑", "未"],
  庚: ["寅", "亥"],
  辛: ["寅", "亥"],
  壬: ["巳", "申"],
  癸: ["巳", "申"],
};

const AMROK_MAP: Record<string, string> = {
  甲: "亥",
  乙: "戌",
  丙: "申",
  丁: "未",
  戊: "申",
  己: "未",
  庚: "巳",
  辛: "辰",
  壬: "寅",
  癸: "丑",
};

const YEOKMA_MAP: Record<string, string> = {
  寅: "申",
  申: "寅",
  巳: "亥",
  亥: "巳",
  子: "午",
  午: "子",
  卯: "酉",
  酉: "卯",
  辰: "戌",
  戌: "辰",
  丑: "未",
  未: "丑",
};

const DOHWA_MAP: Record<string, string> = {
  寅: "卯",
  午: "卯",
  戌: "卯",
  申: "酉",
  子: "酉",
  辰: "酉",
  巳: "午",
  酉: "午",
  丑: "午",
  亥: "子",
  卯: "子",
  未: "子",
};

const HWAGAE_MAP: Record<string, string> = {
  寅: "戌",
  午: "戌",
  戌: "戌",
  申: "辰",
  子: "辰",
  辰: "辰",
  巳: "丑",
  酉: "丑",
  丑: "丑",
  亥: "未",
  卯: "未",
  未: "未",
};

const HONGYEOM_MAP: Record<string, string> = {
  甲: "午",
  乙: "申",
  丙: "寅",
  丁: "未",
  戊: "辰",
  己: "辰",
  庚: "戌",
  辛: "酉",
  壬: "子",
  癸: "申",
};

const YANGIN_MAP: Record<string, string> = {
  甲: "卯",
  乙: "辰",
  丙: "午",
  丁: "未",
  戊: "午",
  己: "未",
  庚: "酉",
  辛: "戌",
  壬: "子",
  癸: "丑",
};

const GEUMYEO_MAP: Record<string, string> = {
  甲: "辰",
  乙: "巳",
  丙: "未",
  丁: "申",
  戊: "未",
  己: "申",
  庚: "戌",
  辛: "亥",
  壬: "丑",
  癸: "寅",
};

const GOESHIN_MAP: Record<string, string> = {
  亥: "寅",
  子: "巳",
  丑: "申",
  寅: "亥",
  卯: "子",
  辰: "卯",
  巳: "午",
  午: "酉",
  未: "戌",
  申: "丑",
  酉: "辰",
  戌: "未",
};

const GWAIMUN_PAIRS = new Set(["子卯", "卯子", "丑寅", "寅丑", "午酉", "酉午", "未申", "申未", "辰巳", "巳辰", "戌亥", "亥戌"]);

const HYUNCHIM_BRANCHES = new Set(["卯", "午", "未", "申"]);

const GOEGANG_BRANCHES = new Set(["辰", "戌", "丑", "未"]);

const BAEKHO_BRANCHES = new Set(["酉", "戌"]);

const GWASUK_BRANCHES = new Set(["巳", "午", "未"]);

export const SINSAL_RULES: SinsalRule[] = [
  {
    name: "천을귀인",
    tier: "core",
    match: (ctx) => (CHEON_EUL_GWIIN_MAP[ctx.dayStem] || []).includes(ctx.targetBranch),
  },
  {
    name: "문창귀인",
    tier: "core",
    match: (ctx) => MUNCHANG_GWIIN_MAP[ctx.dayStem] === ctx.targetBranch,
  },
  {
    name: "학당귀인",
    tier: "core",
    match: (ctx) => TWELVE_STAGE_START_BRANCH[ctx.dayStem] === ctx.targetBranch,
  },
  {
    name: "태극귀인",
    tier: "core",
    match: (ctx) => (TAEGEUK_GWIIN_MAP[ctx.dayStem] || []).includes(ctx.targetBranch),
  },
  {
    name: "암록",
    tier: "core",
    match: (ctx) => AMROK_MAP[ctx.dayStem] === ctx.targetBranch,
  },
  {
    name: "도화살",
    tier: "core",
    match: (ctx) => DOHWA_MAP[ctx.dayBranch] === ctx.targetBranch,
  },
  {
    name: "역마살",
    tier: "core",
    match: (ctx) => YEOKMA_MAP[ctx.dayBranch] === ctx.targetBranch,
  },
  {
    name: "화개살",
    tier: "core",
    match: (ctx) => HWAGAE_MAP[ctx.dayBranch] === ctx.targetBranch,
  },
  {
    name: "양인살",
    tier: "core",
    match: (ctx) => YANGIN_MAP[ctx.dayStem] === ctx.targetBranch,
  },
  {
    name: "홍염살",
    tier: "secondary",
    match: (ctx) => HONGYEOM_MAP[ctx.dayStem] === ctx.targetBranch,
  },
  {
    name: "현침살",
    tier: "secondary",
    match: (ctx) => HYUNCHIM_BRANCHES.has(ctx.targetBranch),
  },
  {
    name: "금여",
    tier: "secondary",
    match: (ctx) => GEUMYEO_MAP[ctx.dayStem] === ctx.targetBranch,
  },
  {
    name: "괴강",
    tier: "secondary",
    match: (ctx) => GOEGANG_BRANCHES.has(ctx.targetBranch),
  },
  {
    name: "백호",
    tier: "secondary",
    match: (ctx) => BAEKHO_BRANCHES.has(ctx.targetBranch),
  },
  {
    name: "귀문",
    tier: "secondary",
    match: (ctx) => GWAIMUN_PAIRS.has(`${ctx.dayBranch}${ctx.targetBranch}`),
  },
  {
    name: "고신",
    tier: "secondary",
    match: (ctx) => GOESHIN_MAP[ctx.dayBranch] === ctx.targetBranch,
  },
  {
    name: "과숙",
    tier: "secondary",
    match: (ctx) => GWASUK_BRANCHES.has(ctx.targetBranch),
  },
];

export type TieredSinsal = {
  core: string[];
  secondary: string[];
  hidden: string[];
  all: string[];
};

export function calculateTieredSals(ctx: SinsalMatchContext): TieredSinsal {
  const core: string[] = [];
  const secondary: string[] = [];
  const hidden: string[] = [];

  for (const rule of SINSAL_RULES) {
    if (!rule.match(ctx)) continue;
    const bucket = rule.tier === "core" ? core : rule.tier === "secondary" ? secondary : hidden;
    if (!bucket.includes(rule.name)) bucket.push(rule.name);
  }

  return {
    core,
    secondary,
    hidden,
    all: [...core, ...secondary, ...hidden],
  };
}

export function specialSalsFromTiers(tiers: TieredSinsal): string[] {
  return [...tiers.core, ...tiers.secondary];
}
