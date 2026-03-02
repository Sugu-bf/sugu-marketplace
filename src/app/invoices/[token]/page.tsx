import type { Metadata } from "next";
import { API_BASE_URL } from "@/lib/api/config";
import { notFound } from "next/navigation";

// ── Types ──
interface InvoiceItem {
  name: string;
  sku: string | null;
  qty: number;
  unit_price: number;
  discount: number;
  total: number;
}

interface InvoiceData {
  invoice_number: string;
  status: string;
  status_label: string;
  currency: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  paid: number;
  balance_due: number;
  issued_at: string | null;
  created_at: string;
  company: Record<string, string>;
  customer: Record<string, string>;
  billing_address: Record<string, string>;
  shipping_address: Record<string, string>;
  items: InvoiceItem[];
  download_url: string;
}

// ── Generate SEO metadata ──
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const invoice = await fetchInvoice(token);
  return {
    title: invoice
      ? `Facture ${invoice.invoice_number} — Sugu`
      : "Facture introuvable — Sugu",
    description: invoice
      ? `Voir votre facture ${invoice.invoice_number} de ${fmtCurrency(invoice.total, invoice.currency)}.`
      : "Cette facture n'est plus disponible.",
    robots: { index: false, follow: false },
  };
}

// ── Fetch ──
async function fetchInvoice(token: string): Promise<InvoiceData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/public/invoices/${token}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

function fmtCurrency(amount: number, currency = "XOF"): string {
  return `${amount.toLocaleString("fr-FR")} ${currency === "XOF" ? "FCFA" : currency}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Status badge colors ──
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  issued: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  paid: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  partially_paid: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  overdue: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

// ═══════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await fetchInvoice(token);

  if (!invoice) {
    notFound();
  }

  const statusColors = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.issued;
  const companyName = invoice.company?.name ?? "Sugu";
  const customerName = invoice.customer?.name ?? "Client";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#F15412] via-[#FF7A45] to-[#F5C451]" />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* ── Header ── */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F15412] to-[#FF7A45] shadow-md shadow-orange-500/20">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Facture {invoice.invoice_number}
                </h1>
                <p className="text-sm text-gray-500">Émise le {fmtDate(invoice.issued_at ?? invoice.created_at)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
              {invoice.status_label}
            </span>
            <a
              href={invoice.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F15412] to-[#FF7A45] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Télécharger PDF
            </a>
          </div>
        </header>

        {/* ── Card ── */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-lg shadow-gray-200/50">
          {/* Company & Customer info */}
          <div className="grid grid-cols-1 gap-6 border-b border-gray-100 p-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#F15412]">De</p>
              <p className="text-sm font-bold text-gray-900">{companyName}</p>
              {invoice.company?.address && (
                <p className="mt-0.5 text-xs text-gray-500">{invoice.company.address}</p>
              )}
              {invoice.company?.phone && (
                <p className="mt-0.5 text-xs text-gray-500">📞 {invoice.company.phone}</p>
              )}
              {invoice.company?.email && (
                <p className="mt-0.5 text-xs text-gray-500">✉️ {invoice.company.email}</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#F15412]">Facturé à</p>
              <p className="text-sm font-bold text-gray-900">{customerName}</p>
              {invoice.customer?.phone && (
                <p className="mt-0.5 text-xs text-gray-500">📞 {invoice.customer.phone}</p>
              )}
              {invoice.customer?.email && (
                <p className="mt-0.5 text-xs text-gray-500">✉️ {invoice.customer.email}</p>
              )}
              {invoice.billing_address?.line1 && (
                <p className="mt-0.5 text-xs text-gray-500">
                  📍 {[invoice.billing_address.line1, invoice.billing_address.city].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Article</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">Qté</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Prix unit.</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.sku && (
                        <p className="mt-0.5 text-xs text-gray-400">SKU: {item.sku}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-600">{item.qty}</td>
                    <td className="px-4 py-3.5 text-right text-gray-600">
                      {fmtCurrency(item.unit_price, invoice.currency)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-900">
                      {fmtCurrency(item.total, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 bg-gray-50/40 p-6">
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sous-total</span>
                <span className="font-medium">{fmtCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.shipping > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Livraison</span>
                  <span className="font-medium">{fmtCurrency(invoice.shipping, invoice.currency)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remise</span>
                  <span className="font-medium text-red-500">-{fmtCurrency(invoice.discount, invoice.currency)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Taxes</span>
                  <span className="font-medium">{fmtCurrency(invoice.tax, invoice.currency)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-xl font-extrabold text-[#F15412]">
                    {fmtCurrency(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
              {invoice.paid > 0 && invoice.balance_due > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payé</span>
                  <span className="font-medium text-green-600">{fmtCurrency(invoice.paid, invoice.currency)}</span>
                </div>
              )}
              {invoice.balance_due > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-700">Reste à payer</span>
                  <span className="font-bold text-amber-600">{fmtCurrency(invoice.balance_due, invoice.currency)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs text-gray-400">
          <p>Facture générée automatiquement par <span className="font-semibold text-[#F15412]">Sugu</span></p>
          <p className="mt-1">
            Pour toute question, contactez le vendeur directement ou notre support à{" "}
            <a href="mailto:support@mysugu.com" className="text-[#F15412] hover:underline">
              support@mysugu.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
