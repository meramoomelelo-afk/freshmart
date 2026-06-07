const CATEGORY_IMAGES: Record<string, { emoji: string; color: string; images: string[] }> = {
  vegetables: {
    emoji: "🥦", color: "#16a34a",
    images: [
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80",
      "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=300&q=80",
      "https://images.unsplash.com/photo-1518977676601-b28d4e90ded6?w=300&q=80",
    ],
  },
  fruits: {
    emoji: "🍎", color: "#dc2626",
    images: [
      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&q=80",
      "https://images.unsplash.com/photo-1568702846914-96b305d2ead1?w=300&q=80",
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300&q=80",
    ],
  },
  dairy: {
    emoji: "🥛", color: "#2563eb",
    images: [
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=80",
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80",
    ],
  },
  eggs: {
    emoji: "🥚", color: "#f59e0b",
    images: [
      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&q=80",
    ],
  },
  snacks: {
    emoji: "🍿", color: "#ea580c",
    images: [
      "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&q=80",
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&q=80",
    ],
  },
  beverages: {
    emoji: "🥤", color: "#0891b2",
    images: [
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&q=80",
      "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=300&q=80",
    ],
  },
  bakery: {
    emoji: "🍞", color: "#b45309",
    images: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80",
      "https://images.unsplash.com/photo-1549931319-a545753467c8?w=300&q=80",
    ],
  },
  meat: {
    emoji: "🥩", color: "#be123c",
    images: [
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&q=80",
    ],
  },
  fish: {
    emoji: "🐟", color: "#0369a1",
    images: [
      "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=300&q=80",
    ],
  },
  grains: {
    emoji: "🌾", color: "#a16207",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80",
    ],
  },
  pulses: {
    emoji: "🫘", color: "#65a30d",
    images: [
      "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=300&q=80",
    ],
  },
  spices: {
    emoji: "🌶️", color: "#dc2626",
    images: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80",
    ],
  },
  oil: {
    emoji: "🫒", color: "#65a30d",
    images: [
      "https://images.unsplash.com/photo-1474979266404-7eadf1f34de6?w=300&q=80",
    ],
  },
  frozen: {
    emoji: "🧊", color: "#0284c7",
    images: [
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300&q=80",
    ],
  },
  organic: {
    emoji: "🌿", color: "#16a34a",
    images: [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80",
    ],
  },
  baby: {
    emoji: "🍼", color: "#ec4899",
    images: [
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=80",
    ],
  },
  cleaning: {
    emoji: "🧹", color: "#7c3aed",
    images: [
      "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80",
    ],
  },
  personal: {
    emoji: "🧴", color: "#ec4899",
    images: [
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&q=80",
    ],
  },
  tea: {
    emoji: "🍵", color: "#65a30d",
    images: [
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80",
    ],
  },
  coffee: {
    emoji: "☕", color: "#78350f",
    images: [
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&q=80",
    ],
  },
  chocolate: {
    emoji: "🍫", color: "#78350f",
    images: [
      "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&q=80",
    ],
  },
  noodles: {
    emoji: "🍜", color: "#ea580c",
    images: [
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
    ],
  },
  sauce: {
    emoji: "🫙", color: "#dc2626",
    images: [
      "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&q=80",
    ],
  },
  pasta: {
    emoji: "🍝", color: "#d97706",
    images: [
      "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&q=80",
    ],
  },
  honey: {
    emoji: "🍯", color: "#d97706",
    images: [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&q=80",
    ],
  },
  dry: {
    emoji: "🥜", color: "#a16207",
    images: [
      "https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=300&q=80",
    ],
  },
  sweets: {
    emoji: "🍬", color: "#e11d48",
    images: [
      "https://images.unsplash.com/photo-1548848221-0c2e497ed557?w=300&q=80",
    ],
  },
  ready: {
    emoji: "🍱", color: "#ea580c",
    images: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80",
    ],
  },
  pickle: {
    emoji: "🫙", color: "#be123c",
    images: [
      "https://images.unsplash.com/photo-1589135233689-6cd18f7f3b61?w=300&q=80",
    ],
  },
  health: {
    emoji: "💪", color: "#7c3aed",
    images: [
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&q=80",
    ],
  },
};

