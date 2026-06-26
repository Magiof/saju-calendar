import { test } from "node:test";
import { calculateSaju, lunarToSolar, solarToLunar } from "../index.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message}\nexpected: ${e}\nactual:   ${a}`);
  }
}

const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const BONG_STAGE_SEQUENCE = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"] as const;
const BONG_STAGE_START_BRANCH = {
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
} as const;
const STEM_YIN_YANG = {
  甲: "양",
  乙: "음",
  丙: "양",
  丁: "음",
  戊: "양",
  己: "음",
  庚: "양",
  辛: "음",
  壬: "양",
  癸: "음",
} as const;
const TWELVE_SAL_SEQUENCE = ["화개살", "겁살", "재살", "천살", "지살", "년살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살"] as const;
const TWELVE_SAL_GROUP_START = [
  { branches: ["申", "子", "辰"], start: "辰" },
  { branches: ["寅", "午", "戌"], start: "戌" },
  { branches: ["亥", "卯", "未"], start: "未" },
  { branches: ["巳", "酉", "丑"], start: "丑" },
] as const;

function mod(a: number, b: number) {
  return ((a % b) + b) % b;
}

function expectedBongStage(dayStem: string, branch: string) {
  const startBranch = BONG_STAGE_START_BRANCH[dayStem as keyof typeof BONG_STAGE_START_BRANCH];
  const branchIdx = EARTHLY_BRANCHES.indexOf(branch as (typeof EARTHLY_BRANCHES)[number]);
  const startIdx = EARTHLY_BRANCHES.indexOf(startBranch);
  const isYangStem = STEM_YIN_YANG[dayStem as keyof typeof STEM_YIN_YANG] === "양";
  const offset = isYangStem ? mod(branchIdx - startIdx, 12) : mod(startIdx - branchIdx, 12);
  return BONG_STAGE_SEQUENCE[offset];
}

function expectedTwelveSal(yearBranch: string, targetBranch: string) {
  const group = TWELVE_SAL_GROUP_START.find(({ branches }) => branches.includes(yearBranch as never));
  if (!group) throw new Error(`unknown year branch: ${yearBranch}`);
  const startIdx = EARTHLY_BRANCHES.indexOf(group.start);
  const targetIdx = EARTHLY_BRANCHES.indexOf(targetBranch as (typeof EARTHLY_BRANCHES)[number]);
  return TWELVE_SAL_SEQUENCE[mod(targetIdx - startIdx, 12)];
}

test("golden case: 1992-10-24 05:30 solar", () => {
  const result = calculateSaju({
    year: 1992,
    month: 10,
    day: 24,
    hour: 5,
    minute: 30,
    gender: "남",
    calendar: "solar",
    now: new Date("2026-03-04T00:00:00+09:00"),
  });

  assertEquals(
    result.pillars,
    {
      year: "壬申",
      month: "庚戌",
      day: "癸酉",
      hour: "乙卯",
    },
    "golden pillars mismatch",
  );

  assert(result.dayStem === "癸", "day stem should be 癸");
  assert(result.dayBranch === "酉", "day branch should be 酉");
  assert(result.advanced.geukguk === "종왕격", "geukguk should be 종왕격");
  assertEquals(result.advanced.yongsin, ["庚", "甲", "丁"], "yongsin mismatch");
  assert(result.currentAge === 33, "currentAge should be 33 before the 2026 birthday");
  assert(result.currentYear === 2026, "currentYear should follow injected now");
  assert(result.daeun.current?.age_range === "25", "current daeun should start at age 25");

  assertEquals(
    result.gongmang.branches,
    ["戌", "亥"],
    "gongmang branches should be 戌 and 亥 for day pillar 癸酉",
  );
  assertEquals(
    result.gongmang.branchesKo,
    ["술", "해"],
    "gongmang branchesKo should be 술 and 해",
  );
});

test("lunar input should match equivalent solar input", () => {
  const solarResult = calculateSaju({
    year: 1992,
    month: 10,
    day: 24,
    hour: 5,
    minute: 30,
    gender: "남",
    calendar: "solar",
  });

  const lunarResult = calculateSaju({
    year: 1992,
    month: 9,
    day: 29,
    hour: 5,
    minute: 30,
    gender: "남",
    calendar: "lunar",
    leap: false,
  });

  assertEquals(
    lunarResult.solar,
    { year: 1992, month: 10, day: 24 },
    "lunar to solar conversion mismatch",
  );
  assertEquals(lunarResult.pillars, solarResult.pillars, "lunar/solar pillars should match");
});

