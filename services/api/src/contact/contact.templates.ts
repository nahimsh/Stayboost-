import type { ContactLeadInput } from "@stayboost/domain";

const escape = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });

export function teamNotificationHtml(lead: ContactLeadInput): string {
  const rows: ReadonlyArray<[string, string]> = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Company", lead.company ?? "—"],
    ["Properties", lead.propertyCount === undefined ? "—" : String(lead.propertyCount)],
    ["Reason", lead.reason],
  ];
  const table = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${label}</td><td style="padding:4px 0"><strong>${escape(value)}</strong></td></tr>`,
    )
    .join("");
  return `<div style="font-family:system-ui,sans-serif">
    <h2>New contact lead</h2>
    <table>${table}</table>
    <p style="margin-top:16px;white-space:pre-wrap">${escape(lead.message)}</p>
  </div>`;
}

export function autoresponderHtml(lead: ContactLeadInput): string {
  return `<div style="font-family:system-ui,sans-serif">
    <p>Hi ${escape(lead.name.split(" ")[0] ?? lead.name)},</p>
    <p>Thanks for reaching out to StayBoost — we've received your message and a
    member of our team will get back to you shortly.</p>
    <p>In the meantime, you can run our free AI Property Analyzer to see your
    growth opportunities right away.</p>
    <p>— The StayBoost team</p>
  </div>`;
}
