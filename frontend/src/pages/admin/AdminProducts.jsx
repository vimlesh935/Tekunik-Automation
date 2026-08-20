import React, { useCallback, useEffect, useState } from "react";
import { Edit2, Package, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import apiCall, { categoryService, getApiUrl } from "../../services/api.js";
import SafeImage from "../../components/SafeImage.jsx";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPageToolbar from "../../components/admin/AdminPageToolbar.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import Toast from "../../admin/components/common/Toast.jsx";
import ProductModal from "../../admin/components/products/ProductModal.jsx";
import BulkImportModal from "../../admin/components/products/BulkImportModal.jsx";

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
  image_url: "",
  status: "active",
  featured: false,
  brand: "",
  features: "",
  applications: [],
};

export default function AdminProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState("");

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const clearProductImageSelection = useCallback(() => {
    if (productImagePreview) URL.revokeObjectURL(productImagePreview);
    setProductImageFile(null);
    setProductImagePreview("");
  }, [productImagePreview]);

  const handleImageSelection = useCallback((file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    clearProductImageSelection();
    setProductImageFile(file);
    setProductImagePreview(preview);
  }, [clearProductImageSelection]);

  const handleImageUpload = useCallback(async (file, target = "product") => {
    if (!file) {
      showToast("Please choose an image first.", "error");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image is too large. Maximum size is 5MB.", "error");
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
      setProductForm((prev) => ({ ...prev, image_url: url }));
      clearProductImageSelection();
      showToast("Product image uploaded successfully.");
      return url;
    } catch (err) {
      showToast(err.message || "Image upload failed. Please try again.", "error");
      return null;
    } finally {
      setUploadingImage(false);
      setUploadTarget(null);
    }
  }, [clearProductImageSelection, showToast, token]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [res, catRes] = await Promise.all([
        apiCall(`/api/admin/products?page=${page}&search=${encodeURIComponent(search)}`),
        categoryService.getAdminCategories().catch(() => null),
      ]);
      const payload = res.data;
      setProducts(payload?.products || []);
      setTotalPages(payload?.pagination?.pages || 1);
      if (catRes?.data?.categories) setCategories(catRes.data.categories);
    } catch (err) {
      showToast(err.message || "Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductFieldChange = useCallback((field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyProduct);
    setProductImagePreview("");
    setProductImageFile(null);
    setProductError("");
    setShowProductModal(true);
  };

  const openEditProduct = async (product) => {
    try {
      const res = await apiCall(`/api/admin/products/${product.id}`);
      const p = res.data?.product || product;
      let applications = [];
      if (p.applications) {
        try {
          applications = typeof p.applications === "string" ? JSON.parse(p.applications) : p.applications;
          if (!Array.isArray(applications)) applications = [];
        } catch {
          applications = [];
        }
      }
      setEditingProduct(p);
      setProductForm({
        name: p.name || "",
        description: p.description || "",
        price: p.price || "",
        stock: p.stock || p.stock_quantity || "",
        category_id: p.category_id || "",
        image_url: p.image_url || "",
        status: p.status || "active",
        featured: Boolean(p.featured),
        brand: p.brand || "",
        features: p.features || "",
        applications,
      });
      setProductError("");
      setShowProductModal(true);
    } catch (err) {
      showToast(`Failed to load product: ${err.message}`, "error");
    }
  };

  const saveProduct = async () => {
    if (!productForm.name?.trim()) {
      setProductError("Product name is required");
      return;
    }
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      setProductError("Price is required and must be greater than 0");
      return;
    }
    setProductSaving(true);
    setProductError("");
    try {
      let imageUrl = productForm.image_url || null;
      if (productImageFile) {
        const uploadedUrl = await handleImageUpload(productImageFile, "product");
        if (!uploadedUrl) throw new Error("Product image upload failed");
        imageUrl = uploadedUrl;
      }
      const body = {
        name: productForm.name.trim(),
        description: productForm.description?.trim() || null,
        price: parseFloat(productForm.price),
        stock: Math.max(0, parseInt(productForm.stock, 10) || 0),
        category_id: productForm.category_id ? parseInt(productForm.category_id, 10) : null,
        image_url: imageUrl,
        status: productForm.status || "active",
        featured: productForm.featured ? 1 : 0,
        brand: productForm.brand?.trim() || "",
        features: productForm.features?.trim() || null,
        applications: productForm.applications || [],
      };
      const endpoint = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";
      await apiCall(endpoint, { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
      setShowProductModal(false);
      setProductForm(emptyProduct);
      setProductImageFile(null);
      setProductImagePreview("");
      showToast(editingProduct ? "Product updated successfully." : "Product created successfully.");
      fetchProducts();
    } catch (err) {
      setProductError(err.message || "Failed to save product");
      showToast(err.message || "Failed to save product", "error");
    } finally {
      setProductSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await apiCall(`/api/admin/products/${id}`, { method: "DELETE" });
      showToast("Product deleted successfully.");
      fetchProducts();
    } catch (err) {
      showToast(err.message || "Failed to delete product", "error");
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <AdminPageToolbar
        title="Products"
        description="Manage product catalog, pricing, stock, images, and bulk imports."
        search={search}
        onSearchChange={(value) => { setPage(1); setSearch(value); }}
        showSearch
        actions={[
          { label: "Add Product", onClick: openAddProduct },
          { label: "Bulk Import", icon: "upload", onClick: () => setShowBulkImportModal(true), className: "inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)]" },
        ]}
      />

      {loading ? <AdminLoading /> : (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                <th className="p-4 font-semibold">Product</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Brand</th>
                <th className="p-4 font-semibold text-right">Price</th>
                <th className="p-4 font-semibold text-center">Stock</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/20 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {p.image_url ? <SafeImage src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-800" /> : <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center"><Package size={16} className="text-gray-500" /></div>}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-white truncate max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-300">{p.category_name || "-"}</td>
                  <td className="p-4 text-sm text-gray-300">{p.brand || "-"}</td>
                  <td className="p-4 text-sm font-mono text-cyan-400 text-right">₹{parseFloat(p.price || 0).toFixed(2)}</td>
                  <td className="p-4 text-center"><span className={`px-2 py-1 rounded-md text-xs font-bold ${p.stock_quantity > 10 ? "bg-emerald-500/10 text-emerald-400" : p.stock_quantity > 0 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>{p.stock_quantity}</span></td>
                  <td className="p-4 text-center"><span className={`px-2 py-1 rounded-md text-xs font-bold ${p.status === "active" ? "bg-emerald-500/10 text-emerald-400" : p.status === "inactive" ? "bg-gray-500/10 text-gray-400" : "bg-yellow-500/10 text-yellow-400"}`}>{p.status}</span></td>
                  <td className="p-4"><div className="flex justify-center gap-2">
                    <button onClick={() => openEditProduct(p)} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition" title="Edit"><Edit2 size={16} /></button>
                    <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition" title="Delete"><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No products found.</td></tr>}
            </tbody>
          </table>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <ProductModal
        show={showProductModal}
        editingProduct={editingProduct}
        productForm={productForm}
        productError={productError}
        productSaving={productSaving}
        categories={categories}
        onFieldChange={handleProductFieldChange}
        onClose={() => setShowProductModal(false)}
        onSave={saveProduct}
        onSelectImage={handleImageSelection}
        onUploadImage={handleImageUpload}
        onClearImage={clearProductImageSelection}
        productImageFile={productImageFile}
        productImagePreview={productImagePreview}
        uploadingImage={uploadingImage}
        uploadTarget={uploadTarget}
      />
      <BulkImportModal show={showBulkImportModal} onClose={() => setShowBulkImportModal(false)} onImportComplete={fetchProducts} apiCall={apiCall} getApiUrl={getApiUrl} token={token} />
    </div>
  );
}