test("currentAge should use exact international age by KST date", () => {
  const result1998 = calculateSaju({
    year: 1998,
    month: 2,
    day: 22,
    hour: 0,
    minute: 0,
    gender: "남",
    calendar: "solar",
    now: new Date("2026-03-04T00:00:00+09:00"),
  });

  assert(result1998.currentAge === 28, "currentAge should be 28 after the 2026 birthday");

  const beforeBirthday = calculateSaju({
    year: 2000,
    month: 4,
    day: 20,
    hour: 12,
    minute: 0,
    gender: "남",
    calendar: "solar",
    now: new Date("2026-04-19T23:59:59+09:00"),
  });

  const onBirthday = calculateSaju({
    year: 2000,
    month: 4,
    day: 20,
    hour: 12,
    minute: 0,
    gender: "남",
    calendar: "solar",
    now: new Date("2026-04-20T00:00:00+09:00"),
  });

  assert(beforeBirthday.currentAge === 25, "currentAge should remain 25 before the birthday");
  assert(onBirthday.currentAge === 26, "currentAge should become 26 on the birthday");
});

test("omitted hour should default to noon", () => {
  const omitted = calculateSaju({
    year: 2024,
    month: 6,
    day: 15,
    gender: "여",
    calendar: "solar",
  });

  const explicitNoon = calculateSaju({
    year: 2024,
    month: 6,
    day: 15,
    hour: 12,
    minute: 0,
    gender: "여",
    calendar: "solar",
  });

  assert(omitted.input.hour === 12, "omitted hour should be normalized to noon");
  assert(omitted.pillars.hour === explicitNoon.pillars.hour, "omitted hour should match explicit noon");
});

test("hour boundary: 23:30 and 00:00 are 자시, 01:00 is 축시", () => {
  const at2330 = calculateSaju({
    year: 2024,
    month: 1,
    day: 1,
    hour: 23,
    minute: 30,
    gender: "여",
    calendar: "solar",
  });
  const at0000 = calculateSaju({
    year: 2024,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    gender: "여",
    calendar: "solar",
  });
  const at0100 = calculateSaju({
    year: 2024,
    month: 1,
    day: 1,
    hour: 1,
    minute: 0,
    gender: "여",
    calendar: "solar",
  });

  assert(at2330.pillars.hour === "甲子", "23:30 should be 甲子 hour pillar");
  assert(at0000.pillars.hour === "甲子", "00:00 should be 甲子 hour pillar");
  assert(at0100.pillars.hour === "乙丑", "01:00 should be 乙丑 hour pillar");
});

test("local mean time option should adjust calculation time and hour pillar", () => {
  const normal = calculateSaju({
    year: 1992,
    month: 10,
    day: 24,
    hour: 5,
    minute: 30,
    gender: "남",
    calendar: "solar",
  });

  const lmt = calculateSaju({
    year: 1992,
    month: 10,
    day: 24,
    hour: 5,
    minute: 30,
    gender: "남",
    calendar: "solar",
    applyLocalMeanTime: true,
    longitude: 126.9784,
  });

  assertEquals(
    lmt.normalized.calculation,
    { year: 1992, month: 10, day: 24, hour: 4, minute: 57 },
    "local mean time calculation timestamp mismatch",
  );
  assert(normal.pillars.hour === "乙卯", "baseline hour pillar should be 乙卯");
  assert(lmt.pillars.hour === "甲寅", "LMT hour pillar should be 甲寅");
});

