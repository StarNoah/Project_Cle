import { readFileSync } from "fs";
import { join } from "path";

interface GymRow {
  name: string;
  hashtags: string[];
  region: string | null;
  area: string | null;
  address: string | null;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function generateHashtags(name: string): string[] {
  const tags = new Set<string>();

  const noSpace = name.replace(/\s+/g, "");

  // 공백 제거한 전체 이름 (e.g., "오프더월클라이밍" → "오프더월클라이밍")
  tags.add(noSpace);

  // ~점 삭제 (e.g., "더클라임양재점" → "더클라임양재")
  if (noSpace.endsWith("점")) {
    tags.add(noSpace.slice(0, -1));
  }

  // 센터/센타/짐/장 제거 버전 (e.g., "에이스클라이밍센터" → "에이스클라이밍")
  if (/(?:센터|센타|짐|장)$/.test(noSpace)) {
    tags.add(noSpace.replace(/(?:센터|센타|짐|장)$/, ""));
  }

  // 브랜드명 추출
  const parts = name.split(/\s+/);
  if (parts.length > 1) {
    // 공백 있으면 첫 단어 (e.g., "더클라임 양재점" → "더클라임")
    if (parts[0].length >= 2) {
      tags.add(parts[0]);
    }
  } else {
    // 공백 없으면 접미사 제거 (e.g., "오프더월클라이밍" → "오프더월")
    const brand = noSpace.replace(/(클라이밍센터|클라이밍센타|클라이밍짐|클라이밍장|클라이밍|볼더링)$/, "");
    if (brand && brand !== noSpace && brand.length >= 2) {
      tags.add(brand);
    }
  }

  return [...tags];
}

function isClimbingGym(name: string): boolean {
  if (name.endsWith("입구")) return false;
  if (/센터|센타/.test(name)) return false;
  return true;
}

function extractArea(address: string): string | null {
  // 주소에서 구/군 단위 추출: "서울특별시 강남구 ..." → "강남구"
  const match = address.match(/\s([가-힣]+[구군시])\s/);
  return match ? match[1] : null;
}

function normalizeRegion(region: string): string | null {
  // "서울특별시" → "서울", "경기도" → "경기" etc.
  const map: Record<string, string> = {
    서울특별시: "서울",
    경기도: "경기",
    인천광역시: "인천",
    부산광역시: "부산",
    대구광역시: "대구",
    대전광역시: "대전",
    광주광역시: "광주",
    울산광역시: "울산",
    세종특별자치시: "세종",
  };
  // CSV의 region 컬럼은 이미 "서울", "경기" 등 짧은 형태
  if (region in map) return map[region];
  return region || null;
}

export function readGymsFromCsv(): GymRow[] {
  const csvPath = join(process.cwd(), "climbing-gym-tracker", "data", "climbing_gyms.csv");
  const content = readFileSync(csvPath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());

  // Skip header
  const dataLines = lines.slice(1);

  const gyms: GymRow[] = [];
  const seenNames = new Set<string>();

  for (const line of dataLines) {
    const fields = parseCsvLine(line);
    if (fields.length < 4) continue;

    const [name, address, , region] = fields;
    if (!name || seenNames.has(name)) continue;
    if (!isClimbingGym(name)) continue;
    seenNames.add(name);

    gyms.push({
      name,
      hashtags: generateHashtags(name),
      region: normalizeRegion(region),
      area: extractArea(address),
      address,
    });
  }

  return gyms;
}
