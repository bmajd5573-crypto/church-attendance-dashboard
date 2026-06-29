export type MemberStage = "KG" | "ebteda2y" | "e3dady" | "sanawy" | "shamasa" | "maktaba";

export const stageOptions: MemberStage[] = ["KG", "ebteda2y", "e3dady", "sanawy", "shamasa", "maktaba"];

export interface AttendanceRecord {
  date: string;
  present: boolean;
}

export interface Member {
  id: string;
  name: string;
  code: string;
  stage: MemberStage;
  attendance: AttendanceRecord[];
}

export interface MemberInput {
  name: string;
  code?: string | number;
  stage?: string;
}

export const storageKey = "church-attendance-members-v1";

const DEFAULT_STAGE: MemberStage = "ebteda2y";

const stageMap: Record<string, MemberStage> = {
  kg: "KG",
  كجي: "KG",
  كيجي: "KG",
  elementary: "ebteda2y",
  ebteda2y: "ebteda2y",
  ebteda2i: "ebteda2y",
  ابتدائي: "ebteda2y",
  default: "ebteda2y",
  "middle school": "e3dady",
  middle: "e3dady",
  junior: "e3dady",
  e3dady: "e3dady",
  e3dadi: "e3dady",
  اعدادي: "e3dady",
  "high school": "sanawy",
  high: "sanawy",
  sanawy: "sanawy",
  thanawy: "sanawy",
  ثانوي: "sanawy",
  deacons: "shamasa",
  deacon: "shamasa",
  shamasa: "shamasa",
  شمامسه: "shamasa",
  library: "maktaba",
  maktaba: "maktaba",
  مكتبه: "maktaba",
  مكتبة: "maktaba",
};

export function normalizeStage(stage?: string): MemberStage {
  const rawValue = (stage ?? "").trim();
  if (!rawValue) {
    return DEFAULT_STAGE;
  }

  const compact = rawValue
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]/g, "");

  if (compact.includes("kg") || compact.includes("كج") || compact.includes("كيج")) {
    return "KG";
  }

  if (
    compact.includes("ابتدائي") ||
    compact.includes("ebteda") ||
    compact.includes("امينابتدائي") ||
    compact.includes("امين") ||
    compact.includes("فصل") ||
    compact.includes("خدمة") ||
    compact.includes("خدمه") ||
    compact.includes("1و2") ||
    compact.includes("12") ||
    compact.includes("default")
  ) {
    return "ebteda2y";
  }

  if (compact.includes("اعدادي") || compact.includes("e3dad") || compact.includes("e3dadi")) {
    return "e3dady";
  }

  if (compact.includes("ثانوي") || compact.includes("sanawy") || compact.includes("thanawy")) {
    return "sanawy";
  }

  if (compact.includes("شمامس") || compact.includes("shamasa")) {
    return "shamasa";
  }

  if (compact.includes("مكتبه") || compact.includes("مكتبة") || compact.includes("maktaba")) {
    return "maktaba";
  }

  return stageMap[compact] ?? DEFAULT_STAGE;
}

export function createMember(input: MemberInput): Member {
  const name = input.name.trim();
  const codeValue = String(input.code ?? "").trim();
  const code = codeValue || `M-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  return {
    id: `${name}-${code}`.toLowerCase().replace(/\s+/g, "-"),
    name,
    code,
    stage: normalizeStage(input.stage),
    attendance: [],
  };
}

export function readMembersFromStorage(): Member[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as Member[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeMembersToStorage(members: Member[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(members));
  } catch {
    // Ignore write failures in restricted browser contexts.
  }
}

export function parseMemberDataset(rawMembers: MemberInput[]): Member[] {
  return rawMembers.map(createMember);
}

function parseMemberLine(line: string): MemberInput | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const normalizedLine = trimmed.replace(/^\s*\d+\s*[-.):]?\s*/, "").trim();
  if (!normalizedLine) {
    return null;
  }

  const tabSplit = normalizedLine.split(/\t+/).map((part) => part.trim()).filter(Boolean);
  if (tabSplit.length >= 2) {
    const [name, codeOrStage, maybeStage] = tabSplit;
    const stage = maybeStage ?? codeOrStage;
    return {
      name,
      code: stage && stage !== codeOrStage ? codeOrStage : "",
      stage: stage && stage !== codeOrStage ? maybeStage : codeOrStage,
    };
  }

  const commaParts = normalizedLine.split(/,/).map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 3) {
    const [name, code, ...stageParts] = commaParts;
    return {
      name,
      code,
      stage: stageParts.join(", "),
    };
  }

  if (commaParts.length === 2) {
    return {
      name: commaParts[0],
      code: "",
      stage: commaParts[1],
    };
  }

  const parts = normalizedLine.split(/[|]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      name: parts[0],
      code: parts[1] ?? "",
      stage: parts[2] ?? "",
    };
  }

  return {
    name: normalizedLine,
    code: "",
    stage: "",
  };
}

export function parseMemberText(text: string): Member[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = lines
    .map(parseMemberLine)
    .filter((value): value is MemberInput => Boolean(value));

  return parseMemberDataset(parsed);
}

export function searchMembers(members: Member[], query: string): Member[] {
  const term = query.trim();

  if (!term) {
    return members;
  }

  const normalized = term.toLowerCase();
  const isNumericQuery = /^\d+$/.test(term);

  return members.filter((member) => {
    if (isNumericQuery) {
      return member.code.toLowerCase().includes(normalized);
    }

    return member.name.toLowerCase().includes(normalized);
  });
}

export async function fetchMembers(): Promise<Member[]> {
  const response = await fetch("/api/members", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to load shared members.");
  }

  const data = await response.json();
  return Array.isArray(data.members) ? data.members : [];
}

export async function saveMembers(members: Member[]): Promise<Member[]> {
  const response = await fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ members }),
  });

  if (!response.ok) {
    throw new Error("Failed to save shared members.");
  }

  const data = await response.json();
  return Array.isArray(data.members) ? data.members : [];
}

export function upsertAttendance(member: Member, date: string, present: boolean): Member {
  const nextAttendance = member.attendance.filter((entry) => entry.date !== date);
  nextAttendance.push({ date, present });

  return {
    ...member,
    attendance: nextAttendance,
  };
}

export function getAttendanceSummary(members: Member[], selectedDate: string) {
  let attended = 0;
  let absent = 0;

  members.forEach((member) => {
    const record = member.attendance.find((entry) => entry.date === selectedDate);

    if (record?.present) {
      attended += 1;
    } else if (record && !record.present) {
      absent += 1;
    }
  });

  return {
    attended,
    absent,
    total: members.length,
    pending: members.length - attended - absent,
  };
}

export const sampleMembers = parseMemberDataset([
  { name: "Abanoub Shenouda", code: "A001", stage: "shamasa" },
  { name: "Mina Emad", code: "A002", stage: "sanawy" },
  { name: "Sarah Magdy", code: "A003", stage: "e3dady" },
  { name: "Peter Daniel", code: "A004", stage: "ebteda2y" },
  { name: "Nour Habib", code: "A005", stage: "KG" },
  { name: "Mariam George", code: "A006", stage: "maktaba" },
  { name: "Youmna Adel", code: "A007", stage: "ebteda2y" },
  { name: "Joseph Youssef", code: "A008", stage: "ebteda2y" },
  { name: "Samir Khaled", code: "A009", stage: "sanawy" },
  { name: "Hanna Rafaat", code: "A010", stage: "e3dady" },
]);
