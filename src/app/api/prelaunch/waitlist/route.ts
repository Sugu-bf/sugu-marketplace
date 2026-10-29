import type { NextRequest } from "next/server";
import { forwardPrelaunchForm } from "@/lib/api/prelaunch-proxy";

export async function POST(request: NextRequest) {
  return forwardPrelaunchForm(request, "waitlist");
}
