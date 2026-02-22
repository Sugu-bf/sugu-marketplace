import Image from "next/image";
import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb } from "@/components/ui";
import {
  queryCategoryBySlug,
  querySubcategories,
  queryCategoryProducts,
  queryCategoryProductCount,
} from "@/features/category";
import CategoryPageClient from "./CategoryPageClient";

// ─── Dynamic Metadata ────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await queryCategoryBySlug(slug);

  if (!category) {
    return createMetadata({
      title: "Catégorie introuvable",
      description: "La catégorie demandée n'existe pas.",
      path: `/category/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: category.name,
    description:
      category.description ??
      `Parcourez les produits de la catégorie ${category.name} sur Sugu. ${category.productCount} produits disponibles.`,
    path: `/category/${slug}`,
  });
}

// ─── Page Component ──────────────────────────────────────────

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch all category data in parallel (SSR)
  const [category, subcategories, products, totalProducts] = await Promise.all([
    queryCategoryBySlug(slug),
    querySubcategories(slug),
    queryCategoryProducts(slug),
    queryCategoryProductCount(slug),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <>
      {/* ─── Category Hero Banner ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        </div>

        <Container className="relative py-10 sm:py-14 lg:py-16">
          <div className="flex items-center gap-6 lg:gap-10">
            {/* Text content */}
            <div className="flex-1 min-w-0">
              <Breadcrumb
                items={[
                  { label: "Catégories", href: "/" },
                  { label: category.name },
                ]}
                className="mb-4 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/40"
              />
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base leading-relaxed line-clamp-2">
                  {category.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3.5 py-1.5 text-sm font-medium text-white">
                  {totalProducts} produit{totalProducts !== 1 ? "s" : ""}
                </span>
                {subcategories.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3.5 py-1.5 text-sm font-medium text-white">
                    {subcategories.length} sous-catégorie
                    {subcategories.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Category image */}
            <div className="hidden sm:block flex-shrink-0">
              <div className="relative h-32 w-32 lg:h-40 lg:w-40 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm shadow-xl ring-1 ring-white/20">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-contain p-4 drop-shadow-lg"
                  sizes="(max-width: 1024px) 128px, 160px"
                  priority
                />
              </div>
            </div>
          </div>
        </Container>

        {/* Bottom wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-6 sm:h-8"
            preserveAspectRatio="none"
          >
            <path
              d="M0 48h1440V24c-240 16-480 24-720 24S240 40 0 24v24z"
              fill="var(--color-background)"
            />
          </svg>
        </div>
      </section>

      {/* ─── Main Content ──────────────────────────────────────── */}
      <Container as="section" className="py-6 sm:py-8">
        <CategoryPageClient
          categoryName={category.name}
          categorySlug={slug}
          products={products}
          subcategories={subcategories}
          totalProducts={totalProducts}
        />
      </Container>
    </>
  );
}
