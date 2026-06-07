import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, ImageIcon, Wand2, Download, RefreshCw, Trash, Globe, FolderOpen, Percent, Tag, Sparkles, Images, Check, Upload } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { AdminLayout } from "./admin-layout";
import { getProductImage } from "@/lib/auto-image";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  discount: string;
  unit: string;
  quantity: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  inStock: boolean;
  isFeatured: boolean;
  isOrganic: boolean;
  deliveryTime: string;
  rating: string;
  reviewCount: string;
  tags: string;
  variants: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "", originalPrice: "", discount: "0",
  unit: "pc", quantity: "1 pc", categoryId: "", categoryName: "",
  imageUrl: "", inStock: true, isFeatured: false, isOrganic: false,
  deliveryTime: "", rating: "4.0", reviewCount: "0", tags: "", variants: "",
};

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [onSaleFilter, setOnSaleFilter] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAction, setDiscountAction] = useState<"apply" | "remove">("apply");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [discountApplyTo, setDiscountApplyTo] = useState<"all" | "category" | "products">("all");
  const [discountCatId, setDiscountCatId] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountResult, setDiscountResult] = useState<string | null>(null);
  const [discountProductSearch, setDiscountProductSearch] = useState("");
  const [discountProductResults, setDiscountProductResults] = useState<any[]>([]);
  const [discountSelectedProducts, setDiscountSelectedProducts] = useState<any[]>([]);
  const [discountSearchLoading, setDiscountSearchLoading] = useState(false);

  const [imageOptions, setImageOptions] = useState<string[]>([]);
  const [imageSearching, setImageSearching] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [variantInput, setVariantInput] = useState("");
  const [variantPriceInput, setVariantPriceInput] = useState("");
  const [variantsList, setVariantsList] = useState<{ label: string; price: string }[]>([]);
  const [formErrors, setFormErrors] = useState<{ name?: string; price?: string; categoryId?: string }>({});
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [showFetcher, setShowFetcher] = useState(false);
  const [fetchMode, setFetchMode] = useState<"all" | "category">("all");
  const [fetchCatSlug, setFetchCatSlug] = useState("");
  const [fetchClearExisting, setFetchClearExisting] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [fetchResults, setFetchResults] = useState<any>(null);
  const [bbCategories, setBbCategories] = useState<any[]>([]);
  const [clearing, setClearing] = useState(false);

  const [showAiAdder, setShowAiAdder] = useState(false);
  const [hfApiKey, setHfApiKey] = useState(() => { try { return sessionStorage.getItem("hf_api_key") || ""; } catch { return ""; } });
  const [aiProductNames, setAiProductNames] = useState("");
  const [aiCategoryId, setAiCategoryId] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedProducts, setAiGeneratedProducts] = useState<any[]>([]);
  const [aiAddingAll, setAiAddingAll] = useState(false);
  const [aiProgress, setAiProgress] = useState("");
  const [aiPickerOpen, setAiPickerOpen] = useState<number | null>(null);
  const [aiPickerImages, setAiPickerImages] = useState<string[]>([]);
  const [aiPickerSearchQ, setAiPickerSearchQ] = useState("");
  const [aiPickerSearching, setAiPickerSearching] = useState(false);
  const [aiHfGenerating, setAiHfGenerating] = useState<number | null>(null);

  const loadProducts = async (p = page, s = search, sale = onSaleFilter) => {
    setLoading(true);
    try {
      const data = await adminApi.getProducts({ page: String(p), search: s || undefined, onSale: sale ? "true" : undefined });
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {}
    setLoading(false);
  };

  const loadCategories = async () => {
    try { const data = await adminApi.getCategories(); setCategories(data); } catch {}
  };

  useEffect(() => { loadProducts(); loadCategories(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setImageOptions([]);
    setShowImagePicker(false);
    setVariantInput("");
    setVariantPriceInput("");
    setVariantsList([]);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (product: any) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      originalPrice: String(product.originalPrice),
      discount: String(product.discount),
      unit: product.unit,
      quantity: product.quantity,
      categoryId: String(product.categoryId),
      categoryName: product.categoryName,
      imageUrl: product.imageUrl,
      inStock: product.inStock,
      isFeatured: product.isFeatured,
      isOrganic: product.isOrganic,
      deliveryTime: product.deliveryTime,
      rating: String(product.rating),
      reviewCount: String(product.reviewCount),
      tags: (product.tags || []).join(", "),
      variants: (product.variants || []).join(", "),
    });
    const vp: Record<string, number> = product.variantPrices || {};
    setVariantsList((product.variants || []).map((v: string) => ({ label: v, price: vp[v] !== undefined ? String(vp[v]) : "" })));
    setVariantInput("");
    setVariantPriceInput("");
    setFormErrors({});
    setImageOptions([]);
    setShowImagePicker(false);
    setShowModal(true);
  };

  const imageSearchTimer = React.useRef<any>(null);

  const handleNameChange = (name: string) => {
    const cat = categories.find(c => String(c.id) === form.categoryId);
    const autoImg = getProductImage(name, cat?.name);
    const newForm: any = { ...form, name };
    if (!editId && (!form.imageUrl || form.imageUrl === getProductImage(form.name, cat?.name))) {
      newForm.imageUrl = autoImg;
    }
    setForm(newForm);

    if (!editId && name.length >= 3) {
      clearTimeout(imageSearchTimer.current);
      imageSearchTimer.current = setTimeout(() => {
        adminApi.searchImages(name).then((data: any) => {
          if (data.images && data.images.length > 0) {
            const urls = data.images.map((img: any) => typeof img === "string" ? img : img.url);
            setImageOptions(urls);
            setForm((prev: any) => ({ ...prev, imageUrl: urls[0] }));
          }
        }).catch(() => {});
      }, 500);
    }
  };

  const searchMoreImages = async () => {
    if (!form.name) return;
    setImageSearching(true);
    try {
      const data = await adminApi.searchImages(form.name);
      if (data.images) {
        const urls = data.images.map((img: any) => typeof img === "string" ? img : img.url);
        setImageOptions(urls);
      }
      setShowImagePicker(true);
    } catch {}
    setImageSearching(false);
  };

  const generateDescription = async () => {
    if (!form.name) return;
    setGeneratingDesc(true);
    try {
      const cat = categories.find(c => String(c.id) === form.categoryId);
      const data = await adminApi.generateDescription({
        name: form.name,
        category: cat?.name,
        unit: form.unit,
        quantity: form.quantity,
      });
      if (data.description) {
        setForm(prev => ({ ...prev, description: data.description }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate description");
    }
    setGeneratingDesc(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const result = await adminApi.uploadProductImage(file);
      if (result.url) {
        setForm(prev => ({ ...prev, imageUrl: result.url }));
        showToast("Image uploaded");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to upload image", "error");
    }
    setImageUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addVariant = () => {
    const v = variantInput.trim();
    if (!v) return;
    if (!variantsList.some(x => x.label === v)) {
      setVariantsList(prev => [...prev, { label: v, price: variantPriceInput.trim() }]);
    }
    setVariantInput("");
    setVariantPriceInput("");
  };

  const removeVariant = (label: string) => {
    setVariantsList(prev => prev.filter(v => v.label !== label));
  };

  const computeAutoPrice = (variantLabel: string): string => {
    if (!form.price || !form.quantity) return "";
    const parseG = (s: string): number | null => {
      const str = (s || "").toLowerCase().replace(/\s/g, "");
      const kg = str.match(/^([\d.]+)kg$/); if (kg) return parseFloat(kg[1]) * 1000;
      const g = str.match(/^([\d.]+)g$/); if (g) return parseFloat(g[1]);
      const l = str.match(/^([\d.]+)l$/); if (l) return parseFloat(l[1]) * 1000;
      const ml = str.match(/^([\d.]+)ml$/); if (ml) return parseFloat(ml[1]);
      return null;
    };
    const base = parseG(form.quantity);
    const variant = parseG(variantLabel);
    if (base && variant && base > 0) return String(Math.round(Number(form.price) * variant / base));
    return "";
  };

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find(c => String(c.id) === categoryId);
    const newForm: any = { ...form, categoryId };
    if (!editId && !form.imageUrl && form.name) {
      newForm.imageUrl = getProductImage(form.name, cat?.name);
    }
    setForm(newForm);
  };

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    const errors: { name?: string; price?: string; categoryId?: string } = {};
    if (!form.name.trim()) errors.name = "Product name is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) errors.price = "A valid price is required";
    if (!form.categoryId) errors.categoryId = "Please select a category";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaving(true);

    try {
      const cat = categories.find(c => String(c.id) === form.categoryId);
      const variantPrices: Record<string, number> = {};
      for (const v of variantsList) {
        if (v.price && !isNaN(Number(v.price)) && Number(v.price) > 0) {
          variantPrices[v.label] = Number(v.price);
        }
      }
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice || form.price),
        discount: Number(form.discount),
        categoryId: Number(form.categoryId),
        categoryName: cat?.name || form.categoryName,
        rating: Number(form.rating),
        reviewCount: Number(form.reviewCount),
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        variants: variantsList.map(v => v.label),
        variantPrices,
      };

      if (editId) {
        const prev = [...products];
        setProducts(products.map(p => p.id === editId ? { ...p, ...payload } : p));
        setShowModal(false);
        try {
          await adminApi.updateProduct(editId, payload);
          showToast("Product updated");
        } catch (err2: any) {
          setProducts(prev);
          showToast(err2.message || "Failed to update", "error");
        }
      } else {
        const tempId = -Date.now();
        const tempProduct = { ...payload, id: tempId, createdAt: new Date().toISOString() };
        setProducts(prev => [tempProduct, ...prev]);
        setTotal(t => t + 1);
        setShowModal(false);
        try {
          const created = await adminApi.createProduct(payload);
          setProducts(prev => prev.map(p => p.id === tempId ? { ...tempProduct, ...created } : p));
          showToast("Product created");
        } catch (err2: any) {
          setProducts(prev => prev.filter(p => p.id !== tempId));
          setTotal(t => t - 1);
          showToast(err2.message || "Failed to create", "error");
        }
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    const prev = [...products];
    setProducts(products.filter(p => p.id !== id));
    setDeleteConfirm(null);
    try {
      await adminApi.deleteProduct(id);
      showToast("Product deleted");
    } catch (err: any) {
      setProducts(prev);
      showToast(err.message, "error");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts(1, search);
  };

  const goPage = (p: number) => {
    setPage(p);
    loadProducts(p, search);
  };

  const openFetcher = async () => {
    setShowFetcher(true);
    setFetchResults(null);
    try {
      const cats = await adminApi.getFetcherCategories();
      setBbCategories(cats);
    } catch {}
  };

  const handleFetch = async () => {
    setFetching(true);
    setFetchResults(null);
    try {
      const result = await adminApi.fetchProducts({
        mode: fetchMode,
        categorySlug: fetchMode === "category" ? fetchCatSlug : undefined,
        clearExisting: fetchClearExisting,
      });
      setFetchResults(result);
      loadProducts(1, "");
      loadCategories();
      setPage(1);
      setSearch("");
    } catch (err: any) {
      setFetchResults({ error: err.message });
    }
    setFetching(false);
  };

  const searchDiscountProducts = async (q: string) => {
    setDiscountProductSearch(q);
    if (q.length < 2) { setDiscountProductResults([]); return; }
    setDiscountSearchLoading(true);
    try {
      const data = await adminApi.getProducts({ search: q, page: "1" });
      setDiscountProductResults(data.products.filter((p: any) => !discountSelectedProducts.some((s: any) => s.id === p.id)));
    } catch {}
    setDiscountSearchLoading(false);
  };

  const toggleDiscountProduct = (product: any) => {
    if (discountSelectedProducts.some(p => p.id === product.id)) {
      setDiscountSelectedProducts(discountSelectedProducts.filter(p => p.id !== product.id));
    } else {
      setDiscountSelectedProducts([...discountSelectedProducts, product]);
      setDiscountProductResults(discountProductResults.filter(p => p.id !== product.id));
    }
  };

  const handleBulkDiscount = async () => {
    setDiscountLoading(true);
    setDiscountResult(null);
    try {
      const result = await adminApi.bulkDiscount({
        action: discountAction,
        discountPercent: discountAction === "apply" ? Number(discountPercent) : undefined,
        categoryId: discountApplyTo === "category" ? discountCatId : undefined,
        applyTo: discountApplyTo,
        productIds: discountApplyTo === "products" ? discountSelectedProducts.map(p => p.id) : undefined,
      });
      const scope = discountApplyTo === "category" ? categories.find(c => String(c.id) === discountCatId)?.name || "selected category" : discountApplyTo === "products" ? `${discountSelectedProducts.length} selected products` : "all products";
      if (discountAction === "apply") {
        setDiscountResult(`Applied ${discountPercent}% discount to ${result.updated} products in ${scope}`);
      } else {
        setDiscountResult(`Removed discounts from ${result.updated} products in ${scope}`);
      }
      loadProducts(1, "");
      setPage(1);
      setTimeout(() => setDiscountResult(null), 5000);
    } catch (err: any) {
      setDiscountResult(`Error: ${err.message}`);
    }
    setDiscountLoading(false);
  };

  const estimatePrice = (name: string, category: string): number => {
    const n = name.toLowerCase();
    const map: Record<string, number> = {
      tomato: 30, potato: 25, onion: 30, garlic: 50, ginger: 60, carrot: 35,
      spinach: 20, palak: 20, cabbage: 20, cauliflower: 35, broccoli: 60,
      capsicum: 45, cucumber: 25, pumpkin: 25, ladyfinger: 35, bhindi: 35,
      peas: 50, beans: 40, radish: 20, beetroot: 25, yam: 45, taro: 45,
      mushroom: 80, zucchini: 55, corn: 30, gourd: 25, karela: 32,
      apple: 150, mango: 120, banana: 45, orange: 65, grapes: 85,
      strawberry: 150, watermelon: 25, papaya: 35, pineapple: 55, guava: 65,
      pomegranate: 100, lemon: 40, coconut: 35, kiwi: 200, avocado: 200,
      dragon: 150, litchi: 100, chiku: 50, sapota: 50, jackfruit: 60,
      plum: 120, peach: 140, pear: 130, cherry: 300, blueberry: 200,
      raspberry: 200, fig: 130, jamun: 65, amla: 35, melon: 45,
    };
    for (const [key, val] of Object.entries(map)) {
      if (n.includes(key)) return val;
    }
    return category.toLowerCase().includes("fruit") ? 80 : 40;
  };

  const handleAiGenerate = async () => {
    const names = aiProductNames.split("\n").map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    setAiGenerating(true);
    setAiGeneratedProducts([]);
    if (hfApiKey) { try { sessionStorage.setItem("hf_api_key", hfApiKey); } catch {} }
    const cat = categories.find(c => String(c.id) === aiCategoryId);
    const generated: any[] = [];

    for (const name of names) {
      setAiProgress(`Processing "${name}"...`);
      try {
        const [descData, imgData] = await Promise.all([
          adminApi.generateDescription({ name, category: cat?.name, unit: "kg", quantity: "1 kg" }).catch(() => ({ description: "" })),
          adminApi.searchImages(name).catch(() => ({ images: [] })),
        ]);
        const imageUrl: string = (imgData.images?.[0]?.url || imgData.images?.[0] || "") as string;
        let price = estimatePrice(name, cat?.name || "");

        if (hfApiKey) {
          try {
            const hfResp = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
              method: "POST",
              headers: { "Authorization": `Bearer ${hfApiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                inputs: `<s>[INST] Return ONLY a JSON object with field "price" (integer, INR per kg) for this Indian grocery item: "${name}". Example: {"price":45}. No other text. [/INST]`,
                parameters: { max_new_tokens: 30, temperature: 0.1, return_full_text: false },
              }),
            });
            if (hfResp.ok) {
              const hfData = await hfResp.json();
              const text = (hfData[0]?.generated_text || "").replace(/\s/g, "");
              const m = text.match(/\{"price":(\d+)\}/);
              if (m) price = Number(m[1]);
            }
          } catch {}
        }

        generated.push({
          name, description: descData.description || `Fresh ${name}, sourced directly from farms`,
          price, originalPrice: price, discount: 0, unit: "kg", quantity: "1 kg",
          categoryId: aiCategoryId, categoryName: cat?.name || "",
          imageUrl, inStock: true, isFeatured: false, isOrganic: false,
          deliveryTime: "1 DAY", rating: 4.0,
          reviewCount: Math.floor(Math.random() * 200 + 50),
          tags: [name.toLowerCase().replace(/\s+/g, "-")],
          variants: ["250g", "500g", "1 kg"],
        });
      } catch {}
    }
    setAiGeneratedProducts(generated);
    setAiProgress("");
    setAiGenerating(false);
  };

  const handleAiAddAll = async () => {
    if (!aiGeneratedProducts.length) return;
    setAiAddingAll(true);
    let added = 0;
    for (const p of aiGeneratedProducts) {
      try {
        await adminApi.createProduct({ ...p, categoryId: Number(p.categoryId) });
        added++;
      } catch {}
    }
    showToast(`Added ${added} product${added !== 1 ? "s" : ""} to store!`);
    setShowAiAdder(false);
    setAiGeneratedProducts([]);
    setAiProductNames("");
    loadProducts(1, "");
    loadCategories();
    setPage(1);
    setAiAddingAll(false);
  };

  const openAiPicker = async (idx: number, productName: string) => {
    setAiPickerOpen(idx);
    setAiPickerSearchQ(productName);
    setAiPickerImages([]);
    setAiPickerSearching(true);
    try {
      const data = await adminApi.searchImages(productName);
      const urls = (data.images || []).map((img: any) => typeof img === "string" ? img : img.url).filter(Boolean);
      setAiPickerImages(urls);
    } catch {}
    setAiPickerSearching(false);
  };

  const searchAiPickerImages = async (q: string) => {
    setAiPickerSearchQ(q);
    if (!q.trim()) return;
    setAiPickerSearching(true);
    try {
      const data = await adminApi.searchImages(q);
      const urls = (data.images || []).map((img: any) => typeof img === "string" ? img : img.url).filter(Boolean);
      setAiPickerImages(urls);
    } catch {}
    setAiPickerSearching(false);
  };

  const generateHfImage = async (productIndex: number, productName: string) => {
    if (!hfApiKey) { alert("Enter your HuggingFace API key above to generate images."); return; }
    setAiHfGenerating(productIndex);
    const prompt = `${productName}, fresh grocery product, white background, high quality food photography, professional, isolated`;
    const tryGenerate = async (attempt: number): Promise<boolean> => {
      try {
        const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
          method: "POST",
          headers: { "Authorization": `Bearer ${hfApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: prompt }),
        });
        if (response.ok) {
          const blob = await response.blob();
          if (blob.size < 500) {
            return false;
          }
          const url = URL.createObjectURL(blob);
          setAiGeneratedProducts(prev => prev.map((p, i) => i === productIndex ? { ...p, imageUrl: url } : p));
          if (aiPickerOpen === productIndex) setAiPickerOpen(null);
          return true;
        }
        if (response.status === 503) {
          let waitSec = 20;
          try {
            const errJson = await response.json();
            if (errJson?.estimated_time) waitSec = Math.min(Math.ceil(errJson.estimated_time), 40);
          } catch {}
          if (attempt === 1) {
            await new Promise(r => setTimeout(r, waitSec * 1000));
            return tryGenerate(2);
          }
          alert(`Model is warming up. Please wait ${waitSec}s and try again.`);
          return false;
        }
        if (response.status === 401 || response.status === 403) {
          alert("Invalid HuggingFace API key. Get a free key at huggingface.co/settings/tokens");
          return false;
        }
        alert(`Image generation failed (${response.status}). Check your API key or try again later.`);
        return false;
      } catch (err: any) {
        if (attempt === 1) {
          await new Promise(r => setTimeout(r, 3000));
          return tryGenerate(2);
        }
        alert("Network error during image generation. Check your internet connection.");
        return false;
      }
    };
    await tryGenerate(1);
    setAiHfGenerating(null);
  };

  const handleClearAll = async () => {
    if (!confirm("This will remove ALL products. Are you sure?")) return;
    setClearing(true);
    try {
      await adminApi.clearAllProducts();
      loadProducts(1, "");
      loadCategories();
      setPage(1);
    } catch (err: any) {
      alert(err.message);
    }
    setClearing(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Products</h1>
            <p className="text-[13px] text-gray-500">{total} product{total !== 1 ? "s" : ""} total</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleClearAll} disabled={clearing} className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[11px] sm:text-[12px] h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl transition-colors border border-red-100">
              <Trash className="w-3.5 h-3.5" /> {clearing ? "..." : "Clear"}
            </button>
            <button onClick={() => { setShowDiscount(!showDiscount); setDiscountResult(null); }} className={`flex items-center gap-1.5 font-bold text-[11px] sm:text-[12px] h-8 sm:h-9 px-3 sm:px-4 rounded-xl transition-all ${showDiscount ? "bg-purple-600 text-white shadow-md shadow-purple-200" : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md shadow-purple-200"}`}>
              <Percent className="w-3.5 h-3.5" /> Discounts
            </button>
            <button onClick={openFetcher} className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-[11px] sm:text-[12px] h-8 sm:h-9 px-3 sm:px-4 rounded-xl transition-all shadow-md shadow-orange-200">
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">BigBasket</span> Fetcher
            </button>
            <button onClick={() => { setShowAiAdder(true); setAiGeneratedProducts([]); }} className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold text-[11px] sm:text-[12px] h-8 sm:h-9 px-3 sm:px-4 rounded-xl transition-all shadow-md shadow-violet-200">
              <Sparkles className="w-3.5 h-3.5" /> AI Adder
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[11px] sm:text-[12px] h-8 sm:h-9 px-3 sm:px-4 rounded-xl transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>
          <button
            type="button"
            onClick={() => { const next = !onSaleFilter; setOnSaleFilter(next); setPage(1); loadProducts(1, search, next); }}
            className={`h-10 px-3 rounded-xl text-[12px] font-semibold transition-all flex items-center gap-1.5 shrink-0 ${onSaleFilter ? "bg-green-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Discounted</span>
          </button>
          <button type="submit" className="h-10 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-[12px] font-semibold transition-colors">Search</button>
        </form>

        {showDiscount && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm p-5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Bulk Discount Manager</h3>
                <p className="text-[11px] text-gray-500">Apply or remove discounts across products</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setDiscountAction("apply")} className={`h-9 px-4 rounded-lg text-[12px] font-bold transition-all ${discountAction === "apply" ? "bg-purple-600 text-white shadow-md" : "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"}`}>
                Apply Discount
              </button>
              <button onClick={() => setDiscountAction("remove")} className={`h-9 px-4 rounded-lg text-[12px] font-bold transition-all ${discountAction === "remove" ? "bg-red-500 text-white shadow-md" : "bg-white border border-red-200 text-red-600 hover:bg-red-50"}`}>
                Remove Discounts
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {discountAction === "apply" && (
                <div>
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Discount %</label>
                  <div className="relative">
                    <input type="number" min="1" max="90" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-full h-10 px-3 pr-8 bg-white border border-purple-200 rounded-xl text-[14px] font-bold text-purple-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-purple-400 font-bold">%</span>
                  </div>
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Apply To</label>
                <select value={discountApplyTo} onChange={e => setDiscountApplyTo(e.target.value as "all" | "category" | "products")} className="w-full h-10 px-3 bg-white border border-purple-200 rounded-xl text-[13px] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
                  <option value="all">All Products</option>
                  <option value="category">Specific Category</option>
                  <option value="products">Specific Products</option>
                </select>
              </div>
              {discountApplyTo === "category" && (
                <div>
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Category</label>
                  <select value={discountCatId} onChange={e => setDiscountCatId(e.target.value)} className="w-full h-10 px-3 bg-white border border-purple-200 rounded-xl text-[13px] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-end">
                <button
                  onClick={handleBulkDiscount}
                  disabled={discountLoading || (discountAction === "apply" && (!discountPercent || Number(discountPercent) < 1)) || (discountApplyTo === "category" && !discountCatId) || (discountApplyTo === "products" && discountSelectedProducts.length === 0)}
                  className={`w-full h-10 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    discountAction === "apply"
                      ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200"
                      : "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-200"
                  }`}
                >
                  {discountLoading ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...</span>
                  ) : discountAction === "apply" ? (
                    <span className="flex items-center justify-center gap-1.5"><Percent className="w-3.5 h-3.5" /> Apply {discountPercent}% OFF</span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5" /> Remove All Discounts</span>
                  )}
                </button>
              </div>
            </div>

            {discountApplyTo === "products" && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Search & Select Products</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={discountProductSearch}
                      onChange={e => searchDiscountProducts(e.target.value)}
                      placeholder="Search products by name..."
                      className="w-full h-10 pl-10 pr-4 bg-white border border-purple-200 rounded-xl text-[13px] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </div>
                {discountSearchLoading && <p className="text-[11px] text-gray-400">Searching...</p>}
                {discountProductResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-purple-100 rounded-xl bg-white divide-y divide-gray-50">
                    {discountProductResults.map((p: any) => (
                      <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-purple-50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={false} onChange={() => toggleDiscountProduct(p)} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"; }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-400">₹{p.price} · {p.categoryName}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {discountSelectedProducts.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-600 mb-1.5">{discountSelectedProducts.length} product{discountSelectedProducts.length !== 1 ? "s" : ""} selected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {discountSelectedProducts.map((p: any) => (
                        <span key={p.id} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          {p.name}
                          <button onClick={() => toggleDiscountProduct(p)} className="hover:text-purple-900"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {discountAction === "apply" && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[5, 10, 15, 20, 25, 30, 40, 50].map(pct => (
                  <button key={pct} onClick={() => setDiscountPercent(String(pct))} className={`h-7 px-3 rounded-full text-[11px] font-bold transition-all ${String(pct) === discountPercent ? "bg-purple-600 text-white" : "bg-white border border-purple-200 text-purple-600 hover:bg-purple-50"}`}>
                    {pct}%
                  </button>
                ))}
              </div>
            )}

            {discountResult && (
              <div className={`p-3 rounded-lg text-[12px] font-semibold ${discountResult.startsWith("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {discountResult}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="text-[15px] font-bold text-gray-800 mb-1">No products yet</h3>
              <p className="text-[12px] text-gray-400 max-w-xs mx-auto mb-4">Use the BigBasket Fetcher to instantly populate your store with 150+ products across 16 categories.</p>
              <button onClick={openFetcher} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-[12px] h-9 px-5 rounded-xl shadow-md">
                <Download className="w-3.5 h-3.5 inline mr-1.5" /> Fetch Products Now
              </button>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="text-right px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                              {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-gray-300 m-auto mt-2.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-gray-900 truncate">{p.name}</p>
                              <p className="text-[11px] text-gray-400">{p.quantity}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-gray-600">{p.categoryName}</td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-[13px] font-bold text-gray-900">₹{p.price}</span>
                            {p.originalPrice > p.price && <span className="text-[11px] text-gray-400 line-through ml-1">₹{p.originalPrice}</span>}
                            {p.discount > 0 && <span className="text-[10px] text-green-600 font-bold ml-1">{p.discount}% OFF</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.inStock ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                            {p.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(p)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4 text-blue-500" />
                            </button>
                            <button onClick={() => setDeleteConfirm(p.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-50">
                {products.map(p => (
                  <div key={p.id} className="p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-gray-300 m-auto mt-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.categoryName} · {p.quantity}</p>
                      <p className="text-[13px] font-bold text-gray-900 mt-0.5">₹{p.price} {p.discount > 0 && <span className="text-[10px] text-green-600">{p.discount}% OFF</span>}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4 text-blue-500" /></button>
                      <button onClick={() => setDeleteConfirm(p.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[12px] text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => goPage(page - 1)} disabled={page <= 1} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => goPage(page + 1)} disabled={page >= totalPages} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-[13px] text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 border border-gray-200 rounded-xl text-[13px] font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-bold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showFetcher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4" onClick={() => { setShowFetcher(false); setFetchResults(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-4 sm:my-8 shrink-0" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-pink-500 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-white">BigBasket Product Fetcher</h2>
                    <p className="text-[11px] text-white/70">Fetch products with images, prices & details</p>
                  </div>
                </div>
                <button onClick={() => { setShowFetcher(false); setFetchResults(null); }} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5 text-white" /></button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setFetchMode("all")}
                  className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[13px] font-bold border-2 transition-all ${
                    fetchMode === "all"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  All Categories
                </button>
                <button
                  onClick={() => setFetchMode("category")}
                  className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[13px] font-bold border-2 transition-all ${
                    fetchMode === "category"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  Single Category
                </button>
              </div>

              {fetchMode === "all" && (
                <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-[12px] font-bold text-orange-800 mb-2">Will fetch all 16 categories:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bbCategories.map(c => (
                      <span key={c.slug} className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-700 border border-orange-100 shadow-sm">
                        {c.emoji} {c.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-orange-600 mt-2 font-medium">150+ products with real images & round prices</p>
                </div>
              )}

              {fetchMode === "category" && (
                <div>
                  <label className="text-[12px] font-bold text-gray-600 block mb-2">Select Category to Fetch</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                    {bbCategories.map(c => (
                      <button
                        key={c.slug}
                        onClick={() => setFetchCatSlug(c.slug)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold border-2 transition-all text-left ${
                          fetchCatSlug === c.slug
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-base">{c.emoji}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div className={`relative w-10 h-6 rounded-full transition-colors ${fetchClearExisting ? "bg-orange-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${fetchClearExisting ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-800">Clear existing products first</p>
                  <p className="text-[10px] text-gray-500">Removes all current products before fetching</p>
                </div>
              </label>

              {fetchResults && !fetchResults.error && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-[13px] font-bold text-green-800">Fetched {fetchResults.totalAdded} products!</p>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {fetchResults.results?.map((r: any, i: number) => (
                      <p key={i} className={`text-[11px] ${r.error ? "text-red-600" : "text-green-700"}`}>
                        {r.error ? `✗ ${r.category}: ${r.error}` : `✓ ${r.category}: ${r.added} products added`}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {fetchResults?.error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-[12px] text-red-700 font-medium">Error: {fetchResults.error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-white rounded-b-2xl sticky bottom-0">
              <button onClick={() => { setShowFetcher(false); setFetchResults(null); }} className="flex-1 h-10 border border-gray-200 rounded-xl text-[12px] font-semibold hover:bg-gray-50 transition-colors">Close</button>
              <button
                onClick={handleFetch}
                disabled={fetching || (fetchMode === "category" && !fetchCatSlug)}
                className="flex-1 h-10 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl text-[12px] font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-md transition-all"
              >
                {fetching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Fetch Products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-start justify-center p-0 sm:p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl sm:my-8 shadow-xl flex flex-col" style={{ maxHeight: "92dvh" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-[16px] font-bold text-gray-900">{editId ? "Edit Product" : "Add Product"}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form id="product-form" onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Product Name *</label>
                  <input value={form.name} onChange={e => { handleNameChange(e.target.value); setFormErrors(p => ({...p, name: undefined})); }} className={`w-full h-10 px-3 bg-[#f7f7f7] border rounded-xl text-[13px] focus:outline-none focus:bg-white ${formErrors.name ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-[#0c831f]"}`} />
                  {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
                  {!formErrors.name && !editId && form.name && form.imageUrl && (
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Wand2 className="w-3 h-3" /> Image auto-fetched from BigBasket
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
                    <button
                      type="button"
                      onClick={generateDescription}
                      disabled={generatingDesc || !form.name}
                      className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-3 h-3" />
                      {generatingDesc ? "Generating..." : "AI Generate"}
                    </button>
                  </div>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white resize-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Price (₹) *</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => { setForm({ ...form, price: e.target.value }); setFormErrors(p => ({...p, price: undefined})); }} className={`w-full h-10 px-3 bg-[#f7f7f7] border rounded-xl text-[13px] focus:outline-none focus:bg-white ${formErrors.price ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-[#0c831f]"}`} />
                  {formErrors.price && <p className="text-[11px] text-red-500 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Original Price (₹)</label>
                  <input type="number" step="0.01" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Discount (%)</label>
                  <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category *</label>
                  <select value={form.categoryId} onChange={e => { handleCategoryChange(e.target.value); setFormErrors(p => ({...p, categoryId: undefined})); }} className={`w-full h-10 px-3 bg-[#f7f7f7] border rounded-xl text-[13px] focus:outline-none focus:bg-white ${formErrors.categoryId ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-[#0c831f]"}`}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {formErrors.categoryId && <p className="text-[11px] text-red-500 mt-1">{formErrors.categoryId}</p>}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Unit</label>
                  <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="kg, pc, litre..." />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Quantity Label</label>
                  <input value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="500g, 1 kg, 2 pcs..." />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Image</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageUploading}
                        className="flex items-center gap-1 text-[10px] font-bold text-green-600 hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-3 h-3" />
                        {imageUploading ? "Uploading..." : "Upload Image"}
                      </button>
                      <button
                        type="button"
                        onClick={searchMoreImages}
                        disabled={imageSearching || !form.name}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Images className="w-3 h-3" />
                        {imageSearching ? "Searching..." : "Browse Images"}
                      </button>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
                  <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="https://... or upload an image" />
                  {(showImagePicker && imageOptions.length > 0) && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {imageOptions.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, imageUrl: url }))}
                          className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all hover:shadow-md ${form.imageUrl === url ? "border-[#0c831f] ring-2 ring-[#0c831f]/20" : "border-gray-200 hover:border-gray-300"}`}
                        >
                          <img src={url} alt="" className="w-full h-full object-contain bg-gray-50 p-1" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                          {form.imageUrl === url && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-[#0c831f] rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {!showImagePicker && form.imageUrl && (
                    <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={form.imageUrl} alt="" className="w-full h-full object-cover" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Delivery Time</label>
                  <input value={form.deliveryTime} onChange={e => setForm({ ...form, deliveryTime: e.target.value })} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="fresh, organic, local..." />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Variants / Options</label>
                  {variantsList.length > 0 && (
                    <div className="mb-2 space-y-1.5">
                      {variantsList.map((v) => (
                        <div key={v.label} className="flex items-center gap-2 bg-[#f7f7f7] rounded-xl px-3 py-1.5">
                          <span className="text-[12px] font-semibold text-[#0c831f] flex-1">{v.label}</span>
                          <span className="text-[11px] text-gray-400 shrink-0">₹</span>
                          <input
                            type="number"
                            value={v.price}
                            onChange={e => setVariantsList(prev => prev.map(x => x.label === v.label ? { ...x, price: e.target.value } : x))}
                            placeholder="auto"
                            className="w-20 h-7 px-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold text-[#0c831f] focus:outline-none focus:border-[#0c831f]"
                          />
                          <button type="button" onClick={() => removeVariant(v.label)} className="ml-1 p-0.5 hover:bg-red-50 rounded transition-colors">
                            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      value={variantInput}
                      onChange={e => setVariantInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addVariant(); } }}
                      className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white"
                      placeholder="Size (e.g. 500g, 1 kg)"
                    />
                    <div className="flex gap-2">
                      <div className="relative flex items-center flex-1">
                        <span className="absolute left-2.5 text-[12px] text-gray-400 pointer-events-none">₹</span>
                        <input
                          type="number"
                          value={variantPriceInput}
                          onChange={e => setVariantPriceInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addVariant(); } }}
                          placeholder="Price (optional)"
                          className="w-full h-9 pl-6 pr-2 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white"
                        />
                      </div>
                      <button type="button" onClick={addVariant} className="h-9 px-4 bg-[#0c831f] text-white rounded-xl text-[12px] font-bold hover:bg-[#0a6f1a] transition-colors whitespace-nowrap shrink-0">
                        + Add
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Leave price empty to auto-calculate from base price</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["250g", "500g", "1 kg", "2 kg", "250ml", "500ml", "1L", "1 pc", "6 pcs", "12 pcs"].filter(s => !variantsList.some(v => v.label === s)).slice(0, 6).map(s => (
                      <button key={s} type="button" onClick={() => {
                        if (!variantsList.some(v => v.label === s)) {
                          setVariantsList(prev => [...prev, { label: s, price: computeAutoPrice(s) }]);
                        }
                      }} className="text-[10px] font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Rating</label>
                  <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Review Count</label>
                  <input type="number" value={form.reviewCount} onChange={e => setForm({ ...form, reviewCount: e.target.value })} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.inStock} onChange={e => setForm({ ...form, inStock: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#0c831f] focus:ring-[#0c831f]" />
                  <span className="text-[12px] font-semibold text-gray-700">In Stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#0c831f] focus:ring-[#0c831f]" />
                  <span className="text-[12px] font-semibold text-gray-700">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isOrganic} onChange={e => setForm({ ...form, isOrganic: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#0c831f] focus:ring-[#0c831f]" />
                  <span className="text-[12px] font-semibold text-gray-700">Organic</span>
                </label>
              </div>
            </form>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0 bg-white rounded-b-2xl">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-11 border border-gray-200 rounded-xl text-[13px] font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" form="product-form" disabled={saving} className="flex-1 h-11 bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-xl text-[13px] font-bold transition-colors disabled:opacity-60">
                {saving ? "Saving..." : editId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showAiAdder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-start justify-center p-0 sm:p-4 overflow-y-auto" onClick={() => !aiGenerating && !aiAddingAll && setShowAiAdder(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl sm:my-8 shadow-2xl flex flex-col" style={{ maxHeight: "92dvh" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900">AI Product Adder</h2>
                  <p className="text-[11px] text-gray-500">Auto-generate products with images & descriptions</p>
                </div>
              </div>
              <button onClick={() => setShowAiAdder(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="bg-violet-50 rounded-xl p-3 border border-violet-100 space-y-3">
                <p className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">HuggingFace API Key</p>
                <input
                  type="password"
                  value={hfApiKey}
                  onChange={e => setHfApiKey(e.target.value)}
                  placeholder="hf_... (optional — for AI image generation & better prices)"
                  className="w-full h-9 px-3 bg-white border border-violet-200 rounded-lg text-[12px] focus:outline-none focus:border-violet-400"
                />
                <p className="text-[10px] text-violet-500">Free key at huggingface.co/settings/tokens — enables AI image gen (FLUX) + smarter pricing</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category *</label>
                  <select
                    value={aiCategoryId}
                    onChange={e => setAiCategoryId(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-violet-400 focus:bg-white"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Image Source</label>
                  <div className="flex gap-1.5">
                    {[
                      { key: "auto", label: "🏪 Auto", title: "BigBasket images (default)" },
                      { key: "hf", label: "🤖 AI Gen", title: "Generate with HuggingFace FLUX" },
                      { key: "search", label: "🔍 Search", title: "Pick from search results" },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        title={opt.title}
                        onClick={() => {}}
                        className="flex-1 h-10 rounded-xl text-[11px] font-bold border-2 border-gray-200 text-gray-600 bg-gray-50"
                        style={{ opacity: 1 }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">Click 📷 on each product below to change its image</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Product Names <span className="text-gray-400 font-normal normal-case">(one per line)</span>
                </label>
                <textarea
                  value={aiProductNames}
                  onChange={e => setAiProductNames(e.target.value)}
                  rows={5}
                  placeholder={"Tomato\nCarrot\nMango\nSpinach\nStrawberry"}
                  className="w-full px-3 py-2.5 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-violet-400 focus:bg-white resize-none font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">{aiProductNames.split("\n").filter(n => n.trim()).length} product{aiProductNames.split("\n").filter(n => n.trim()).length !== 1 ? "s" : ""} will be generated</p>
              </div>

              {aiProgress && (
                <div className="flex items-center gap-2 text-[12px] text-violet-600 font-medium bg-violet-50 rounded-xl px-4 py-2.5">
                  <div className="w-3.5 h-3.5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  {aiProgress}
                </div>
              )}

              {aiGeneratedProducts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-gray-700">Generated — Review & edit before adding:</p>
                    <span className="text-[10px] text-gray-400">Tap 📷 to change image</span>
                  </div>
                  <div className="space-y-2">
                    {aiGeneratedProducts.map((p, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                        <div className="flex items-start gap-3 p-3">
                          <div className="relative shrink-0">
                            <div
                              className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-100 cursor-pointer hover:ring-2 hover:ring-violet-400 transition-all"
                              onClick={() => openAiPicker(i, p.name)}
                              title="Click to change image"
                            >
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-0.5" onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=60"; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-[22px]">📷</div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => openAiPicker(i, p.name)}
                              className="absolute -bottom-1 -right-1 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shadow-sm"
                              title="Change image"
                            >
                              <span className="text-white text-[9px]">✏️</span>
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <input
                                value={p.name}
                                onChange={e => setAiGeneratedProducts(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                                className="text-[13px] font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-violet-400 focus:outline-none flex-1 min-w-0"
                              />
                              <span className="text-[10px] text-gray-400 shrink-0">{p.categoryName}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-gray-400">₹</span>
                                <input
                                  type="number"
                                  value={p.price}
                                  onChange={e => setAiGeneratedProducts(prev => prev.map((x, j) => j === i ? { ...x, price: Number(e.target.value), originalPrice: Number(e.target.value) } : x))}
                                  className="text-[13px] font-bold text-[#0c831f] w-16 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-violet-400 focus:outline-none"
                                />
                                <span className="text-[10px] text-gray-400">/{p.unit}</span>
                              </div>
                              {hfApiKey && (
                                <button
                                  type="button"
                                  onClick={() => generateHfImage(i, p.name)}
                                  disabled={aiHfGenerating === i}
                                  className="flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-700 disabled:opacity-50"
                                  title="Generate image with HuggingFace FLUX"
                                >
                                  {aiHfGenerating === i ? (
                                    <><div className="w-3 h-3 border border-violet-600 border-t-transparent rounded-full animate-spin" /> Generating...</>
                                  ) : (
                                    <><Sparkles className="w-3 h-3" /> Gen Image</>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          <button type="button" onClick={() => setAiGeneratedProducts(prev => prev.filter((_, j) => j !== i))} className="p-1 hover:bg-red-50 rounded-lg shrink-0 mt-0.5">
                            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                        {aiPickerOpen === i && (
                          <div className="border-t border-gray-100 p-3 bg-white space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                  value={aiPickerSearchQ}
                                  onChange={e => { setAiPickerSearchQ(e.target.value); }}
                                  onKeyDown={e => { if (e.key === "Enter") searchAiPickerImages(aiPickerSearchQ); }}
                                  placeholder="Search images..."
                                  className="w-full h-8 pl-8 pr-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-violet-400"
                                />
                              </div>
                              <button type="button" onClick={() => searchAiPickerImages(aiPickerSearchQ)} className="h-8 px-3 bg-violet-600 text-white rounded-lg text-[11px] font-bold hover:bg-violet-700">Search</button>
                              <button type="button" onClick={() => setAiPickerOpen(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-3.5 h-3.5 text-gray-400" /></button>
                            </div>
                            {aiPickerSearching && <p className="text-[11px] text-violet-500 flex items-center gap-1.5"><div className="w-3 h-3 border border-violet-500 border-t-transparent rounded-full animate-spin" /> Searching...</p>}
                            {aiPickerImages.length > 0 && (
                              <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
                                {aiPickerImages.map((url, ui) => (
                                  <button
                                    key={ui}
                                    type="button"
                                    onClick={() => {
                                      setAiGeneratedProducts(prev => prev.map((x, j) => j === i ? { ...x, imageUrl: url } : x));
                                      setAiPickerOpen(null);
                                    }}
                                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:shadow-md ${p.imageUrl === url ? "border-violet-500" : "border-gray-100 hover:border-gray-300"}`}
                                  >
                                    <img src={url} alt="" className="w-full h-full object-contain bg-white p-0.5" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                                  </button>
                                ))}
                              </div>
                            )}
                            {!aiPickerSearching && aiPickerImages.length === 0 && <p className="text-[11px] text-gray-400 text-center py-2">No images found. Try a different search.</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !aiCategoryId || !aiProductNames.trim()}
                  className="flex-1 h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {aiGenerating ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Products</>
                  )}
                </button>
                {aiGeneratedProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAiAddAll}
                    disabled={aiAddingAll}
                    className="flex-1 h-11 bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-xl text-[13px] font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiAddingAll ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Add {aiGeneratedProducts.length} to Store</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-[13px] font-semibold ${toast.type === "error" ? "bg-red-500 text-white" : "bg-[#0c831f] text-white"}`}>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
}
