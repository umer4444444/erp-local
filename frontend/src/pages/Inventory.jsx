import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, AlertCircle, RefreshCw, Edit3, MoreVertical, Calendar, ArrowUpRight, Download, Upload, X, Trash2, Save, TrendingUp, Tags } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { inventoryAPI } from '../api';

const Inventory = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [], expiringSoon: [] });
  const [search, setSearch] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [bulkRows, setBulkRows] = useState([{ id: Date.now(), name: '', categoryId: '', price: '', cost: '', stock: '', expiry: '' }]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchData();
    fetchCategories();
    // Handle deep-linking from Dashboard
    if (location.state?.filter) {
      setSearch(location.state.filter);
    }

    const interval = setInterval(fetchData, 3000); // Live stock sync every 3s
    return () => clearInterval(interval);
  }, [location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, alertRes] = await Promise.all([
        inventoryAPI.getProducts(),
        inventoryAPI.getAlerts()
      ]);
      setProducts(prodRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await inventoryAPI.getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct({ ...product });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    try {
      await inventoryAPI.updateProduct(editingProduct.id, editingProduct);
      setShowEditModal(false);
      fetchData();
      alert('Product updated successfully!');
    } catch (err) {
      alert('Failed to update product.');
    }
  };

  const exportSelectedToCSV = () => {
    const productsToExport = products.filter(p => selectedIds.has(p.id));
    if (productsToExport.length === 0) {
      alert("Please select at least one product to export.");
      return;
    }
    const headers = ['Name', 'SKU', 'Category', 'Stock', 'Price', 'Cost', 'Margin %', 'Expiry'];
    const rows = productsToExport.map(p => {
        const margin = p.costPrice ? (((p.price - p.costPrice) / p.price) * 100).toFixed(0) : 0;
        return [p.name, p.sku, p.Category?.name || 'N/A', p.stock, p.price, p.costPrice || 0, `${margin}%`, p.expiryDate || ''];
    });
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'selected_inventory_export.csv';
    link.click();
  };

  const exportAllToCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Stock', 'Price', 'Cost', 'Margin %', 'Expiry'];
    const rows = filteredProducts.map(p => {
        const margin = p.costPrice ? (((p.price - p.costPrice) / p.price) * 100).toFixed(0) : 0;
        return [p.name, p.sku, p.Category?.name || 'N/A', p.stock, p.price, p.costPrice || 0, `${margin}%`, p.expiryDate || ''];
    });
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inventory_all_export.csv';
    link.click();
  };

  const addBulkRow = () => {
    setBulkRows([...bulkRows, { id: Date.now(), name: '', categoryId: '', price: '', cost: '', stock: '', expiry: '' }]);
  };

  const removeBulkRow = (id) => {
    if (bulkRows.length > 1) {
      setBulkRows(bulkRows.filter(r => r.id !== id));
    }
  };

  const updateBulkRow = (id, field, value) => {
    setBulkRows(bulkRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const submitBulkImport = async () => {
    setLoading(true);
    try {
      const validRows = bulkRows.filter(r => r.name && r.price && r.cost);
      for (const row of validRows) {
        await inventoryAPI.addProduct({
          name: row.name,
          categoryId: row.categoryId || null,
          price: parseFloat(row.price),
          costPrice: parseFloat(row.cost),
          stock: parseInt(row.stock) || 0,
          expiryDate: row.expiry || null,
          sku: `SKU-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
        });
      }
      setShowBulkModal(false);
      setBulkRows([{ id: Date.now(), name: '', categoryId: '', price: '', cost: '', stock: '', expiry: '' }]);
      fetchData();
      alert(`Successfully imported ${validRows.length} items!`);
    } catch (err) {
      alert('Failed to import items.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (stock) => {
    if (stock <= 0) return '#ef4444';
    if (stock <= 10) return '#f59e0b';
    return '#10b981';
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter ? (p.categoryId === parseInt(categoryFilter) || p.Category?.id === parseInt(categoryFilter)) : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Inventory Ledger</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Manage categorized stock and product details.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search items..." 
              style={{ padding: '12px 12px 12px 44px', borderRadius: 14, border: '1px solid #e2e8f0', width: 220, fontWeight: 600 }}
            />
          </div>
          
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600, background: 'white', minWidth: 150 }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <button onClick={exportAllToCSV} style={{ padding: '12px 20px', borderRadius: 14, background: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Export All
          </button>
          <button onClick={exportSelectedToCSV} style={{ padding: '12px 20px', borderRadius: 14, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Export Selected {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
          <button onClick={() => setShowBulkModal(true)} style={{ padding: '12px 24px', borderRadius: 14, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Upload size={18} /> Bulk Entry
          </button>
        </div>
      </header>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: '20px 24px', width: 40 }}>
                <input 
                  type="checkbox" 
                  checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                />
              </th>
              <th style={{ padding: '20px 24px', color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Product</th>
              <th style={{ padding: '20px 24px', color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '20px 24px', color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Stock</th>
              <th style={{ padding: '20px 24px', color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Price</th>
              <th style={{ padding: '20px 24px', color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Cost</th>
              <th style={{ padding: '20px 24px', color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Margin</th>
              <th style={{ padding: '20px 24px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => {
              const margin = product.costPrice ? (((product.price - product.costPrice) / product.price) * 100).toFixed(0) : 0;
              return (
                <tr key={product.id} style={{ borderBottom: '1px solid #f8fafc', background: selectedIds.has(product.id) ? 'rgba(10,132,255,0.05)' : 'transparent' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(product.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedIds);
                        if (e.target.checked) newSelected.add(product.id);
                        else newSelected.delete(product.id);
                        setSelectedIds(newSelected);
                      }}
                    />
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{product.sku}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0a84ff', background: 'rgba(10,132,255,0.08)', padding: '4px 10px', borderRadius: 8 }}>
                      {product.Category?.name || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                     <span style={{ fontWeight: 900, color: getStatusColor(product.stock) }}>{product.stock}</span>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 800, color: '#0f172a' }}>${product.price}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 700, color: '#64748b' }}>${product.costPrice || 0}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: 12 }}>{margin}%</span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={() => handleEditClick(product)} style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', color: '#0a84ff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit3 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {showEditModal && editingProduct && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 500, position: 'relative', padding: 40, boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32 }}>Edit Product Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>PRODUCT NAME</label>
                    <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>CATEGORY</label>
                    <select value={editingProduct.categoryId || ''} onChange={e => setEditingProduct({...editingProduct, categoryId: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }}>
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>PRICE ($)</label>
                    <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>COST PRICE ($)</label>
                    <input type="number" value={editingProduct.costPrice || 0} onChange={e => setEditingProduct({...editingProduct, costPrice: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>STOCK</label>
                    <input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>EXPIRY DATE</label>
                    <input type="date" value={editingProduct.expiryDate?.split('T')[0] || ''} onChange={e => setEditingProduct({...editingProduct, expiryDate: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                </div>
                <button onClick={handleUpdateProduct} style={{ marginTop: 12, padding: 18, borderRadius: 16, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <Save size={18} /> Save Item Updates
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
      {/* BULK MODAL */}
      <AnimatePresence>
        {showBulkModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBulkModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'white', borderRadius: 32, width: '95%', maxWidth: 1200, position: 'relative', padding: 40, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 900 }}>Bulk Product Ledger</h2>
                  <p style={{ color: '#64748b', fontWeight: 600 }}>Assign categories and manage financials in bulk.</p>
                </div>
                <button onClick={() => setShowBulkModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>
 
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 24 }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: '#64748b' }}>PRODUCT NAME</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: '#64748b' }}>CATEGORY</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: '#64748b' }}>PRICE ($)</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: '#64748b' }}>COST ($)</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: '#64748b' }}>STOCK</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: '#64748b' }}>EXPIRY</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map(row => (
                      <tr key={row.id}>
                        <td><input value={row.name} onChange={e => updateBulkRow(row.id, 'name', e.target.value)} placeholder="Product..." style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} /></td>
                        <td>
                          <select value={row.categoryId} onChange={e => updateBulkRow(row.id, 'categoryId', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }}>
                            <option value="">None</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                          </select>
                        </td>
                        <td><input type="number" value={row.price} onChange={e => updateBulkRow(row.id, 'price', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} /></td>
                        <td><input type="number" value={row.cost} onChange={e => updateBulkRow(row.id, 'cost', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} /></td>
                        <td><input type="number" value={row.stock} onChange={e => updateBulkRow(row.id, 'stock', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} /></td>
                        <td><input type="date" value={row.expiry} onChange={e => updateBulkRow(row.id, 'expiry', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} /></td>
                        <td><button onClick={() => removeBulkRow(row.id)} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}><Trash2 size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={addBulkRow} style={{ marginTop: 12, width: '100%', padding: 14, border: '2px dashed #e2e8f0', borderRadius: 12, color: '#64748b', fontWeight: 800, cursor: 'pointer' }}>+ Add Item to Ledger</button>
              </div>
 
              <div style={{ display: 'flex', gap: 16 }}>
                <button onClick={() => setShowBulkModal(false)} style={{ flex: 1, padding: 18, borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Discard All</button>
                <button onClick={submitBulkImport} style={{ flex: 2, padding: 18, borderRadius: 16, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Confirm Bulk Import</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