test("1993-08-04 19:10 Seoul should expose separated yongsin and expanded special sals", () => {
  const result = calculateSaju({
    year: 1993,
    month: 8,
    day: 4,
    hour: 19,
    minute: 10,
    gender: "남",
    calendar: "solar",
    applyLocalMeanTime: true,
    longitude: 126.978,
    now: new Date("2026-06-23T12:00:00+09:00"),
  });

  assertEquals(
    result.pillars,
    { year: "癸酉", month: "己未", day: "丁巳", hour: "己酉" },
    "1993 Seoul pillars should match local-mean-time reference",
  );
  assert(result.advanced.yongsinDetail.johu?.element === "수", "johu yongsin should be water");
  assertEquals(result.advanced.yongsinDetail.johu?.stems, ["癸"], "johu yongsin should prefer 癸 from base yongsin");
  assert(result.advanced.yongsinDetail.eokbu?.element === "목", "eokbu yongsin should be wood");
  assertEquals(result.advanced.yongsinDetail.eokbu?.stems, ["甲"], "eokbu yongsin should prefer 甲 from base yongsin");

  for (const pillar of [result.sals.year, result.sals.hour]) {
    assert(pillar.specialSals.includes("천을귀인"), "酉 should include 천을귀인 for 丁 day stem");
    assert(pillar.specialSals.includes("문창귀인"), "酉 should include 문창귀인 for 丁 day stem");
    assert(pillar.specialSals.includes("학당귀인"), "酉 should include 학당귀인 for 丁 day stem");
    assert(pillar.specialSals.includes("태극귀인"), "酉 should include 태극귀인 for 丁 day stem");
  }
  assert(result.sals.month.specialSals.includes("암록"), "未 should include 암록 for 丁 day stem");
  assert(result.sals.month.specialSals.includes("홍염살"), "未 should include 홍염살 for 丁 day stem");
  assert(result.sals.month.specialSals.includes("양인살"), "未 should include 양인살 for 丁 day stem");
  assert(result.sals.month.specialSals.includes("현침살"), "未 should include 현침살");
});

test("classic engine should expose dayStrengthDetail and strength tiers", () => {
  const strong = calculateSaju({
    year: 1992,
    month: 10,
    day: 24,
    hour: 5,
    minute: 30,
    gender: "남",
    calendar: "solar",
    now: new Date("2026-06-23T12:00:00+09:00"),
  });
  const neutral = calculateSaju({
    year: 1993,
    month: 8,
    day: 4,
    hour: 19,
    minute: 10,
    gender: "남",
    calendar: "solar",
    applyLocalMeanTime: true,
    longitude: 126.978,
    now: new Date("2026-06-23T12:00:00+09:00"),
  });
  const weak = calculateSaju({
    year: 1977,
    month: 4,
    day: 15,
    hour: 12,
    gender: "남",
    calendar: "solar",
    now: new Date("2026-06-23T12:00:00+09:00"),
  });

  assert(strong.advanced.dayStrength.strength === "strong", "1992 fixture should remain strong");
  assert(neutral.advanced.dayStrength.strength === "neutral", "1993 fixture should remain neutral");
  assert(weak.advanced.dayStrength.strength === "weak", "1977 fixture should be weak");

  for (const result of [strong, neutral, weak]) {
    const detail = result.advanced.dayStrengthDetail;
    assert(typeof detail.deukryeong === "boolean", "deukryeong should be boolean");
    assert(typeof detail.deukji === "boolean", "deukji should be boolean");
    assert(typeof detail.deukse === "boolean", "deukse should be boolean");
    assert(typeof detail.deuksi === "boolean", "deuksi should be boolean");
    assert(detail.rootStrength >= 0 && detail.rootStrength <= 100, "rootStrength should be bounded");
  }
});

test("classic engine should separate johu and eokbu with 궁통보감 metadata", () => {
  const result = calculateSaju({
    year: 1993,
    month: 8,
    day: 4,
    hour: 19,
    minute: 10,
    gender: "남",
    calendar: "solar",
    applyLocalMeanTime: true,
    longitude: 126.978,
  });

  const johu = result.advanced.yongsinDetail.johu;
  const eokbu = result.advanced.yongsinDetail.eokbu;
  assert(johu?.source === "궁통보감", "johu should cite 궁통보감 source");
  assert(eokbu?.source === "궁통보감", "eokbu should cite 궁통보감 source");
  assert(johu?.priority === "primary", "johu should expose primary priority");
  assert(eokbu?.priority === "primary", "eokbu should expose primary priority");
  assert(johu?.element !== eokbu?.element, "johu and eokbu should differ for 1993 fixture");
});

