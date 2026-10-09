import { NextRequest, NextResponse } from "next/server";
import { handleDodoWebhookEvent } from "@/lib/dodo-payments";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const result = await handleDodoWebhookEvent(event);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Dodo webhook processing error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
