import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Wand2, Eye, EyeOff } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { AdminLayout } from "./admin-layout";
import { getCategoryMeta } from "@/lib/auto-image";

export function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", color: "#0c831f" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try { const data = await adminApi.getCategories(); setCategories(data); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setForm({ name: "", slug: "", icon: "", color: "#0c831f" }); setShowModal(true); };

  const openEdit = (cat: any) => {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color });
    setShowModal(true);
  };

  const handleNameChange = (name: string) => {
    const meta = getCategoryMeta(name);
    const newForm: any = { ...form, name };
    if (!editId) {
      if (!form.icon || form.icon === getCategoryMeta(form.name).emoji) {
        newForm.icon = meta.emoji;
      }
      if (form.color === "#0c831f" || form.color === getCategoryMeta(form.name).color) {
        newForm.color = meta.color;
      }
    }
    setForm(newForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = { ...form, slug };
    if (editId) {
      const prev = [...categories];
      setCategories(categories.map(c => c.id === editId ? { ...c, ...payload } : c));
      setShowModal(false);
      try {
        await adminApi.updateCategory(editId, payload);
        showToast("Category updated");
      } catch (err: any) { setCategories(prev); showToast(err.message, "error"); }
    } else {
      const tempId = -Date.now();
      const tempCat = { ...payload, id: tempId, productCount: 0, isVisible: true, createdAt: new Date().toISOString() };
      setCategories(prev => [...prev, tempCat]);
      setShowModal(false);
      try {
        const created = await adminApi.createCategory(payload);
        setCategories(prev => prev.map(c => c.id === tempId ? { ...tempCat, ...created } : c));
        showToast("Category created");
      } catch (err: any) {
        setCategories(prev => prev.filter(c => c.id !== tempId));
        showToast(err.message || "Failed to create", "error");
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    const prev = [...categories];
    setCategories(categories.filter(c => c.id !== id));
    setDeleteConfirm(null);
    try {
      await adminApi.deleteCategory(id);
      showToast("Category deleted");
    } catch (err: any) { setCategories(prev); showToast(err.message, "error"); }
  };

  const toggleVisibility = async (cat: any) => {
    const prev = [...categories];
    setCategories(categories.map(c => c.id === cat.id ? { ...c, visible: !c.visible } : c));
    try {
      await adminApi.toggleCategoryVisibility(cat.id, !cat.visible);
      showToast(cat.visible ? "Category hidden" : "Category shown");
    } catch (err: any) { setCategories(prev); showToast(err.message, "error"); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">Categories</h1>
            <p className="text-[13px] text-gray-500">{categories.length} categor{categories.length !== 1 ? "ies" : "y"}</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[13px] h-10 px-4 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array(6).fill(0).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />)
          ) : categories.map(cat => (
            <div key={cat.id} className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 transition-opacity ${cat.visible === false ? "border-red-200 opacity-60" : "border-gray-100"}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: cat.color + "20" }}>
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900">{cat.name}</p>
                <p className="text-[11px] text-gray-400">/{cat.slug} · {cat.productCount} products</p>
                {cat.visible === false && <p className="text-[10px] text-red-500 font-medium mt-0.5">Hidden from store</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggleVisibility(cat)} className={`p-2 rounded-lg ${cat.visible === false ? "hover:bg-green-50" : "hover:bg-yellow-50"}`} title={cat.visible === false ? "Show category" : "Hide category"}>
                  {cat.visible === false ? <EyeOff className="w-4 h-4 text-red-400" /> : <Eye className="w-4 h-4 text-green-600" />}
                </button>
                <button onClick={() => openEdit(cat)} className="p-2 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4 text-blue-500" /></button>
                <button onClick={() => setDeleteConfirm(cat.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Delete Category?</h3>
            <p className="text-[13px] text-gray-500 mb-5">This will not delete products in this category.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 border border-gray-200 rounded-xl text-[13px] font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-[16px] font-bold text-gray-900">{editId ? "Edit Category" : "Add Category"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Name *</label>
                <input value={form.name} onChange={e => handleNameChange(e.target.value)} required className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="e.g. Vegetables, Fruits, Dairy..." />
                {!editId && form.name && (
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" /> Auto-detected: {getCategoryMeta(form.name).emoji} icon, {getCategoryMeta(form.name).color} color
                  </p>
                )}
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Slug</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="auto-generated if empty" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Icon (emoji) *</label>
                <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} required className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="🥦" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="flex-1 h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                </div>
              </div>

              {form.name && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[11px] font-semibold text-gray-500 mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: form.color + "20" }}>
                      {form.icon || "📦"}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">{form.name}</p>
                      <p className="text-[11px] text-gray-400">/{form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 border border-gray-200 rounded-xl text-[13px] font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave as any} disabled={saving} className="flex-1 h-10 bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-xl text-[13px] font-bold disabled:opacity-60">
                {saving ? "Saving..." : editId ? "Update" : "Add Category"}
              </button>
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