test("classic engine should tier pillar sinsals while preserving specialSals", () => {
  const result = calculateSaju({
    year: 1993,
    month: 8,
    day: 4,
    hour: 19,
    minute: 10,
    gender: "남",
    calendar: "solar",
    applyLocalMeanTime: true,
    longitude: 126.978,
  });

  for (const pillar of [result.sals.year, result.sals.month, result.sals.hour]) {
    assertEquals(
      pillar.specialSals,
      [...pillar.sinsalTiers.core, ...pillar.sinsalTiers.secondary],
      "specialSals should remain core+secondary compatibility list",
    );
  }

  assert(result.sals.year.sinsalTiers.core.includes("천을귀인"), "酉 year branch should tier 천을귀인 as core");
  assert(result.sals.month.sinsalTiers.secondary.includes("홍염살"), "未 month branch should tier 홍염살 as secondary");
  assert(result.advanced.sinsalDetail.core.includes("천을귀인"), "advanced sinsal detail should aggregate core sinsal");
});

test("result schema and text outputs should include key sections", () => {
  const result = calculateSaju({
    year: 2001,
    month: 11,
    day: 3,
    hour: 14,
    minute: 20,
    gender: "남",
    calendar: "solar",
  });

  const requiredKeys = [
    "input",
    "normalized",
    "solar",
    "pillars",
    "pillarDetails",
    "dayStem",
    "dayBranch",
    "gongmang",
    "fiveElements",
    "tenGods",
    "stages12",
    "stemRelations",
    "branchRelations",
    "sals",
    "currentAge",
    "currentYear",
    "daeun",
    "seyun",
    "wolun",
    "advanced",
    "reference",
    "toCompact",
  ];

  for (const key of requiredKeys) {
    assert(key in result, `missing key: ${key}`);
  }

  const compact = result.toCompact();
  assert(compact.includes("## 원국"), "compact should include pillars block");
  assert(compact.includes("## 오행"), "compact should include five elements");
  assert(compact.includes("공망"), "compact should include gongmang");
  assert(compact.includes("## 대운"), "compact should include daeun");
  assert(compact.includes("## 세운"), "compact should include seyun");
  assert(compact.includes("## 월운"), "compact should include wolun");
  assert(compact.includes("## 만세력"), "compact should include manse");
  assert(compact.includes("장간"), "compact should include hidden stems");
  assert(compact.includes("신살"), "compact should label special sals as 신살");
  assert(!compact.includes("특살"), "compact should not use legacy 특살 label");
  assert(compact.includes("신살중요도"), "compact should include sinsal tier block");
  assert(compact.includes("일간지표"), "compact should include strength metrics");
  assert(compact.includes("득령"), "compact should include deuk metrics");
  assert(compact.includes("격:"), "compact should include geukguk label");
  assert(compact.includes("용신:"), "compact should include yongsin label");
  assert(!compact.includes("길신:"), "compact should not use legacy gilsin label");
  assert(!compact.includes("흉신:"), "compact should not use legacy hyungsin label");
  assert(!compact.includes("특살"), "compact should not use legacy 특살 label");

  assert(result.daeun.list[0].stage12 === result.daeun.list[0]["12unsung"], "daeun legacy stage alias mismatch");
  assert(result.wolun[0].monthName === result.wolun[0].month_name, "wolun legacy month alias mismatch");
  assert(result.wolun[0].stemTenGod === result.wolun[0].stem_tengod, "wolun legacy stem alias mismatch");
  assert(result.wolun[0].branchTenGod === result.wolun[0].branch_tengod, "wolun legacy branch alias mismatch");
  assert(result.wolun[0].stage12 === result.wolun[0]["12unsung"], "wolun legacy stage alias mismatch");
});

test("lichun boundary should switch year/month pillars", () => {
  const beforeLichun = calculateSaju({
    year: 2024,
    month: 2,
    day: 3,
    hour: 12,
    minute: 0,
    gender: "남",
    calendar: "solar",
  });

  const afterLichun = calculateSaju({
    year: 2024,
    month: 2,
    day: 5,
    hour: 12,
    minute: 0,
    gender: "남",
    calendar: "solar",
  });

  assert(beforeLichun.pillars.year === "癸卯", "before lichun year pillar should be 癸卯");
  assert(afterLichun.pillars.year === "甲辰", "after lichun year pillar should be 甲辰");
  assert(beforeLichun.pillars.month === "乙丑", "before lichun month pillar should be 乙丑");
  assert(afterLichun.pillars.month === "丙寅", "after lichun month pillar should be 丙寅");
});

