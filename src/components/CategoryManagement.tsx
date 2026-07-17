import React, { useState } from 'react';
import { Category, Product } from '../types';
import { Plus, Trash2, Edit2, FolderPlus, Tag } from 'lucide-react';

interface CategoryManagementProps {
  categories: Category[];
  products: Product[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export default function CategoryManagement({
  categories,
  products,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagementProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama kategori tidak boleh kosong.');
      return;
    }

    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        name: name.trim(),
        description: description.trim(),
      });
      setEditingCategory(null);
    } else {
      // Check duplicate name
      const isDuplicate = categories.some(
        (c) => c.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (isDuplicate) {
        setError('Nama kategori sudah terdaftar.');
        return;
      }
      onAddCategory({ name: name.trim(), description: description.trim() });
    }

    setName('');
    setDescription('');
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setError('');
  };

  const handleDelete = (id: string) => {
    // Check if category is used by products
    const productCount = products.filter((p) => p.categoryId === id).length;
    if (productCount > 0) {
      alert(`Kategori tidak bisa dihapus karena sedang digunakan oleh ${productCount} produk.`);
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      onDeleteCategory(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="category-mgmt-container">
      {/* Form Input Kategori */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit" id="category-form-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-50/80 text-indigo-600 rounded-lg">
            <FolderPlus className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            {editingCategory ? 'Ubah Kategori' : 'Tambah Kategori'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" id="category-form">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
              placeholder="Contoh: Makanan, Minuman, Sembako"
              value={name}
              onChange={(e) => setName(e.target.value)}
              id="category-name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Keterangan (Opsional)
            </label>
            <textarea
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 h-24 resize-none"
              placeholder="Tambahkan keterangan tentang kategori ini"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              id="category-desc-input"
            />
          </div>

          {error && <p className="text-xs text-red-500" id="category-form-error">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              id="category-submit-btn"
            >
              {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </button>
            {editingCategory && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2 px-4 rounded-xl transition-all text-sm cursor-pointer"
                id="category-cancel-btn"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Daftar Kategori */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="category-list-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-50/80 text-indigo-600 rounded-lg">
            <Tag className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Daftar Kategori</h2>
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full" id="category-count">
            Total: {categories.length} Kategori
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400" id="empty-categories-view">
            <Tag className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
            <p className="text-sm">Belum ada kategori terdaftar.</p>
          </div>
        ) : (
          <div className="space-y-3" id="categories-list-container">
            {/* Mobile Cards for Categories */}
            <div className="md:hidden space-y-3" id="categories-mobile-list">
              {categories.map((category) => {
                const productCount = products.filter((p) => p.categoryId === category.id).length;
                return (
                  <div key={category.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-2 relative" id={`category-card-${category.id}`}>
                    <div className="pr-16">
                      <h4 className="font-bold text-slate-800 leading-snug">{category.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{category.description || 'Tidak ada deskripsi'}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/50 mt-1">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {productCount} Produk
                      </span>
                    </div>

                    <div className="absolute right-3 top-3 flex items-center gap-0.5">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kategori"
                        id={`edit-category-mobile-btn-${category.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kategori"
                        id={`delete-category-mobile-btn-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto" id="category-table-wrapper">
              <table className="w-full text-left border-collapse" id="category-table">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Nama Kategori</th>
                    <th className="py-3 px-4 font-semibold">Keterangan</th>
                    <th className="py-3 px-4 font-semibold">Jumlah Produk</th>
                    <th className="py-3 px-4 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                  {categories.map((category) => {
                    const productCount = products.filter((p) => p.categoryId === category.id).length;
                    return (
                      <tr key={category.id} className="hover:bg-slate-50 transition-colors" id={`category-row-${category.id}`}>
                        <td className="py-3 px-4 font-medium text-slate-800">{category.name}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {category.description || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                            {productCount} Produk
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit Kategori"
                              id={`edit-category-btn-${category.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Kategori"
                              id={`delete-category-btn-${category.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
