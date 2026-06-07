import type { QueryClient } from "@tanstack/react-query";
import { getGetCartQueryKey, type Product } from "@workspace/api-client-react";

const DELIVERY_FEE = 25;
const FREE_DELIVERY_THRESHOLD = 299;

type CartItem = {
  id?: string;
  productId: string;
  product: Product;
  quantity: number;
  [k: string]: any;
};

type CartData = {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  [k: string]: any;
};

function recompute(cart: CartData): CartData {
  const subtotal = cart.items.reduce((s, i) => {
    const price = Number(i.variantPrice ?? i.product?.price) || 0;
    return s + price * i.quantity;
  }, 0);
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const deliveryFee = itemCount === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = itemCount > 0 ? subtotal + deliveryFee : 0;
  return {
    ...cart,
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee,
    total: Math.round(total * 100) / 100,
    itemCount,
  };
}

export type CartCtx = { prev: CartData | undefined };

// Match a cart item to a specific (productId, variantLabel) combo
function matchItem(item: CartItem, productId: string, variantLabel?: string): boolean {
  if (String(item.productId) !== String(productId)) return false;
  if (variantLabel !== undefined) {
    return (item.variantLabel ?? null) === (variantLabel ?? null);
  }
  return true;
}

// Fully synchronous — fires in the same JS frame as the tap, zero delay
export function optimisticSetQty(
  qc: QueryClient,
  product: Product,
  newQty: number,
  variantLabel?: string,
  variantPrice?: number,
): CartCtx {
  const key = getGetCartQueryKey();
  const prev = qc.getQueryData<CartData>(key);
  const base: CartData = prev ?? { items: [], subtotal: 0, deliveryFee: 0, total: 0, itemCount: 0 };
  const items = [...base.items];
  // Match by productId + variantLabel so each variant is treated as its own item
  const idx = items.findIndex((i) => matchItem(i, String(product.id), variantLabel));
  if (newQty <= 0) {
    if (idx >= 0) items.splice(idx, 1);
  } else if (idx >= 0) {
    items[idx] = {
      ...items[idx],
      quantity: newQty,
      ...(variantLabel !== undefined && { variantLabel }),
      ...(variantPrice !== undefined && { variantPrice }),
    };
  } else {
    items.push({
      productId: String(product.id),
      product,
      quantity: newQty,
      ...(variantLabel !== undefined && { variantLabel }),
      ...(variantPrice !== undefined && { variantPrice }),
    });
  }
  qc.setQueryData<CartData>(key, recompute({ ...base, items }));
  // Cancel in-flight queries after update so they don't overwrite our optimistic state
  qc.cancelQueries({ queryKey: key });
  return { prev };
}

export function rollbackCart(qc: QueryClient, ctx: CartCtx | undefined) {
  if (!ctx) return;
  qc.setQueryData(getGetCartQueryKey(), ctx.prev);
}

export function invalidateCart(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: getGetCartQueryKey() });
}