test("reported comparisons should match external references for stages and 12-sals", () => {
  const case1990 = calculateSaju({
    year: 1990,
    month: 4,
    day: 23,
    hour: 10,
    minute: 0,
    gender: "남",
    calendar: "solar",
  });

  assertEquals(
    case1990.pillars,
    {
      year: "庚午",
      month: "庚辰",
      day: "戊午",
      hour: "丁巳",
    },
    "1990 case pillars mismatch",
  );
  assertEquals(
    case1990.stages12.bong,
    {
      hour: "건록",
      day: "제왕",
      month: "관대",
      year: "제왕",
    },
    "1990 case bong 12-stage mismatch",
  );
  assertEquals(
    {
      hour: case1990.sals.hour.twelveSal,
      day: case1990.sals.day.twelveSal,
      month: case1990.sals.month.twelveSal,
      year: case1990.sals.year.twelveSal,
    },
    {
      hour: "망신살",
      day: "장성살",
      month: "월살",
      year: "장성살",
    },
    "1990 case twelve-sals mismatch",
  );

  const case1991 = calculateSaju({
    year: 1991,
    month: 9,
    day: 9,
    hour: 15,
    minute: 57,
    gender: "남",
    calendar: "solar",
  });

  assertEquals(
    case1991.pillars,
    {
      year: "辛未",
      month: "丁酉",
      day: "壬午",
      hour: "戊申",
    },
    "1991 case pillars mismatch",
  );
  assertEquals(
    case1991.stages12.bong,
    {
      hour: "장생",
      day: "태",
      month: "목욕",
      year: "양",
    },
    "1991 case bong 12-stage mismatch",
  );
  assertEquals(
    {
      hour: case1991.sals.hour.twelveSal,
      day: case1991.sals.day.twelveSal,
      month: case1991.sals.month.twelveSal,
      year: case1991.sals.year.twelveSal,
    },
    {
      hour: "겁살",
      day: "육해살",
      month: "재살",
      year: "화개살",
    },
    "1991 case twelve-sals mismatch",
  );
  assertEquals(
    case1991.pillarDetails.hour.hiddenStems,
    {
      여기: "戊",
      중기: "壬",
      정기: "庚",
    },
    "1991 case hour hidden stems mismatch",
  );
});

test("bong 12-stage and 12-sals should follow canonical rules across sampled charts", () => {
  for (let year = 1900; year <= 2099; year += 8) {
    for (let month = 1; month <= 12; month++) {
      for (let day = 1; day <= 28; day += 9) {
        for (const [hour, minute] of [
          [0, 0],
          [8, 15],
          [16, 30],
          [23, 45],
        ] as const) {
          const result = calculateSaju({
            year,
            month,
            day,
            hour,
            minute,
            gender: "남",
            calendar: "solar",
          });

          for (const key of ["hour", "day", "month", "year"] as const) {
            const branch = result.pillarDetails[key].branch;
            assertEquals(
              result.stages12.bong[key],
              expectedBongStage(result.dayStem, branch),
              `bong 12-stage mismatch at ${year}-${month}-${day} ${hour}:${minute} ${key}`,
            );
            assertEquals(
              result.sals[key].twelveSal,
              expectedTwelveSal(result.pillarDetails.year.branch, branch),
              `twelve-sal mismatch at ${year}-${month}-${day} ${hour}:${minute} ${key}`,
            );
          }
        }
      }
    }
  }
});

test("canonical hidden stems for 申 and 亥 should remain stable", () => {
  const resultShin = calculateSaju({
    year: 1991,
    month: 9,
    day: 9,
    hour: 15,
    minute: 17,
    gender: "여",
    calendar: "solar",
  });
  assertEquals(
    resultShin.pillarDetails.hour.hiddenStems,
    { 여기: "戊", 중기: "壬", 정기: "庚" },
    "申 hidden stems mismatch",
  );

  const resultHae = calculateSaju({
    year: 1995,
    month: 6,
    day: 15,
    hour: 21,
    minute: 0,
    gender: "여",
    calendar: "solar",
  });
  assert(resultHae.pillarDetails.hour.branch === "亥", "expected 亥 hour branch");
  assertEquals(
    resultHae.pillarDetails.hour.hiddenStems,
    { 여기: null, 중기: "甲", 정기: "壬" },
    "亥 hidden stems mismatch",
  );
});

