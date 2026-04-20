import { API_BASE_URL } from "@/lib/api/config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/public/prelaunch/stats`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // Cache for 1 min
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: "Backend error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