const PRODUCT_IMAGES: Record<string, string> = {
  tomato: "https://images.unsplash.com/photo-1546470427-0d4db154caa8?w=300&q=80",
  onion: "https://images.unsplash.com/photo-1587049016823-69ef9d68bd44?w=300&q=80",
  potato: "https://images.unsplash.com/photo-1518977676601-b28d4e90ded6?w=300&q=80",
  carrot: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&q=80",
  spinach: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&q=80",
  capsicum: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300&q=80",
  cucumber: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&q=80",
  cabbage: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=300&q=80",
  cauliflower: "https://images.unsplash.com/photo-1568702846914-96b305d2ead1?w=300&q=80",
  broccoli: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=300&q=80",
  lettuce: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&q=80",
  mushroom: "https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=300&q=80",
  ginger: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300&q=80",
  garlic: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2571?w=300&q=80",
  peas: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300&q=80",
  corn: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&q=80",
  apple: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80",
  banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80",
  mango: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80",
  orange: "https://images.unsplash.com/photo-1547514701-42782101795e?w=300&q=80",
  grapes: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300&q=80",
  watermelon: "https://images.unsplash.com/photo-1563114773-84221bd62daa?w=300&q=80",
  papaya: "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=300&q=80",
  pineapple: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=300&q=80",
  pomegranate: "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=300&q=80",
  strawberry: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&q=80",
  kiwi: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80",
  lemon: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=300&q=80",
  coconut: "https://images.unsplash.com/photo-1580984969071-a8da8bfac6d1?w=300&q=80",
  guava: "https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=300&q=80",
  milk: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=80",
  butter: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&q=80",
  cheese: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&q=80",
  yogurt: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80",
  curd: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80",
  paneer: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80",
  egg: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&q=80",
  bread: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80",
  cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80",
  biscuit: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80",
  cookie: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80",
  chips: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=300&q=80",
  namkeen: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&q=80",
  juice: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=300&q=80",
  cola: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80",
  water: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&q=80",
  tea: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80",
  coffee: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80",
  wheat: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&q=80",
  atta: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&q=80",
  dal: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=300&q=80",
  oil: "https://images.unsplash.com/photo-1474979266404-7eadf1f34de6?w=300&q=80",
  ghee: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80",
  sugar: "https://images.unsplash.com/photo-1581268372919-ad775f00f0ae?w=300&q=80",
  salt: "https://images.unsplash.com/photo-1518110925495-5fe2c8542029?w=300&q=80",
  chicken: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=80",
  mutton: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&q=80",
  fish: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=300&q=80",
  prawn: "https://images.unsplash.com/photo-1565680018093-ebb6e57e8401?w=300&q=80",
  chocolate: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&q=80",
  ice: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&q=80",
  noodle: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80",
  pasta: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&q=80",
  sauce: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&q=80",
  ketchup: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&q=80",
  honey: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&q=80",
  jam: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&q=80",
  pickle: "https://images.unsplash.com/photo-1589135233689-6cd18f7f3b61?w=300&q=80",
  almond: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=300&q=80",
  cashew: "https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=300&q=80",
  peanut: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=300&q=80",
  raisin: "https://images.unsplash.com/photo-1596273501048-9b9c8b3e8e4e?w=300&q=80",
};

export function getCategoryMeta(name: string): { emoji: string; color: string } {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_IMAGES)) {
    if (lower.includes(key)) return { emoji: val.emoji, color: val.color };
  }
  return { emoji: "📦", color: "#6b7280" };
}