test("canonical pillar fixtures should hold for externally cross-checked edge cases", () => {
  const solar1999 = calculateSaju({
    year: 1999,
    month: 10,
    day: 20,
    hour: 10,
    minute: 25,
    gender: "남",
    calendar: "solar",
  });
  assertEquals(
    solar1999.pillars,
    {
      year: "己卯",
      month: "甲戌",
      day: "乙巳",
      hour: "辛巳",
    },
    "1999-10-20 should be in 戌 month after 寒露",
  );

  const lunar2006 = calculateSaju({
    year: 2006,
    month: 8,
    day: 20,
    hour: 6,
    minute: 38,
    gender: "남",
    calendar: "lunar",
    leap: false,
  });
  assertEquals(
    lunar2006.solar,
    {
      year: 2006,
      month: 10,
      day: 11,
    },
    "2006 lunar conversion mismatch",
  );
  assertEquals(
    lunar2006.pillars,
    {
      year: "丙戌",
      month: "戊戌",
      day: "癸酉",
      hour: "乙卯",
    },
    "2006-10-11 should remain 戌 month before 立冬",
  );

  const lunar2000 = calculateSaju({
    year: 2000,
    month: 12,
    day: 12,
    hour: 3,
    minute: 38,
    gender: "남",
    calendar: "lunar",
    leap: false,
  });
  assertEquals(
    lunar2000.solar,
    {
      year: 2001,
      month: 1,
      day: 6,
    },
    "2000 lunar conversion mismatch",
  );
  assertEquals(
    lunar2000.pillars,
    {
      year: "庚辰",
      month: "己丑",
      day: "己巳",
      hour: "丙寅",
    },
    "2001-01-06 should still use previous year pillar before 立春",
  );

  const solar1990 = calculateSaju({
    year: 1990,
    month: 8,
    day: 17,
    hour: 11,
    minute: 38,
    gender: "남",
    calendar: "solar",
  });
  assertEquals(
    solar1990.pillars,
    {
      year: "庚午",
      month: "甲申",
      day: "甲寅",
      hour: "庚午",
    },
    "1990-08-17 canonical pillar fixture mismatch",
  );
});

test("compact should honor injected now year (deterministic output)", () => {
  const result = calculateSaju({
    year: 1992,
    month: 10,
    day: 24,
    hour: 5,
    minute: 30,
    gender: "남",
    calendar: "solar",
    now: new Date("2031-01-03T12:00:00+09:00"),
  });

  const compact = result.toCompact();
  assert(compact.includes("## 세운"), "compact should include seyun block");
  assert(compact.includes("2031"), "compact seyun should follow injected now year");
});

test("input validation should reject out-of-range values", () => {
  let threw = false;
  try {
    calculateSaju({
      year: 1800,
      month: 10,
      day: 24,
      hour: 5,
      minute: 30,
      gender: "남",
      calendar: "solar",
    });
  } catch (_err) {
    threw = true;
  }
  assert(threw, "invalid year should throw");
});

test("input validation should reject invalid enum-like values", () => {
  let invalidGenderThrew = false;
  try {
    calculateSaju({
      year: 2024,
      month: 2,
      day: 29,
      hour: 8,
      minute: 0,
      gender: "X" as unknown as "남",
      calendar: "solar",
    });
  } catch (_err) {
    invalidGenderThrew = true;
  }
  assert(invalidGenderThrew, "invalid gender should throw");

  let invalidCalendarThrew = false;
  try {
    calculateSaju({
      year: 2024,
      month: 2,
      day: 29,
      hour: 8,
      minute: 0,
      gender: "남",
      calendar: "foo" as unknown as "solar",
    });
  } catch (_err) {
    invalidCalendarThrew = true;
  }
  assert(invalidCalendarThrew, "invalid calendar should throw");
});

