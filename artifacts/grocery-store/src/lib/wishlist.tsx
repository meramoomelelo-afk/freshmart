import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface WishlistContextType {
  items: string[];
  toggle: (productId: string) => void;
  isWished: (productId: string) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  toggle: () => {},
  isWished: () => false,
  count: 0,
});

const STORAGE_KEY = "store_wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(() => {
    try {
      let saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const legacy = localStorage.getItem("freshmart_wishlist");
        if (legacy) { saved = legacy; localStorage.setItem(STORAGE_KEY, legacy); localStorage.removeItem("freshmart_wishlist"); }
      }
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const toggle = useCallback((productId: string) => {
    setItems(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const isWished = useCallback((productId: string) => items.includes(productId), [items]);

  return (
    <WishlistContext.Provider value={{ items, toggle, isWished, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