export function getProductImage(productName: string, categoryName?: string): string {
  const lower = productName.toLowerCase();
  for (const [key, url] of Object.entries(PRODUCT_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  if (categoryName) {
    const catLower = categoryName.toLowerCase();
    for (const [key, val] of Object.entries(CATEGORY_IMAGES)) {
      if (catLower.includes(key) && val.images.length > 0) {
        return val.images[Math.floor(Math.random() * val.images.length)];
      }
    }
  }
  return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80";
}

export function getCategoryImage(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_IMAGES)) {
    if (lower.includes(key) && val.images.length > 0) {
      return val.images[0];
    }
  }
  return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80";
}

interface GeneratedProduct {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  unit: string;
  quantity: string;
  imageUrl: string;
  inStock: boolean;
  isFeatured: boolean;
  isOrganic: boolean;
  deliveryTime: string;
  rating: number;
  reviewCount: number;
  tags: string[];
}

const PRODUCT_TEMPLATES: Record<string, GeneratedProduct[]> = {
  vegetables: [
    { name: "Fresh Tomatoes", description: "Farm-fresh red tomatoes, perfect for curries", price: 32, originalPrice: 50, discount: 36, unit: "kg", quantity: "500g", imageUrl: PRODUCT_IMAGES.tomato, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.5, reviewCount: 892, tags: ["fresh", "daily"] },
    { name: "Green Spinach", description: "Fresh organic spinach leaves", price: 25, originalPrice: 35, discount: 29, unit: "bunch", quantity: "250g", imageUrl: PRODUCT_IMAGES.spinach, inStock: true, isFeatured: false, isOrganic: true, deliveryTime: "", rating: 4.3, reviewCount: 456, tags: ["organic", "leafy"] },
    { name: "Fresh Onions", description: "Premium quality onions", price: 35, originalPrice: 45, discount: 22, unit: "kg", quantity: "1 kg", imageUrl: PRODUCT_IMAGES.onion, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.2, reviewCount: 1234, tags: ["staple"] },
    { name: "Potatoes", description: "Clean and sorted potatoes", price: 30, originalPrice: 40, discount: 25, unit: "kg", quantity: "1 kg", imageUrl: PRODUCT_IMAGES.potato, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.4, reviewCount: 987, tags: ["staple"] },
    { name: "Fresh Capsicum", description: "Crunchy green bell peppers", price: 45, originalPrice: 60, discount: 25, unit: "pc", quantity: "2 pcs", imageUrl: PRODUCT_IMAGES.capsicum, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.1, reviewCount: 345, tags: ["fresh"] },
    { name: "Cucumber", description: "Fresh and crispy cucumbers", price: 28, originalPrice: 40, discount: 30, unit: "pc", quantity: "2 pcs", imageUrl: PRODUCT_IMAGES.cucumber, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.3, reviewCount: 567, tags: ["salad", "fresh"] },
    { name: "Carrots", description: "Orange carrots, rich in vitamin A", price: 40, originalPrice: 55, discount: 27, unit: "kg", quantity: "500g", imageUrl: PRODUCT_IMAGES.carrot, inStock: true, isFeatured: true, isOrganic: true, deliveryTime: "", rating: 4.5, reviewCount: 678, tags: ["organic", "healthy"] },
    { name: "Cauliflower", description: "Fresh white cauliflower", price: 38, originalPrice: 50, discount: 24, unit: "pc", quantity: "1 pc", imageUrl: PRODUCT_IMAGES.cauliflower, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.2, reviewCount: 412, tags: ["fresh"] },
  ],
  fruits: [
    { name: "Banana", description: "Ripe and sweet bananas", price: 45, originalPrice: 55, discount: 18, unit: "dozen", quantity: "1 dozen", imageUrl: PRODUCT_IMAGES.banana, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.6, reviewCount: 1567, tags: ["daily", "healthy"] },
    { name: "Fresh Apples", description: "Shimla apples, sweet and crunchy", price: 120, originalPrice: 160, discount: 25, unit: "kg", quantity: "1 kg", imageUrl: PRODUCT_IMAGES.apple, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.5, reviewCount: 890, tags: ["imported", "premium"] },
    { name: "Alphonso Mango", description: "Premium Ratnagiri Alphonso mangoes", price: 350, originalPrice: 450, discount: 22, unit: "kg", quantity: "1 kg", imageUrl: PRODUCT_IMAGES.mango, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.8, reviewCount: 2345, tags: ["premium", "seasonal"] },
    { name: "Fresh Oranges", description: "Juicy Nagpur oranges", price: 80, originalPrice: 100, discount: 20, unit: "kg", quantity: "1 kg", imageUrl: PRODUCT_IMAGES.orange, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.3, reviewCount: 567, tags: ["citrus", "vitamin-c"] },
    { name: "Grapes", description: "Sweet seedless grapes", price: 90, originalPrice: 120, discount: 25, unit: "kg", quantity: "500g", imageUrl: PRODUCT_IMAGES.grapes, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.4, reviewCount: 789, tags: ["sweet"] },
    { name: "Watermelon", description: "Sweet and refreshing watermelon", price: 35, originalPrice: 50, discount: 30, unit: "kg", quantity: "1 pc", imageUrl: PRODUCT_IMAGES.watermelon, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.2, reviewCount: 432, tags: ["refreshing", "seasonal"] },
    { name: "Strawberries", description: "Fresh Mahabaleshwar strawberries", price: 110, originalPrice: 150, discount: 27, unit: "box", quantity: "250g", imageUrl: PRODUCT_IMAGES.strawberry, inStock: true, isFeatured: true, isOrganic: true, deliveryTime: "", rating: 4.7, reviewCount: 1234, tags: ["premium", "organic"] },
    { name: "Pomegranate", description: "Ruby red pomegranate seeds", price: 95, originalPrice: 130, discount: 27, unit: "kg", quantity: "500g", imageUrl: PRODUCT_IMAGES.pomegranate, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.4, reviewCount: 567, tags: ["healthy", "antioxidant"] },
  ],
  dairy: [
    { name: "Full Cream Milk", description: "Fresh pasteurized full cream milk", price: 30, originalPrice: 32, discount: 6, unit: "litre", quantity: "500 ml", imageUrl: PRODUCT_IMAGES.milk, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.5, reviewCount: 2345, tags: ["daily", "fresh"] },
    { name: "Fresh Paneer", description: "Soft and fresh cottage cheese", price: 80, originalPrice: 95, discount: 16, unit: "pack", quantity: "200g", imageUrl: PRODUCT_IMAGES.paneer, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.4, reviewCount: 890, tags: ["protein", "fresh"] },
    { name: "Amul Butter", description: "Creamy salted butter", price: 55, originalPrice: 58, discount: 5, unit: "pack", quantity: "100g", imageUrl: PRODUCT_IMAGES.butter, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.6, reviewCount: 1567, tags: ["brand", "staple"] },
    { name: "Curd", description: "Fresh set curd, naturally thick", price: 40, originalPrice: 45, discount: 11, unit: "pack", quantity: "400g", imageUrl: PRODUCT_IMAGES.curd, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.3, reviewCount: 678, tags: ["probiotic", "fresh"] },
    { name: "Cheese Slices", description: "Processed cheese slices", price: 95, originalPrice: 110, discount: 14, unit: "pack", quantity: "200g", imageUrl: PRODUCT_IMAGES.cheese, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.2, reviewCount: 456, tags: ["processed"] },
    { name: "Farm Eggs", description: "Fresh farm eggs", price: 70, originalPrice: 85, discount: 18, unit: "pack", quantity: "6 pcs", imageUrl: PRODUCT_IMAGES.egg, inStock: true, isFeatured: true, isOrganic: true, deliveryTime: "", rating: 4.5, reviewCount: 1234, tags: ["protein", "farm-fresh"] },
  ],
  snacks: [
    { name: "Potato Chips", description: "Crunchy salted potato chips", price: 20, originalPrice: 25, discount: 20, unit: "pack", quantity: "100g", imageUrl: PRODUCT_IMAGES.chips, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.3, reviewCount: 2345, tags: ["crunchy", "snack"] },
    { name: "Namkeen Mix", description: "Traditional Indian snack mix", price: 45, originalPrice: 55, discount: 18, unit: "pack", quantity: "200g", imageUrl: PRODUCT_IMAGES.namkeen, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.4, reviewCount: 890, tags: ["traditional", "spicy"] },
    { name: "Digestive Biscuits", description: "Whole wheat digestive biscuits", price: 35, originalPrice: 40, discount: 13, unit: "pack", quantity: "250g", imageUrl: PRODUCT_IMAGES.biscuit, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.2, reviewCount: 567, tags: ["healthy", "fiber"] },
    { name: "Chocolate Cookies", description: "Rich dark chocolate cookies", price: 55, originalPrice: 70, discount: 21, unit: "pack", quantity: "150g", imageUrl: PRODUCT_IMAGES.cookie, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.5, reviewCount: 789, tags: ["chocolate", "premium"] },
    { name: "Instant Noodles", description: "Quick cook masala noodles", price: 14, originalPrice: 15, discount: 7, unit: "pack", quantity: "70g", imageUrl: PRODUCT_IMAGES.noodle, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.1, reviewCount: 3456, tags: ["instant", "quick-cook"] },
    { name: "Dark Chocolate", description: "70% cocoa dark chocolate bar", price: 90, originalPrice: 110, discount: 18, unit: "bar", quantity: "100g", imageUrl: PRODUCT_IMAGES.chocolate, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.6, reviewCount: 678, tags: ["premium", "cocoa"] },
  ],
  beverages: [
    { name: "Fresh Orange Juice", description: "100% pure orange juice", price: 65, originalPrice: 80, discount: 19, unit: "pack", quantity: "1 litre", imageUrl: PRODUCT_IMAGES.juice, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.4, reviewCount: 890, tags: ["juice", "vitamin-c"] },
    { name: "Green Tea", description: "Premium green tea bags", price: 120, originalPrice: 150, discount: 20, unit: "box", quantity: "25 bags", imageUrl: PRODUCT_IMAGES.tea, inStock: true, isFeatured: false, isOrganic: true, deliveryTime: "", rating: 4.5, reviewCount: 567, tags: ["healthy", "antioxidant"] },
    { name: "Instant Coffee", description: "Premium instant coffee powder", price: 180, originalPrice: 220, discount: 18, unit: "jar", quantity: "100g", imageUrl: PRODUCT_IMAGES.coffee, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.6, reviewCount: 1234, tags: ["premium", "aromatic"] },
    { name: "Mineral Water", description: "Purified mineral water", price: 20, originalPrice: 22, discount: 9, unit: "bottle", quantity: "1 litre", imageUrl: PRODUCT_IMAGES.water, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.2, reviewCount: 3456, tags: ["essential"] },
    { name: "Coconut Water", description: "100% natural tender coconut water", price: 35, originalPrice: 45, discount: 22, unit: "pack", quantity: "200 ml", imageUrl: PRODUCT_IMAGES.coconut, inStock: true, isFeatured: false, isOrganic: true, deliveryTime: "", rating: 4.5, reviewCount: 789, tags: ["natural", "hydrating"] },
  ],
  bakery: [
    { name: "Whole Wheat Bread", description: "Freshly baked whole wheat bread", price: 45, originalPrice: 55, discount: 18, unit: "loaf", quantity: "400g", imageUrl: PRODUCT_IMAGES.bread, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.3, reviewCount: 890, tags: ["fresh", "whole-wheat"] },
    { name: "Chocolate Cake", description: "Rich chocolate layered cake", price: 350, originalPrice: 450, discount: 22, unit: "pc", quantity: "500g", imageUrl: PRODUCT_IMAGES.cake, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.7, reviewCount: 567, tags: ["celebration", "premium"] },
    { name: "Butter Cookies", description: "Danish-style butter cookies", price: 120, originalPrice: 150, discount: 20, unit: "tin", quantity: "400g", imageUrl: PRODUCT_IMAGES.cookie, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.4, reviewCount: 456, tags: ["imported"] },
  ],
  meat: [
    { name: "Chicken Breast", description: "Boneless chicken breast, cleaned", price: 250, originalPrice: 320, discount: 22, unit: "kg", quantity: "500g", imageUrl: PRODUCT_IMAGES.chicken, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.4, reviewCount: 890, tags: ["protein", "fresh"] },
    { name: "Fresh Fish", description: "Cleaned and ready-to-cook fish", price: 300, originalPrice: 380, discount: 21, unit: "kg", quantity: "500g", imageUrl: PRODUCT_IMAGES.fish, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.3, reviewCount: 567, tags: ["omega-3", "fresh"] },
    { name: "Prawns", description: "Fresh cleaned prawns", price: 400, originalPrice: 500, discount: 20, unit: "kg", quantity: "250g", imageUrl: PRODUCT_IMAGES.prawn, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.5, reviewCount: 345, tags: ["seafood", "premium"] },
  ],
  grains: [
    { name: "Basmati Rice", description: "Premium aged basmati rice", price: 180, originalPrice: 220, discount: 18, unit: "kg", quantity: "1 kg", imageUrl: PRODUCT_IMAGES.rice, inStock: true, isFeatured: true, isOrganic: false, deliveryTime: "", rating: 4.6, reviewCount: 2345, tags: ["premium", "aromatic"] },
    { name: "Whole Wheat Atta", description: "Chakki ground whole wheat flour", price: 55, originalPrice: 65, discount: 15, unit: "kg", quantity: "1 kg", imageUrl: PRODUCT_IMAGES.atta, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.4, reviewCount: 1567, tags: ["staple", "whole-grain"] },
    { name: "Toor Dal", description: "Premium quality toor dal", price: 120, originalPrice: 145, discount: 17, unit: "kg", quantity: "1 kg", imageUrl: PRODUCT_IMAGES.dal, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.3, reviewCount: 890, tags: ["protein", "staple"] },
    { name: "Mustard Oil", description: "Cold pressed mustard oil", price: 160, originalPrice: 190, discount: 16, unit: "litre", quantity: "1 litre", imageUrl: PRODUCT_IMAGES.oil, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.2, reviewCount: 678, tags: ["cooking", "cold-pressed"] },
    { name: "Pure Ghee", description: "Traditional desi cow ghee", price: 550, originalPrice: 650, discount: 15, unit: "jar", quantity: "500 ml", imageUrl: PRODUCT_IMAGES.ghee, inStock: true, isFeatured: true, isOrganic: true, deliveryTime: "", rating: 4.7, reviewCount: 1234, tags: ["pure", "traditional", "organic"] },
    { name: "Sugar", description: "Refined white sugar", price: 42, originalPrice: 48, discount: 13, unit: "kg", quantity: "1 kg", imageUrl: PRODUCT_IMAGES.sugar, inStock: true, isFeatured: false, isOrganic: false, deliveryTime: "", rating: 4.1, reviewCount: 567, tags: ["staple"] },
  ],
};

export function getProductTemplates(categoryName: string): GeneratedProduct[] {
  const lower = categoryName.toLowerCase();
  for (const [key, templates] of Object.entries(PRODUCT_TEMPLATES)) {
    if (lower.includes(key)) return templates;
  }
  return PRODUCT_TEMPLATES.vegetables;
}
