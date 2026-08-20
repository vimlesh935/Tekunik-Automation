import React, { useCallback, useEffect, useState } from "react";
import { Edit2, FolderTree, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { categoryService, getApiUrl } from "../../services/api.js";
import SafeImage from "../../components/SafeImage.jsx";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPageToolbar from "../../components/admin/AdminPageToolbar.jsx";
import Toast from "../../admin/components/common/Toast.jsx";
import CategoryModal from "../../admin/components/categories/CategoryModal.jsx";

const emptyCategory = { name: "", description: "", image_url: "" };

export default function AdminCategories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const clearCategoryImageSelection = useCallback(() => {
    if (categoryImagePreview) URL.revokeObjectURL(categoryImagePreview);
    setCategoryImageFile(null);
    setCategoryImagePreview("");
  }, [categoryImagePreview]);

  const handleImageSelection = useCallback((file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    clearCategoryImageSelection();
    setCategoryImageFile(file);
    setCategoryImagePreview(preview);
  }, [clearCategoryImageSelection]);

  const handleImageUpload = useCallback(async (file, target = "category") => {
    if (!file) {
      showToast("Please choose an image first.", "error");
      return null;
    }
    setUploadingImage(true);
    setUploadTarget(target);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(getApiUrl("/api/admin/upload"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Upload failed (${res.status})`);
      const url = data.data?.url || data.url;
      if (!url) throw new Error("No image URL returned from server");
      setCategoryForm((prev) => ({ ...prev, image_url: url }));
      clearCategoryImageSelection();
      showToast("Category image uploaded successfully.");
      return url;
    } catch (err) {
      showToast(err.message || "Image upload failed", "error");
      return null;
    } finally {
      setUploadingImage(false);
      setUploadTarget(null);
    }
  }, [clearCategoryImageSelection, showToast, token]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAdminCategories();
      setCategories(res.data?.categories || []);
    } catch (err) {
      showToast(err.message || "Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryFieldChange = useCallback((field, value) => {
    setCategoryForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategory);
    setCategoryImagePreview("");
    setCategoryImageFile(null);
    setCategoryError("");
    setShowCategoryModal(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name || "", description: category.description || "", image_url: category.image_url || "" });
    setCategoryError("");
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      setCategoryError("Category name is required");
      return;
    }
    setCategorySaving(true);
    setCategoryError("");
    try {
      let imageUrl = categoryForm.image_url || "";
      if (categoryImageFile) {
        const uploadedUrl = await handleImageUpload(categoryImageFile, "category");
        if (!uploadedUrl) throw new Error("Category image upload failed");
        imageUrl = uploadedUrl;
      }
      const body = { ...categoryForm, image_url: imageUrl || null };
      if (editingCategory) await categoryService.updateCategory(editingCategory.id, body);
      else await categoryService.createCategory(body);
      setShowCategoryModal(false);
      showToast(editingCategory ? "Category updated successfully." : "Category created successfully.");
      fetchCategories();
    } catch (err) {
      setCategoryError(err.message || "Failed to save category");
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await categoryService.deleteCategory(id);
      showToast("Category deleted successfully.");
      fetchCategories();
    } catch (err) {
      showToast(err.message || "Failed to delete category", "error");
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <AdminPageToolbar title="Categories" description="Manage category names, descriptions, images, and catalog grouping." actions={[{ label: "Add Category", onClick: openAddCategory }]} />
      {loading ? <AdminLoading /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 hover:border-cyan-500/30 transition group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center overflow-hidden">
                  {category.image_url ? <SafeImage src={category.image_url} alt={category.name} className="w-full h-full object-cover" /> : <FolderTree size={24} className="text-cyan-400" />}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditCategory(category)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition" title="Edit"><Edit2 size={16} /></button>
                  <button onClick={() => deleteCategory(category.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">{category.name}</h3>
              {category.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{category.description}</p>}
              <p className="text-xs text-gray-500 mt-1 mb-4">{category.slug}</p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Products</span>
                <span className="text-sm font-bold text-white bg-gray-800 px-2.5 py-1 rounded-md">{category.product_count}</span>
              </div>
            </div>
          ))}
          {categories.length === 0 && <div className="col-span-full rounded-2xl border border-gray-800 p-12 text-center text-gray-500">No categories found.</div>}
        </div>
      )}
      <CategoryModal
        show={showCategoryModal}
        editingCategory={editingCategory}
        categoryForm={categoryForm}
        categoryError={categoryError}
        categorySaving={categorySaving}
        onChange={handleCategoryFieldChange}
        onClose={() => setShowCategoryModal(false)}
        onSave={saveCategory}
        onSelectImage={handleImageSelection}
        onUploadImage={handleImageUpload}
        onClearImage={clearCategoryImageSelection}
        categoryImageFile={categoryImageFile}
        categoryImagePreview={categoryImagePreview}
        uploadingImage={uploadingImage}
        uploadTarget={uploadTarget}
      />
    </div>
  );
}
