import { useParams, Link } from "wouter";
import { useGetProducts, useGetCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

export function Category() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const { data: categories, isLoading: isLoadingCategories } = useGetCategories();

  const category = useMemo(() => categories?.find(c => c.slug === slug), [categories, slug]);

  const { data: products, isLoading: isLoadingProducts } = useGetProducts(
    { categoryId: category?.id },
    { query: { enabled: !!category?.id } }
  );

  if (isLoadingCategories) {
    return (
      <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full rounded-2xl mb-6" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Category not found</h2>
        <Link href="/products" className="text-[#0c831f] font-semibold hover:underline text-[14px]">
          Browse all products →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4 pb-20 md:pb-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#0c831f] transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/products" className="hover:text-[#0c831f] transition-colors">Categories</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800 font-medium">{category.icon} {category.name}</span>
      </nav>

      {/* Category banner */}
      <div
        className="rounded-2xl p-5 mb-5 flex items-center gap-4"
        style={{ backgroundColor: (category.color ?? "#0c831f") + "18" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl bg-white shadow-sm shrink-0"
        >
          {category.icon}
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">{category.name}</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {isLoadingProducts ? "Loading..." : `${products?.length ?? 0} products available`}
          </p>
        </div>
      </div>

      {/* Grid */}
      {isLoadingProducts ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-[220px] rounded-xl" />)}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl py-16 text-center border border-gray-100">
          <div className="text-4xl mb-3">{category.icon}</div>
          <p className="text-[14px] text-gray-500">No products in this category yet.</p>
        </div>
      )}
    </div>
  );
}
