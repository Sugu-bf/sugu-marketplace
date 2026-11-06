import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb, Container } from "@/components/ui";
import { ServiceUnavailable } from "@/components/ServiceUnavailable";
import { getAuthState } from "@/lib/api/auth";
import { isApiError } from "@/lib/api";
import { createMetadata } from "@/lib/metadata";
import { fetchGroupBuy } from "@/features/group-buy/api/group-buy.api";
import { normalizeGroupCode } from "@/features/group-buy/api/group-buy.endpoints";
import type { GroupBuyDetailResponse } from "@/features/group-buy/api/group-buy.schemas";
import { formatCentimes } from "@/features/group-buy/lib/group-buy-format";
import { GroupBuyPageClient } from "@/features/group-buy/components/GroupBuyPageClient";

/** Live and viewer-specific (membership): never prerendered or cached. */
export const dynamic = "force-dynamic";

interface GroupPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ ref?: string; new?: string; expired?: string }>;
}

type Loaded = { kind: "ok"; response: GroupBuyDetailResponse } | { kind: "missing" } | { kind: "unavailable" };

/** One read per request, shared by the metadata and the page. */
const loadGroup = cache(async (code: string): Promise<Loaded> => {
  try {
    return { kind: "ok", response: await fetchGroupBuy(code) };
  } catch (error) {
    if (isApiError(error) && error.status === 404) return { kind: "missing" };
    return { kind: "unavailable" };
  }
});

const REF_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const { code: raw } = await params;
  const code = normalizeGroupCode(raw);
  const path = `/groupe/${code ?? encodeURIComponent(raw)}`;
  const loaded = code ? await loadGroup(code) : ({ kind: "missing" } as const);

  if (loaded.kind !== "ok") {
    return createMetadata({ title: "Achat groupé", path, noIndex: true });
  }

  const group = loaded.response.data;
  const product = group.product?.name ?? "un produit";
  const description =
    group.status === "open"
      ? `${group.members_count} membre${group.members_count > 1 ? "s" : ""}, déjà ${formatCentimes(group.current_unit_price)} l’unité. Rejoignez le groupe : plus on est nombreux, moins on paie.`
      : `Achat groupé sur Sugu : ${product}.`;

  // Groups live a few days and some are private: kept out of search results,
  // while a shared link still shows a preview.
  return createMetadata({
    title: `Achat groupé : ${product}`,
    description,
    path,
    image: group.product?.image_url ?? undefined,
    noIndex: true,
  });
}

export default async function GroupBuyPage({ params, searchParams }: GroupPageProps) {
  const { code: raw } = await params;
  const code = normalizeGroupCode(raw);
  if (!code) notFound();

  const [loaded, auth, query] = await Promise.all([loadGroup(code), getAuthState(), searchParams]);
  if (loaded.kind === "missing") notFound();
  if (loaded.kind === "unavailable") return <ServiceUnavailable retryHref={`/groupe/${code}`} />;

  const group = loaded.response.data;
  const refCode = typeof query.ref === "string" && REF_PATTERN.test(query.ref) ? query.ref : null;

  return (
    <main className="pb-16">
      <Container className="pb-4 pt-4">
        <Breadcrumb
          items={[
            { label: "Achats groupés", href: "/achats-groupes" },
            { label: group.product?.name ?? `Groupe ${group.code}` },
          ]}
        />
      </Container>
      <Container>
        <GroupBuyPageClient
          initial={loaded.response}
          isSignedIn={auth.status === "authenticated"}
          refCode={refCode}
          justLaunched={query.new === "1"}
          sessionExpired={query.expired === "1"}
        />
      </Container>
    </main>
  );
}
