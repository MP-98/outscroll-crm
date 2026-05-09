import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface DigestRow {
  id: string;
  status: string;
  next_followup_at: string;
  channel: string;
  talent: { id: string; full_name: string | null } | null;
  brand: { id: string; name: string | null } | null;
  owner_id: string | null;
  updated_at: string;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "RESEND_API_KEY not set" }, { status: 200 });
  }
  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM ?? "Outscroll CRM <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://outscroll-crm.vercel.app";

  const supabase = createAdminClient();
  const today = todayISO();
  const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

  const [{ data: outreaches }, { data: profiles }] = await Promise.all([
    supabase
      .from("outreaches")
      .select(
        `id, status, next_followup_at, channel, owner_id, updated_at,
         talent:talents(id, full_name),
         brand:brands(id, name)`,
      )
      .neq("status", "paid")
      .neq("status", "lost"),
    supabase.from("profiles").select("id, full_name, email").not("email", "is", null),
  ]);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  for (const profile of profiles) {
    if (!profile.email) continue;
    const ownRows = (outreaches ?? []).filter((o) => o.owner_id === profile.id) as unknown as DigestRow[];
    const dueToday = ownRows.filter((o) => o.next_followup_at === today);
    const overdue = ownRows.filter((o) => o.next_followup_at < today);
    const stale = ownRows.filter((o) => o.updated_at < fourteenDaysAgo);

    if (dueToday.length === 0 && overdue.length === 0 && stale.length === 0) continue;

    const html = renderDigest({
      name: profile.full_name ?? profile.email,
      siteUrl,
      dueToday,
      overdue,
      stale,
    });

    try {
      await resend.emails.send({
        from: fromAddress,
        to: profile.email,
        subject: `Outscroll daily — ${dueToday.length} due, ${overdue.length} overdue`,
        html,
      });
      sent += 1;
    } catch (err) {
      console.error(`Digest send failed for ${profile.email}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}

function renderDigest({
  name,
  siteUrl,
  dueToday,
  overdue,
  stale,
}: {
  name: string;
  siteUrl: string;
  dueToday: DigestRow[];
  overdue: DigestRow[];
  stale: DigestRow[];
}) {
  function row(o: DigestRow) {
    return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333">
        <a href="${siteUrl}/outreaches/${o.id}" style="color:#4f46e5;text-decoration:none">
          ${o.talent?.full_name ?? "—"} ↔ ${o.brand?.name ?? "—"}
        </a>
        <div style="font-size:12px;color:#888;margin-top:2px">
          ${o.status.replace(/_/g, " ")} · ${o.channel}
        </div>
      </td>
    </tr>`;
  }

  function section(title: string, items: DigestRow[]) {
    if (items.length === 0) return "";
    return `<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#666;margin:24px 0 8px 0">
      ${title} <span style="color:#999">(${items.length})</span>
    </h3>
    <table cellpadding="0" cellspacing="0" border="0" width="100%">${items.map(row).join("")}</table>`;
  }

  return `<!doctype html>
  <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#111;padding:24px;max-width:600px;margin:0 auto">
    <h1 style="font-size:18px;font-weight:600;margin:0 0 4px">Hi ${name.split(" ")[0]}</h1>
    <p style="font-size:14px;color:#666;margin:0 0 16px">Here's what needs attention today.</p>
    ${section("Due today", dueToday)}
    ${section("Overdue", overdue)}
    ${section("Stale (no activity 14d+)", stale)}
    <p style="font-size:12px;color:#999;margin-top:32px">
      Sent by Outscroll CRM · <a href="${siteUrl}" style="color:#4f46e5">Open inbox</a>
    </p>
  </body></html>`;
}
