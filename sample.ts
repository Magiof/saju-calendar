import { calculateSaju } from "./index.ts";

const result = calculateSaju({
  year: 1993,
  month: 8,
  day: 4,
  hour: 19,
  minute: 10,
  gender: "남", // "남" | "여"
  calendar: "solar", // "solar" | "lunar"
  applyLocalMeanTime: true,
  longitude: 126.978, // 서울 경도
});

console.log(result.toCompact());
