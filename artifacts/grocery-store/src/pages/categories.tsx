import { Link } from "wouter";
import { useGetCategories } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";

const CATEGORY_GRADIENTS: Record<string, string> = {
  vegetables: "from-[#e8f5e9] to-[#c8e6c9]",
  fruits: "from-[#fff3e0] to-[#ffe0b2]",
  "dairy-eggs": "from-[#e3f2fd] to-[#bbdefb]",
  dairy: "from-[#e3f2fd] to-[#bbdefb]",
  snacks: "from-[#fce4ec] to-[#f8bbd0]",
  beverages: "from-[#e0f2f1] to-[#b2dfdb]",
  bakery: "from-[#fff8e1] to-[#ffecb3]",
  "meat-fish": "from-[#fbe9e7] to-[#ffccbc]",
  meat: "from-[#fbe9e7] to-[#ffccbc]",
  "grains-pulses": "from-[#f3e5f5] to-[#e1bee7]",
  grains: "from-[#f3e5f5] to-[#e1bee7]",
  "spices-masala": "from-[#fef2f2] to-[#fecaca]",
  spices: "from-[#fef2f2] to-[#fecaca]",
  "oil-ghee": "from-[#f0fdf4] to-[#dcfce7]",
  oil: "from-[#f0fdf4] to-[#dcfce7]",
  "dry-fruits": "from-[#fefce8] to-[#fef9c3]",
  "tea-coffee": "from-[#fdf4ff] to-[#fae8ff]",
  cleaning: "from-[#f5f3ff] to-[#ede9fe]",
  "personal-care": "from-[#fdf2f8] to-[#fce7f3]",
  personal: "from-[#fdf2f8] to-[#fce7f3]",
  "frozen-foods": "from-[#f0f9ff] to-[#e0f2fe]",
  frozen: "from-[#f0f9ff] to-[#e0f2fe]",
  "baby-care": "from-[#fdf2f8] to-[#fce7f3]",
  baby: "from-[#fdf2f8] to-[#fce7f3]",
  health: "from-[#f5f3ff] to-[#ede9fe]",
  organic: "from-[#ecfdf5] to-[#d1fae5]",
  pulses: "from-[#fefce8] to-[#fef9c3]",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
};

export function Categories() {
  const { data: categories, isLoading } = useGetCategories();

  return (
    <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-5 pb-24 md:pb-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#f3c614]" />
          <h1 className="text-[22px] md:text-[26px] font-black text-gray-900">All Categories</h1>
        </div>
        <p className="text-[13px] text-gray-500 ml-7">
          Choose from {categories?.length ?? "..."} categories and start shopping
        </p>
      </motion.div>

      {/* Category Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[160px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4"
        >
          {categories?.map((cat) => {
            const gradient = CATEGORY_GRADIENTS[cat.slug] ?? Object.entries(CATEGORY_GRADIENTS).find(([key]) => cat.slug.includes(key) || key.includes(cat.slug))?.[1] ?? "from-[#f5f5f5] to-[#eeeeee]";
            return (
              <motion.div key={cat.id} variants={item}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="block"
                  data-testid={`link-category-${cat.id}`}
                >
                  <div className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-4 md:p-5 h-[140px] md:h-[160px] flex flex-col justify-between overflow-hidden group cursor-pointer border border-white/50 shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
                    {/* Icon */}
                    <div className="text-5xl md:text-6xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300 self-end -mr-1 -mt-1">
                      {cat.icon}
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-[14px] md:text-[16px] font-bold text-gray-900 leading-tight">
                        {cat.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[11px] text-gray-600 font-medium">
                          {cat.productCount} items
                        </span>
                        <ChevronRight className="w-3 h-3 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Decorative circle */}
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Browse all link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0c831f] hover:underline"
        >
          Browse all products <ChevronRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