test("input validation should reject invalid timezone and now", () => {
  let invalidTimezoneThrew = false;
  try {
    calculateSaju({
      year: 2024,
      month: 2,
      day: 29,
      hour: 8,
      minute: 0,
      gender: "남",
      calendar: "solar",
      timezone: "Invalid/Timezone",
    });
  } catch (_err) {
    invalidTimezoneThrew = true;
  }
  assert(invalidTimezoneThrew, "invalid timezone should throw");

  let invalidNowThrew = false;
  try {
    calculateSaju({
      year: 2024,
      month: 2,
      day: 29,
      hour: 8,
      minute: 0,
      gender: "남",
      calendar: "solar",
      now: new Date("invalid"),
    });
  } catch (_err) {
    invalidNowThrew = true;
  }
  assert(invalidNowThrew, "invalid now date should throw");
});

test("invalid solar date should throw", () => {
  let threw = false;
  try {
    calculateSaju({
      year: 2024,
      month: 2,
      day: 31,
      hour: 8,
      minute: 0,
      gender: "남",
      calendar: "solar",
    });
  } catch (_err) {
    threw = true;
  }
  assert(threw, "invalid Gregorian date should throw");
});

test("direct date conversion APIs should reject invalid dates", () => {
  let solarToLunarThrew = false;
  try {
    solarToLunar(2024, 2, 31);
  } catch (_err) {
    solarToLunarThrew = true;
  }
  assert(solarToLunarThrew, "solarToLunar should reject invalid solar date");

  let leapMismatchThrew = false;
  try {
    lunarToSolar(2020, 1, 1, true);
  } catch (_err) {
    leapMismatchThrew = true;
  }
  assert(leapMismatchThrew, "lunarToSolar should reject non-leap month with leap=true");
});

test("seyun should be in ascending chronological order", () => {
  const result = calculateSaju({
    year: 1992,
    month: 10,
    day: 24,
    hour: 5,
    minute: 30,
    gender: "남",
    calendar: "solar",
    now: new Date("2026-03-04T00:00:00+09:00"),
  });

  for (let i = 1; i < result.seyun.length; i++) {
    assert(
      result.seyun[i].year > result.seyun[i - 1].year,
      `seyun should be ascending: ${result.seyun[i - 1].year} < ${result.seyun[i].year}`,
    );
  }
  assert(result.seyun.some((s) => s.year === 2026), "seyun should include the current year");
});

test("toCompact should contain correct pillar data", () => {
  const result = calculateSaju({
    year: 1992,
    month: 10,
    day: 24,
    hour: 5,
    minute: 30,
    gender: "남",
    calendar: "solar",
    now: new Date("2026-03-04T00:00:00+09:00"),
  });

  const compact = result.toCompact();
  assert(compact.includes("癸(계)수-"), "compact should contain day stem with element and yinyang");
  assert(compact.includes("酉(유)금-"), "compact should contain day branch with element and yinyang");
  assert(compact.includes("격: 종왕격"), "compact should contain geukguk");
  assert(compact.includes("공망 戌(술) 亥(해)"), "compact should contain gongmang values");
  assert(compact.includes("만 33세"), "compact should contain current age");
  assert(compact.includes("## 세운 2026 기준"), "compact seyun should reference current year");
  assert(compact.includes("★2026"), "compact seyun should mark current year");
});

test("toCompact should include LMT when local mean time is applied", () => {
  const result = calculateSaju({
    year: 1993,
    month: 8,
    day: 4,
    hour: 19,
    minute: 10,
    gender: "남",
    calendar: "solar",
    applyLocalMeanTime: true,
    longitude: 126.978,
    now: new Date("2026-03-04T00:00:00+09:00"),
  });

  const compact = result.toCompact();
  assert(compact.includes("LMT 1993-08-04"), "compact should include LMT line");
  assert(compact.includes("일간지표"), "compact should include strength metrics");
  assert(compact.includes("강약:"), "compact should include strength label");
  assert(compact.includes("격: 종왕격") || compact.includes("격:"), "compact should include geukguk");
});

test("daeun should be solar-term-time based by default", () => {
  const result = calculateSaju({
    year: 1970,
    month: 1,
    day: 7,
    hour: 23,
    minute: 30,
    gender: "남",
    calendar: "solar",
  });

  assert(result.daeun.startAge >= 1, "startAge should be valid");
  assert(result.daeun.startAgePrecise > 0, "precise start age should be calculated");
  assert(result.daeun.basis.targetTermUtc.length > 0, "result should expose target solar term time");
  assert(
    result.daeun.basis.birthUtc.includes("T"),
    "birthUtc basis should be represented as ISO datetime",
  );
});
