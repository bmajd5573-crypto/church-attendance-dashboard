import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createMember, normalizeStage, type Member, type MemberInput } from "../../lib/attendance";

const dataFile = path.join(process.cwd(), "data", "members.json");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = typeof supabaseUrl === "string" && typeof supabaseKey === "string";
const supabase = useSupabase
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

async function ensureDataDir() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
}

async function readMembersFromFile(): Promise<Member[]> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return [];
    }
    return [];
  }
}

async function writeMembersToFile(members: Member[]) {
  await ensureDataDir();
  await fs.writeFile(dataFile, JSON.stringify(members, null, 2), "utf8");
}

function normalizeMemberInput(value: any): Member {
  if (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.code === "string" &&
    typeof value.stage === "string" &&
    Array.isArray(value.attendance)
  ) {
    return value as Member;
  }

  return createMember({
    name: String(value?.name ?? ""),
    code: String(value?.code ?? ""),
    stage: String(value?.stage ?? ""),
  });
}

async function readMembersFromDatabase(): Promise<Member[]> {
  if (!supabase) {
    return readMembersFromFile();
  }

  const { data, error } = await supabase.from("members").select("id,name,code,stage,attendance");
  if (error) {
    console.error("Supabase read error:", error.message);
    return [];
  }

  return Array.isArray(data)
    ? data.map((item) => ({
        id: String(item.id),
        name: String(item.name),
        code: String(item.code),
        stage: normalizeStage(String(item.stage)),
        attendance: Array.isArray(item.attendance) ? item.attendance : [],
      }))
    : [];
}

async function saveMembersToDatabase(members: Member[]): Promise<Member[]> {
  if (!supabase) {
    await writeMembersToFile(members);
    return members;
  }

  const { data, error } = await supabase
    .from("members")
    .upsert(members, { onConflict: "id" })
    .select("id,name,code,stage,attendance");

  if (error) {
    console.error("Supabase save error:", error.message);
    await writeMembersToFile(members);
    return members;
  }

  return Array.isArray(data)
    ? data.map((item) => ({
        id: String(item.id),
        name: String(item.name),
        code: String(item.code),
        stage: normalizeStage(String(item.stage)),
        attendance: Array.isArray(item.attendance) ? item.attendance : [],
      }))
    : members;
}

export async function GET() {
  const members = await readMembersFromDatabase();
  return NextResponse.json({ members });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const membersToSave: Member[] = [];

  if (Array.isArray(body.members)) {
    for (const item of body.members) {
      membersToSave.push(normalizeMemberInput(item));
    }
  } else if (body.member) {
    membersToSave.push(normalizeMemberInput(body.member));
  } else {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const savedMembers = await saveMembersToDatabase(membersToSave);
  return NextResponse.json({ members: savedMembers });
}
