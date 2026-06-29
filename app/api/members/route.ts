import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { createMember, type Member, type MemberInput } from "../../lib/attendance";

const dataFile = path.join(process.cwd(), "data", "members.json");

async function ensureDataDir() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
}

async function readMembers(): Promise<Member[]> {
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

async function writeMembers(members: Member[]) {
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

export async function GET() {
  const members = await readMembers();
  return NextResponse.json({ members });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const existingMembers = await readMembers();

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

  const merged = [...existingMembers];
  for (const member of membersToSave) {
    const existingIndex = merged.findIndex((item) => item.id === member.id);
    if (existingIndex !== -1) {
      merged[existingIndex] = member;
    } else {
      merged.push(member);
    }
  }

  await writeMembers(merged);
  return NextResponse.json({ members: merged });
}
