import { NextResponse, after } from "next/server";
import { nanoid } from "nanoid";
import { physicalOrderSchema } from "@/lib/validation";
import { getStory, insertPhysicalOrder } from "@/lib/db";
import { sendPhysicalOrderNotice } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = physicalOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  const d = parsed.data;
  const story = await getStory(d.storyId);
  if (!story) return NextResponse.json({ error: "story_not_found" }, { status: 404 });
  const order = {
    id: nanoid(10),
    story_id: d.storyId,
    recipient_name: d.recipientName,
    address: d.address,
    city: d.city,
    governorate: d.governorate,
    phone: d.phone,
    notes: d.notes,
    status: "pending" as const,
    shipped_at: null,
    created_at: new Date().toISOString(),
  };
  await insertPhysicalOrder(order);
  const admin = process.env.ADMIN_NOTIFY_EMAIL;
  if (admin) {
    after(() =>
      sendPhysicalOrderNotice(
        admin,
        `Order ${order.id}\nChild: ${story.input.childName}\nParent: ${story.input.parentName} <${story.input.parentEmail}>\nRecipient: ${order.recipient_name}\n${order.address}, ${order.city}, ${order.governorate}\nPhone: ${order.phone}\nNotes: ${order.notes ?? "-"}`,
      ).catch(console.error),
    );
  }
  return NextResponse.json({ id: order.id });
}
