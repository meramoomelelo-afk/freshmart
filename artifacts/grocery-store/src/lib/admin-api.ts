import { apiRequest as request } from "./api-client";

export const adminApi = {
  checkSetup: () => request("/admin/check-setup"),
  setup: (data: { username: string; password: string; displayName: string }) =>
    request("/admin/setup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { username: string; password: string }) =>
    request("/admin/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request("/admin/logout", { method: "POST" }),
  me: () => request("/admin/me"),

  getDashboard: () => request("/admin/dashboard"),

  getProducts: (params?: { search?: string; categoryId?: string; onSale?: string; page?: string }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.categoryId) sp.set("categoryId", params.categoryId);
    if (params?.onSale) sp.set("onSale", params.onSale);
    if (params?.page) sp.set("page", params.page);
    return request(`/admin/products?${sp.toString()}`);
  },
  createProduct: (data: any) => request("/admin/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: any) => request(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request(`/admin/products/${id}`, { method: "DELETE" }),

  getCategories: () => request("/admin/categories"),
  createCategory: (data: any) => request("/admin/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: number, data: any) => request(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id: number) => request(`/admin/categories/${id}`, { method: "DELETE" }),

  getOrders: (params?: { status?: string; page?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.page) sp.set("page", params.page);
    return request(`/admin/orders?${sp.toString()}`);
  },
  updateOrderStatus: (id: string, status: string) =>
    request(`/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  updateOrderDeliverySlot: (id: string, deliverySlot: string) =>
    request(`/admin/orders/${id}/delivery-slot`, { method: "PUT", body: JSON.stringify({ deliverySlot }) }),
  updateOrderItems: (id: string, items: any[], total: number) =>
    request(`/admin/orders/${id}/items`, { method: "PUT", body: JSON.stringify({ items, total }) }),
  sendOrderBill: (id: string) =>
    request(`/admin/orders/${id}/send-bill`, { method: "POST" }),

  getSettings: () => request("/admin/settings"),
  updateSettings: (data: any) => request("/admin/settings", { method: "PUT", body: JSON.stringify(data) }),

  searchImage: (query: string) => request(`/admin/fetcher/search-image?q=${encodeURIComponent(query)}`),
  getFetcherCategories: () => request("/admin/fetcher/categories"),
  fetchProducts: (data: { mode: "all" | "category"; categorySlug?: string; clearExisting?: boolean }) =>
    request("/admin/fetcher/fetch", { method: "POST", body: JSON.stringify(data) }),
  clearAllProducts: () => request("/admin/clear-products", { method: "POST" }),
  roundPrices: () => request("/admin/round-prices", { method: "POST" }),
  bulkDiscount: (data: { action: "apply" | "remove"; discountPercent?: number; categoryId?: string; applyTo: "all" | "category" | "products"; productIds?: number[] }) =>
    request("/admin/bulk-discount", { method: "POST", body: JSON.stringify(data) }),

  toggleCategoryVisibility: (id: number, visible: boolean) =>
    request(`/admin/categories/${id}/visibility`, { method: "PUT", body: JSON.stringify({ visible }) }),
  searchImages: (query: string) => request(`/admin/fetcher/search-images?q=${encodeURIComponent(query)}`),
  generateDescription: (data: { name: string; category?: string; unit?: string; quantity?: string }) =>
    request("/admin/generate-description", { method: "POST", body: JSON.stringify(data) }),

  getCoupons: () => request("/admin/coupons"),
  createCoupon: (data: any) => request("/admin/coupons", { method: "POST", body: JSON.stringify(data) }),
  updateCoupon: (id: number, data: any) => request(`/admin/coupons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCoupon: (id: number) => request(`/admin/coupons/${id}`, { method: "DELETE" }),

  whatsappStatus: () => request("/admin/whatsapp/status"),
  whatsappConnect: () => request("/admin/whatsapp/connect", { method: "POST" }),
  whatsappDisconnect: () => request("/admin/whatsapp/disconnect", { method: "POST" }),
  whatsappSend: (phone: string, message: string) =>
    request("/admin/whatsapp/send", { method: "POST", body: JSON.stringify({ phone, message }) }),

  smsStatus: () => request("/admin/sms/status"),
  saveSmsApiKey: (apiKey: string) => request("/admin/sms/api-key", { method: "POST", body: JSON.stringify({ apiKey }) }),
  removeSmsApiKey: () => request("/admin/sms/api-key", { method: "DELETE" }),

  uploadProductImage: async (file: File): Promise<{ success: boolean; url: string }> => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    const csrfToken = csrfMatch ? csrfMatch[1] : "";
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${base}/api/admin/products/upload-image`, {
      method: "POST",
      credentials: "include",
      headers: { "x-csrf-token": csrfToken },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(body.message || res.statusText);
    }
    return res.json();
  },
};
