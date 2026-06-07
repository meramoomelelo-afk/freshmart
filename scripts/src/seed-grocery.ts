import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const categories = [
  { name: "Vegetables", slug: "vegetables", icon: "🥦", color: "#22c55e", productCount: 0 },
  { name: "Fruits", slug: "fruits", icon: "🍎", color: "#f97316", productCount: 0 },
  { name: "Dairy & Eggs", slug: "dairy-eggs", icon: "🥛", color: "#3b82f6", productCount: 0 },
  { name: "Snacks", slug: "snacks", icon: "🍿", color: "#a855f7", productCount: 0 },
  { name: "Beverages", slug: "beverages", icon: "🧃", color: "#06b6d4", productCount: 0 },
  { name: "Bakery", slug: "bakery", icon: "🍞", color: "#f59e0b", productCount: 0 },
  { name: "Meat & Fish", slug: "meat-fish", icon: "🐟", color: "#ef4444", productCount: 0 },
  { name: "Grains & Pulses", slug: "grains-pulses", icon: "🌾", color: "#8b5cf6", productCount: 0 },
];

const productData = [
  // Vegetables
  { name: "Fresh Tomatoes", description: "Farm-fresh ripe tomatoes, perfect for salads and curries. Rich in lycopene and antioxidants.", price: "29.00", originalPrice: "45.00", discount: 36, unit: "kg", quantity: "500g", categoryName: "Vegetables", imageUrl: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80", inStock: true, rating: "4.5", reviewCount: 892, isFeatured: true, isOrganic: true, tags: ["fresh", "organic", "local"], deliveryTime: "10 mins" },
  { name: "Baby Spinach", description: "Tender baby spinach leaves, washed and ready to eat. Rich in iron and vitamins.", price: "39.00", originalPrice: "55.00", discount: 29, unit: "pack", quantity: "200g", categoryName: "Vegetables", imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80", inStock: true, rating: "4.3", reviewCount: 567, isFeatured: false, isOrganic: true, tags: ["organic", "leafy"], deliveryTime: "10 mins" },
  { name: "Broccoli", description: "Fresh green broccoli florets, sourced directly from local farms. A superfood packed with nutrients.", price: "55.00", originalPrice: "80.00", discount: 31, unit: "piece", quantity: "500g", categoryName: "Vegetables", imageUrl: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80", inStock: true, rating: "4.4", reviewCount: 421, isFeatured: true, isOrganic: false, tags: ["superfood", "fresh"], deliveryTime: "10 mins" },
  { name: "Onions", description: "Fresh red onions, essential for every Indian kitchen. Perfect for curries, gravies and salads.", price: "25.00", originalPrice: "35.00", discount: 29, unit: "kg", quantity: "1 kg", categoryName: "Vegetables", imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80", inStock: true, rating: "4.6", reviewCount: 1243, isFeatured: false, isOrganic: false, tags: ["staple", "fresh"], deliveryTime: "10 mins" },
  { name: "Potatoes", description: "Farm fresh potatoes perfect for boiling, frying or baking. Versatile and nutritious.", price: "30.00", originalPrice: "42.00", discount: 29, unit: "kg", quantity: "1 kg", categoryName: "Vegetables", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80", inStock: true, rating: "4.7", reviewCount: 2100, isFeatured: false, isOrganic: false, tags: ["staple", "fresh"], deliveryTime: "10 mins" },
  { name: "Carrots", description: "Sweet and crunchy fresh carrots. Excellent source of beta-carotene and fiber.", price: "35.00", originalPrice: "50.00", discount: 30, unit: "kg", quantity: "500g", categoryName: "Vegetables", imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80", inStock: true, rating: "4.4", reviewCount: 678, isFeatured: false, isOrganic: true, tags: ["organic", "fresh"], deliveryTime: "10 mins" },
  { name: "Bell Peppers", description: "Colourful tri-colour bell peppers loaded with Vitamin C. Adds colour and crunch to any dish.", price: "75.00", originalPrice: "99.00", discount: 24, unit: "pack", quantity: "3 pcs", categoryName: "Vegetables", imageUrl: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80", inStock: true, rating: "4.2", reviewCount: 342, isFeatured: true, isOrganic: false, tags: ["colourful", "fresh"], deliveryTime: "10 mins" },
  { name: "Cucumber", description: "Cool and refreshing farm-fresh cucumbers. Perfect for salads, raita and detox water.", price: "22.00", originalPrice: "32.00", discount: 31, unit: "piece", quantity: "2 pcs", categoryName: "Vegetables", imageUrl: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&q=80", inStock: true, rating: "4.3", reviewCount: 543, isFeatured: false, isOrganic: false, tags: ["fresh", "cooling"], deliveryTime: "10 mins" },

  // Fruits
  { name: "Alphonso Mangoes", description: "Premium Alphonso mangoes - the king of fruits. Sweet, rich and aromatic. Limited season!", price: "299.00", originalPrice: "399.00", discount: 25, unit: "dozen", quantity: "12 pcs", categoryName: "Fruits", imageUrl: "https://images.unsplash.com/photo-1605027990121-cbae9e0642df?w=400&q=80", inStock: true, rating: "4.9", reviewCount: 3421, isFeatured: true, isOrganic: false, tags: ["seasonal", "premium", "bestseller"], deliveryTime: "10 mins" },
  { name: "Bananas", description: "Fresh Robusta bananas from Kerala. Natural energy booster, rich in potassium.", price: "45.00", originalPrice: "60.00", discount: 25, unit: "dozen", quantity: "12 pcs", categoryName: "Fruits", imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80", inStock: true, rating: "4.5", reviewCount: 2156, isFeatured: false, isOrganic: false, tags: ["fresh", "energy"], deliveryTime: "10 mins" },
  { name: "Red Apples", description: "Premium imported Fuji apples. Crisp, sweet and juicy. Packed with fiber and Vitamin C.", price: "149.00", originalPrice: "199.00", discount: 25, unit: "kg", quantity: "4 pcs", categoryName: "Fruits", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80", inStock: true, rating: "4.6", reviewCount: 1876, isFeatured: true, isOrganic: false, tags: ["imported", "premium"], deliveryTime: "10 mins" },
  { name: "Watermelon", description: "Sweet and refreshing summer watermelon. 90% water content keeps you hydrated.", price: "89.00", originalPrice: "120.00", discount: 26, unit: "piece", quantity: "1 pc (2-3 kg)", categoryName: "Fruits", imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80", inStock: true, rating: "4.7", reviewCount: 987, isFeatured: true, isOrganic: false, tags: ["summer", "hydrating"], deliveryTime: "10 mins" },
  { name: "Strawberries", description: "Plump and juicy fresh strawberries from Mahabaleshwar. Perfect for desserts and smoothies.", price: "99.00", originalPrice: "149.00", discount: 34, unit: "box", quantity: "250g", categoryName: "Fruits", imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80", inStock: true, rating: "4.8", reviewCount: 1234, isFeatured: true, isOrganic: true, tags: ["premium", "organic", "seasonal"], deliveryTime: "10 mins" },
  { name: "Oranges", description: "Juicy Nagpur oranges loaded with Vitamin C. Perfect for fresh juice or eating fresh.", price: "69.00", originalPrice: "95.00", discount: 27, unit: "kg", quantity: "6 pcs", categoryName: "Fruits", imageUrl: "https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80", inStock: true, rating: "4.4", reviewCount: 876, isFeatured: false, isOrganic: false, tags: ["vitamin-c", "juicy"], deliveryTime: "10 mins" },
  { name: "Grapes (Black)", description: "Fresh seedless black grapes, sweet and rich in antioxidants. Great as a healthy snack.", price: "85.00", originalPrice: "120.00", discount: 29, unit: "kg", quantity: "500g", categoryName: "Fruits", imageUrl: "https://images.unsplash.com/photo-1474804153272-fb0e2002c00d?w=400&q=80", inStock: true, rating: "4.5", reviewCount: 654, isFeatured: false, isOrganic: false, tags: ["seedless", "antioxidants"], deliveryTime: "10 mins" },

  // Dairy & Eggs
  { name: "Full Fat Milk", description: "Fresh full cream milk from Amul. Rich in calcium and protein. Pasteurised for safety.", price: "60.00", originalPrice: "68.00", discount: 12, unit: "liter", quantity: "1L", categoryName: "Dairy & Eggs", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80", inStock: true, rating: "4.6", reviewCount: 4231, isFeatured: false, isOrganic: false, tags: ["amul", "fresh", "pasteurised"], deliveryTime: "10 mins" },
  { name: "Paneer", description: "Fresh soft paneer made from pure cow milk. Perfect for curries, tikkas and snacks.", price: "89.00", originalPrice: "110.00", discount: 19, unit: "pack", quantity: "200g", categoryName: "Dairy & Eggs", imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80", inStock: true, rating: "4.7", reviewCount: 2341, isFeatured: true, isOrganic: false, tags: ["protein", "fresh"], deliveryTime: "10 mins" },
  { name: "Farm Eggs", description: "Free range farm eggs from healthy hens. Rich in protein, omega-3 and vitamins.", price: "79.00", originalPrice: "95.00", discount: 17, unit: "dozen", quantity: "12 eggs", categoryName: "Dairy & Eggs", imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80", inStock: true, rating: "4.8", reviewCount: 3102, isFeatured: true, isOrganic: true, tags: ["free-range", "organic", "protein"], deliveryTime: "10 mins" },
  { name: "Greek Yogurt", description: "Thick and creamy Greek yogurt, high in protein. Perfect for breakfast or as a healthy snack.", price: "89.00", originalPrice: "110.00", discount: 19, unit: "cup", quantity: "400g", categoryName: "Dairy & Eggs", imageUrl: "https://images.unsplash.com/photo-1488477181228-c2b9efbb3f4c?w=400&q=80", inStock: true, rating: "4.5", reviewCount: 876, isFeatured: false, isOrganic: false, tags: ["protein", "healthy"], deliveryTime: "10 mins" },

  // Snacks
  { name: "Lay's Classic Salted", description: "Crispy potato chips with classic salted flavour. India's most loved snack.", price: "20.00", originalPrice: "25.00", discount: 20, unit: "pack", quantity: "52g", categoryName: "Snacks", imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80", inStock: true, rating: "4.4", reviewCount: 5431, isFeatured: false, isOrganic: false, tags: ["chips", "crispy"], deliveryTime: "10 mins" },
  { name: "Roasted Peanuts", description: "Crunchy roasted peanuts lightly seasoned. A protein-rich, healthy snacking option.", price: "45.00", originalPrice: "60.00", discount: 25, unit: "pack", quantity: "300g", categoryName: "Snacks", imageUrl: "https://images.unsplash.com/photo-1567892737950-30c4db37e9d9?w=400&q=80", inStock: true, rating: "4.3", reviewCount: 1234, isFeatured: false, isOrganic: false, tags: ["protein", "healthy", "roasted"], deliveryTime: "10 mins" },
  { name: "Dark Chocolate", description: "Premium 70% dark chocolate with rich cocoa flavour. Loaded with antioxidants.", price: "149.00", originalPrice: "199.00", discount: 25, unit: "bar", quantity: "100g", categoryName: "Snacks", imageUrl: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80", inStock: true, rating: "4.6", reviewCount: 2134, isFeatured: true, isOrganic: false, tags: ["premium", "antioxidants", "dark"], deliveryTime: "10 mins" },

  // Beverages
  { name: "Tropicana Orange Juice", description: "100% pure squeezed orange juice, no added sugar or preservatives. Refreshing and healthy.", price: "99.00", originalPrice: "130.00", discount: 24, unit: "pack", quantity: "1L", categoryName: "Beverages", imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80", inStock: true, rating: "4.4", reviewCount: 2341, isFeatured: true, isOrganic: false, tags: ["no-sugar", "100%juice", "vitamin-c"], deliveryTime: "10 mins" },
  { name: "Green Tea (Tulsi)", description: "Organic green tea with tulsi leaves. Calms the mind and boosts immunity.", price: "149.00", originalPrice: "199.00", discount: 25, unit: "box", quantity: "25 bags", categoryName: "Beverages", imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80", inStock: true, rating: "4.5", reviewCount: 987, isFeatured: false, isOrganic: true, tags: ["organic", "immunity", "calming"], deliveryTime: "10 mins" },
  { name: "Coca-Cola", description: "The classic refreshing cola. Ice cold Coke is the perfect companion for any meal.", price: "40.00", originalPrice: "50.00", discount: 20, unit: "bottle", quantity: "750ml", categoryName: "Beverages", imageUrl: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80", inStock: true, rating: "4.3", reviewCount: 4532, isFeatured: false, isOrganic: false, tags: ["classic", "refreshing"], deliveryTime: "10 mins" },

  // Bakery
  { name: "Whole Wheat Bread", description: "Freshly baked whole wheat bread with added fibre. No maida, no preservatives.", price: "45.00", originalPrice: "55.00", discount: 18, unit: "loaf", quantity: "400g", categoryName: "Bakery", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80", inStock: true, rating: "4.5", reviewCount: 1876, isFeatured: false, isOrganic: false, tags: ["whole-grain", "healthy", "fresh"], deliveryTime: "10 mins" },
  { name: "Butter Croissants", description: "Flaky, buttery croissants baked fresh every morning. A French classic done right.", price: "79.00", originalPrice: "99.00", discount: 20, unit: "pack", quantity: "4 pcs", categoryName: "Bakery", imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80", inStock: true, rating: "4.7", reviewCount: 987, isFeatured: true, isOrganic: false, tags: ["french", "buttery", "fresh"], deliveryTime: "10 mins" },

  // Meat & Fish
  { name: "Chicken Breast", description: "Fresh boneless chicken breast from free-range birds. Lean protein powerhouse.", price: "199.00", originalPrice: "250.00", discount: 20, unit: "pack", quantity: "500g", categoryName: "Meat & Fish", imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d11bca?w=400&q=80", inStock: true, rating: "4.6", reviewCount: 2345, isFeatured: true, isOrganic: false, tags: ["fresh", "lean", "protein"], deliveryTime: "15 mins" },
  { name: "Salmon Fillet", description: "Wild-caught Atlantic salmon, rich in omega-3 fatty acids. Freshness guaranteed.", price: "399.00", originalPrice: "499.00", discount: 20, unit: "pack", quantity: "300g", categoryName: "Meat & Fish", imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80", inStock: true, rating: "4.8", reviewCount: 987, isFeatured: true, isOrganic: false, tags: ["omega-3", "wild-caught", "premium"], deliveryTime: "15 mins" },

  // Grains & Pulses
  { name: "Basmati Rice", description: "Premium long grain basmati rice from the foothills of the Himalayas. Aromatic and flavourful.", price: "189.00", originalPrice: "249.00", discount: 24, unit: "kg", quantity: "5 kg", categoryName: "Grains & Pulses", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80", inStock: true, rating: "4.7", reviewCount: 4321, isFeatured: true, isOrganic: false, tags: ["premium", "aromatic", "himalayan"], deliveryTime: "10 mins" },
  { name: "Toor Dal", description: "Premium quality toor dal for authentic Indian dal tadka. High in protein and fibre.", price: "119.00", originalPrice: "149.00", discount: 20, unit: "kg", quantity: "1 kg", categoryName: "Grains & Pulses", imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80", inStock: true, rating: "4.5", reviewCount: 2134, isFeatured: false, isOrganic: false, tags: ["protein", "staple", "dal"], deliveryTime: "10 mins" },
];

async function seed() {
  console.log("Clearing existing data...");
  await db.delete(productsTable);
  await db.delete(categoriesTable);

  console.log("Seeding categories...");
  const insertedCategories = await db.insert(categoriesTable).values(categories).returning();
  console.log(`Inserted ${insertedCategories.length} categories`);

  const categoryMap: Record<string, number> = {};
  for (const cat of insertedCategories) {
    categoryMap[cat.name] = cat.id;
  }

  console.log("Seeding products...");
  const productsWithCategoryIds = productData.map((p) => ({
    ...p,
    categoryId: categoryMap[p.categoryName] ?? 1,
  }));

  const insertedProducts = await db.insert(productsTable).values(productsWithCategoryIds).returning();
  console.log(`Inserted ${insertedProducts.length} products`);

  console.log("Updating category product counts...");
  for (const cat of insertedCategories) {
    const countForCat = productsWithCategoryIds.filter(p => p.categoryName === cat.name).length;
    await db
      .update(categoriesTable)
      .set({ productCount: countForCat })
      .where(eq(categoriesTable.id, cat.id));
  }

  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
