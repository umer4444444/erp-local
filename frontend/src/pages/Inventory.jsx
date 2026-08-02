import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, AlertCircle, RefreshCw, Edit3, MoreVertical, Calendar, ArrowUpRight, Download, Upload, X, Trash2, Save, TrendingUp, Tags, History, Clock } from 'lucide-react';
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
  const [bulkRows, setBulkRows] = useState([{ id: Date.now(), name: '', categoryId: '', price: '', cost: '', stock: '', expiry: '', manufacturer: '' }]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('');

  // New State variables for advanced features
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [movementLogs, setMovementLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const [showPredictiveModal, setShowPredictiveModal] = useState(false);
  const [predictiveData, setPredictiveData] = useState([]);
  const [predictiveLoading, setPredictiveLoading] = useState(false);
  const [autoPoLoading, setAutoPoLoading] = useState(false);

  const [showAutoDiscountModal, setShowAutoDiscountModal] = useState(false);
  const [autoDiscounts, setAutoDiscounts] = useState([]);
  const [autoDiscountLoading, setAutoDiscountLoading] = useState(false);

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

  useEffect(() => {
    if (showLogsModal) fetchMovementLogs();
  }, [showLogsModal]);

  useEffect(() => {
    if (showPredictiveModal) fetchPredictive();
  }, [showPredictiveModal]);

  const handleAutoGeneratePO = async () => {
    if (autoPoLoading) return;
    setAutoPoLoading(true);
    try {
      const res = await inventoryAPI.autoGeneratePO();
      alert(res.data.message || 'Purchase Orders created');
      fetchData();
      fetchPredictive();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to auto-generate Purchase Orders');
    } finally {
      setAutoPoLoading(false);
    }
  };

  useEffect(() => {
    if (showAutoDiscountModal) fetchAutoDiscounts();
  }, [showAutoDiscountModal]);

  const fetchMovementLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await inventoryAPI.getMovementLogs();
      setMovementLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchPredictive = async () => {
    setPredictiveLoading(true);
    try {
      const res = await inventoryAPI.getPredictive();
      setPredictiveData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPredictiveLoading(false);
    }
  };

  const fetchAutoDiscounts = async () => {
    setAutoDiscountLoading(true);
    try {
      const res = await inventoryAPI.getAutoDiscount();
      setAutoDiscounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAutoDiscountLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustProduct || !adjustQty) return;
    setAdjustLoading(true);
    try {
      await inventoryAPI.adjustStock({
        productId: adjustProduct.id,
        quantity: parseInt(adjustQty),
        reason: adjustReason
      });
      setShowAdjustModal(false);
      setAdjustQty('');
      setAdjustReason('');
      setAdjustProduct(null);
      fetchData();
      alert('Stock adjusted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Save a reference to the input element for resetting
    const inputEl = e.target;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          alert('CSV file is empty or invalid.');
          inputEl.value = '';
          return;
        }

        // Robust CSV row parser handling quoted fields
        const parseCSVRow = (row) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === '"' || ch === "'") {
              inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += ch;
            }
          }
          result.push(current.trim());
          return result;
        };

        const cleanNumber = (val) => {
          if (!val) return 0;
          const cleaned = String(val).replace(/[^0-9.-]/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        };

        const cleanInt = (val) => {
          if (!val) return 0;
          const cleaned = String(val).replace(/[^0-9.-]/g, '');
          const parsed = parseInt(cleaned, 10);
          return isNaN(parsed) ? 0 : parsed;
        };

        const cleanDate = (val) => {
          if (!val) return null;
          const trimmed = String(val).trim().toLowerCase();
          if (trimmed === '' || trimmed === 'n/a' || trimmed === 'none' || trimmed === 'null' || trimmed === 'undefined') {
            return null;
          }
          const date = new Date(val);
          if (isNaN(date.getTime())) {
            return null;
          }
          return date.toISOString().split('T')[0];
        };

        const categoryMap = {};
        categories.forEach(cat => {
          categoryMap[cat.name.toLowerCase().trim()] = cat.id;
          categoryMap[cat.id.toLowerCase().trim()] = cat.id;
        });

        const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().trim());
        const items = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const values = parseCSVRow(line);
          const item = {};
          headers.forEach((h, index) => {
            item[h] = (values[index] || '').trim();
          });
          if (item.name) {
            const categoryRaw = item.category || item.categoryid || item['category id'] || '';
            const categoryId = categoryMap[categoryRaw.toLowerCase().trim()] || null;

            const storeTypeRaw = (item.storetype || item['store type'] || 'department').toLowerCase().trim();
            const storeType = 'department';

            items.push({
              name: item.name,
              sku: item.sku || `SKU-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
              price: cleanNumber(item.price),
              costPrice: cleanNumber(item.cost || item.costprice),
              stock: cleanInt(item.stock),
              expiryDate: cleanDate(item.expiry || item.expirydate),
              storeType,
              categoryId,
              manufacturer: item.company || item.manufacturer || item.companyname || item['company name'] || '',
            });
          }
        }

        if (items.length === 0) {
          alert('No valid products found in CSV. Make sure the file has a "name" column.');
          inputEl.value = '';
          return;
        }

        setLoading(true);
        const res = await inventoryAPI.importCSV({ items });
        alert(res.data.message || `Successfully imported ${items.length} products!`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to import CSV. Check file format and try again.');
      } finally {
        setLoading(false);
        // Always reset the file input so the same file can be selected again
        inputEl.value = '';
      }
    };
    reader.onerror = () => {
      alert('Failed to read the file. Please try again.');
      inputEl.value = '';
    };
    reader.readAsText(file);
  };

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
    setEditingProduct({ 
      ...product, 
      variations: product.Variations || [] 
    });
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

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} products? This cannot be undone.`)) return;
    
    setLoading(true);
    try {
      const res = await inventoryAPI.deleteProducts({ ids: Array.from(selectedIds) });
      alert(res.data.message);
      setSelectedIds(new Set());
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete products');
    } finally {
      setLoading(false);
    }
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
    setBulkRows([...bulkRows, { id: Date.now(), name: '', categoryId: '', price: '', cost: '', stock: '', expiry: '', manufacturer: '' }]);
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
          manufacturer: row.manufacturer || '',
          sku: `SKU-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
        });
      }
      setShowBulkModal(false);
      setBulkRows([{ id: Date.now(), name: '', categoryId: '', price: '', cost: '', stock: '', expiry: '', manufacturer: '' }]);
      fetchData();
      alert(`Successfully imported ${validRows.length} items!`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to import items.');
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
    if (location.state?.filter === 'expiringSoon') {
      if (!p.expiryDate) return false;
      const daysToExpiry = (new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
      if (daysToExpiry > 30 || daysToExpiry <= 0) return false;
    }

    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter ? (p.categoryId === categoryFilter || p.Category?.id === categoryFilter) : true;
    return matchesSearch && matchesCat;
  });

  const isExpiring = (expiryDate) => {
    if (!expiryDate) return false;
    const days = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 30 && days > 0;
  };

  return (
    <div style={{ padding: '100px 40px 40px 40px', minHeight: '100vh', background: 'var(--bg-main)', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)' }}>Inventory Ledger</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Manage categorized stock and product details.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search items..." 
              style={{ padding: '12px 12px 12px 44px', borderRadius: 14, border: '1px solid #e2e8f0', width: 220, fontWeight: 600 }}
            />
          </div>
          
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid #e2e8f0', color: 'var(--text-main)', fontWeight: 600, background: 'var(--bg-panel)', minWidth: 150 }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <button onClick={exportAllToCSV} style={{ padding: '12px 20px', borderRadius: 14, background: 'var(--bg-panel)', border: '1px solid #e2e8f0', color: 'var(--text-muted)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Export All
          </button>
          <button onClick={exportSelectedToCSV} style={{ padding: '12px 20px', borderRadius: 14, background: 'var(--text-main)', color: 'var(--bg-panel)', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Export Selected {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
          {selectedIds.size > 0 && (
            <button onClick={handleDeleteSelected} style={{ padding: '12px 20px', borderRadius: 14, background: '#ef4444', color: 'var(--bg-panel)', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trash2 size={18} /> Delete Selected ({selectedIds.size})
            </button>
          )}
          <button onClick={() => setShowBulkModal(true)} style={{ padding: '12px 24px', borderRadius: 14, background: '#0a84ff', color: 'var(--bg-panel)', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Upload size={18} /> Bulk Entry
          </button>
        </div>
      </header>

      {/* Advanced Quick-Actions row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setShowLogsModal(true)} style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--bg-panel)', border: '1px solid #e2e8f0', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} /> Movement Logs
        </button>
        <button onClick={() => setShowPredictiveModal(true)} style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--bg-panel)', border: '1px solid #e2e8f0', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} /> AI Restock Suggestions
        </button>
        <button onClick={() => setShowAutoDiscountModal(true)} style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--bg-panel)', border: '1px solid #e2e8f0', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tags size={16} /> Expiring Auto-Discounts
        </button>
        <label style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--bg-panel)', border: '1px solid #e2e8f0', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={16} /> Upload CSV
          <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-panel)', borderRadius: 24, border: '1px solid var(--border-color-rgb)', overflow: 'hidden' }}>
        <div className="w-full overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid #f1f5f9' }}>
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
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Product</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Company Name</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Stock</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Price</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Cost</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Margin</th>
              <th style={{ padding: '20px 24px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => {
              const margin = product.costPrice ? (((product.price - product.costPrice) / product.price) * 100).toFixed(0) : 0;
              return (
                <tr key={product.id} style={{ borderBottom: '1px solid #f8fafc', background: selectedIds.has(product.id) ? 'rgba(10,132,255,0.05)' : (location.state?.filter === 'expiringSoon' && isExpiring(product.expiryDate) ? 'rgba(239,68,68,0.1)' : 'transparent') }}>
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
                    <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {product.sku}
                      {product.Variations?.length > 0 && (
                        <span style={{ padding: '2px 6px', background: '#f1f5f9', color: 'var(--text-muted)', borderRadius: 4, fontSize: 10 }}>
                          {product.Variations.length} Variations
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                      {product.manufacturer || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0a84ff', background: 'rgba(10,132,255,0.08)', padding: '4px 10px', borderRadius: 8 }}>
                      {product.Category?.name || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                     <span style={{ fontWeight: 900, color: getStatusColor(product.stock) }}>{product.stock}</span>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--text-main)' }}>SAR {product.price}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-muted)' }}>SAR {product.costPrice || 0}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: 12 }}>{margin}%</span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => { setAdjustProduct(product); setShowAdjustModal(true); }} title="Adjust Stock" style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', color: '#eab308', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw size={16} />
                    </button>
                    <button onClick={() => handleEditClick(product)} style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', color: '#0a84ff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit3 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {showEditModal && editingProduct && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'var(--bg-panel)', borderRadius: 32, width: '100%', maxWidth: 500, position: 'relative', padding: 40, boxShadow: '0 40px 100px var(--shadow-strong-rgb)' }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32 }}>Edit Product Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>PRODUCT NAME</label>
                    <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>CATEGORY</label>
                    <select value={editingProduct.categoryId || ''} onChange={e => setEditingProduct({...editingProduct, categoryId: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }}>
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>RETAIL PRICE (SAR)</label>
                    <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>WHOLESALE PRICE (SAR)</label>
                    <input type="number" value={editingProduct.wholesalePrice || ''} onChange={e => setEditingProduct({...editingProduct, wholesalePrice: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>COST PRICE (SAR)</label>
                    <input type="number" value={editingProduct.costPrice || 0} onChange={e => setEditingProduct({...editingProduct, costPrice: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>CURRENT STOCK</label>
                    <input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>MINIMUM STOCK</label>
                    <input type="number" value={editingProduct.minStock || 10} onChange={e => setEditingProduct({...editingProduct, minStock: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>BARCODE</label>
                    <input value={editingProduct.barcode || ''} onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>UNIT</label>
                    <select value={editingProduct.unit || 'piece'} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }}>
                      <option value="piece">Piece / Item</option>
                      <option value="box">Box</option>
                      <option value="carton">Carton</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>EXPIRY DATE</label>
                    <input type="date" value={editingProduct.expiryDate?.split('T')[0] || ''} onChange={e => setEditingProduct({...editingProduct, expiryDate: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>COMPANY NAME</label>
                    <input placeholder="Manufacturer or Brand Name" value={editingProduct.manufacturer || ''} onChange={e => setEditingProduct({...editingProduct, manufacturer: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                </div>

                {/* Variations Section */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 900 }}>Product Variations (e.g. Grades/Sizes)</h3>
                    <button 
                      onClick={() => setEditingProduct({...editingProduct, variations: [...editingProduct.variations, { name: '', price: editingProduct.price, stock: 0, sku: '' }]})}
                      style={{ padding: '6px 12px', borderRadius: 8, background: '#f1f5f9', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: '#0a84ff' }}
                    >
                      + Add Variation
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 200, overflowY: 'auto', paddingRight: 8 }}>
                    {editingProduct.variations?.map((v, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 30px', gap: 8, alignItems: 'center', background: 'var(--bg-main)', padding: 12, borderRadius: 12 }}>
                        <input 
                          placeholder="Grade/Size" 
                          value={v.name} 
                          onChange={e => {
                            const newV = [...editingProduct.variations];
                            newV[idx].name = e.target.value;
                            setEditingProduct({...editingProduct, variations: newV});
                          }}
                          style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }} 
                        />
                        <input 
                          type="number" 
                          placeholder="Price" 
                          value={v.price} 
                          onChange={e => {
                            const newV = [...editingProduct.variations];
                            newV[idx].price = e.target.value;
                            setEditingProduct({...editingProduct, variations: newV});
                          }}
                          style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }} 
                        />
                        <input 
                          type="number" 
                          placeholder="Stock" 
                          value={v.stock} 
                          onChange={e => {
                            const newV = [...editingProduct.variations];
                            newV[idx].stock = e.target.value;
                            setEditingProduct({...editingProduct, variations: newV});
                          }}
                          style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }} 
                        />
                        <button 
                          onClick={() => {
                            const newV = editingProduct.variations.filter((_, i) => i !== idx);
                            setEditingProduct({...editingProduct, variations: newV});
                          }}
                          style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {editingProduct.variations?.length === 0 && (
                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>No variations added.</div>
                    )}
                  </div>
                </div>
                <button onClick={handleUpdateProduct} style={{ marginTop: 12, padding: 18, borderRadius: 16, background: '#0a84ff', color: 'var(--bg-panel)', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
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
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'var(--bg-panel)', borderRadius: 32, width: '95%', maxWidth: 1200, position: 'relative', padding: 40, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 900 }}>Bulk Product Ledger</h2>
                  <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Assign categories and manage financials in bulk.</p>
                </div>
                <button onClick={() => setShowBulkModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>
 
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 24 }}>
                <div className="w-full overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>PRODUCT NAME</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>CATEGORY</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>COMPANY</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>PRICE (SAR)</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>COST (SAR)</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>STOCK</th>
                      <th style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>EXPIRY</th>
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
                        <td><input value={row.manufacturer} onChange={e => updateBulkRow(row.id, 'manufacturer', e.target.value)} placeholder="Company..." style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} /></td>
                        <td><input type="number" value={row.price} onChange={e => updateBulkRow(row.id, 'price', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} /></td>
                        <td><input type="number" value={row.cost} onChange={e => updateBulkRow(row.id, 'cost', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} /></td>
                        <td><input type="number" value={row.stock} onChange={e => updateBulkRow(row.id, 'stock', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} /></td>
                        <td><input type="date" value={row.expiry} onChange={e => updateBulkRow(row.id, 'expiry', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }} /></td>
                        <td><button onClick={() => removeBulkRow(row.id)} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}><Trash2 size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                <button onClick={addBulkRow} style={{ marginTop: 12, width: '100%', padding: 14, border: '2px dashed #e2e8f0', borderRadius: 12, color: 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>+ Add Item to Ledger</button>
              </div>
 
              <div style={{ display: 'flex', gap: 16 }}>
                <button onClick={() => setShowBulkModal(false)} style={{ flex: 1, padding: 18, borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Discard All</button>
                <button onClick={submitBulkImport} style={{ flex: 2, padding: 18, borderRadius: 16, background: '#0a84ff', color: 'var(--bg-panel)', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Confirm Bulk Import</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADJUST STOCK MODAL */}
      <AnimatePresence>
        {showAdjustModal && adjustProduct && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdjustModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'var(--bg-panel)', borderRadius: 32, width: '100%', maxWidth: 450, position: 'relative', padding: 40, boxShadow: '0 40px 100px var(--shadow-strong-rgb)' }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Stock Adjustment</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Product: <strong>{adjustProduct.name}</strong> (Current Stock: {adjustProduct.stock})</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>QUANTITY CHANGE (+ or -)</label>
                  <input type="number" placeholder="e.g. -5 or 10" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>REASON / NOTES</label>
                  <input placeholder="e.g. Broken packaging, count error" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                </div>
                
                <button onClick={handleAdjustStock} disabled={adjustLoading} style={{ marginTop: 12, padding: 18, borderRadius: 16, background: '#0a84ff', color: 'var(--bg-panel)', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  {adjustLoading ? 'Saving...' : 'Apply Stock Adjustment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOVEMENT LOGS MODAL */}
      <AnimatePresence>
        {showLogsModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogsModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'var(--bg-panel)', borderRadius: 32, width: '90%', maxWidth: 900, position: 'relative', padding: 40, display: 'flex', flexDirection: 'column', maxHeight: '80vh', boxShadow: '0 40px 100px var(--shadow-strong-rgb)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 900 }}>Stock Movement Logs</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>History of manual adjustments and restocks.</p>
                </div>
                <button onClick={() => setShowLogsModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 16 }}>
                {logsLoading ? (
                  <p style={{ padding: 24, textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>Loading logs...</p>
                ) : movementLogs.length === 0 ? (
                  <p style={{ padding: 24, textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>No logs recorded yet.</p>
                ) : (
                  <div className="w-full overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid #f1f5f9' }}>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>DATE/TIME</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>PRODUCT</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>CHANGE</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>TYPE</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>USER</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>NOTES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movementLogs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                          <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-main)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                          <td style={{ padding: '12px 20px', fontWeight: 800, color: '#0a84ff' }}>{log.Product?.name || 'Deleted Product'}</td>
                          <td style={{ padding: '12px 20px', fontWeight: 900, color: log.change >= 0 ? '#10b981' : '#ef4444' }}>
                            {log.change >= 0 ? `+${log.change}` : log.change}
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: log.type === 'restock' ? 'rgba(16,185,129,0.08)' : 'rgba(234,179,8,0.08)', color: log.type === 'restock' ? '#10b981' : '#ca8a04' }}>
                              {log.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>{log.User?.name || 'System'}</td>
                          <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{log.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI RESTOCK SUGGESTIONS MODAL */}
      <AnimatePresence>
        {showPredictiveModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPredictiveModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'var(--bg-panel)', borderRadius: 32, width: '90%', maxWidth: 850, position: 'relative', padding: 40, display: 'flex', flexDirection: 'column', maxHeight: '80vh', boxShadow: '0 40px 100px var(--shadow-strong-rgb)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 900 }}>AI Restock Suggestions</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Smart stock projections based on daily sales velocity.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={handleAutoGeneratePO} disabled={autoPoLoading}
                    style={{ padding: '8px 14px', borderRadius: 10, background: autoPoLoading ? 'var(--border-color)' : '#10b981', color: autoPoLoading ? 'var(--text-muted)' : 'var(--bg-panel)', border: 'none', cursor: autoPoLoading ? 'not-allowed' : 'pointer', fontWeight: 800 }}>
                    {autoPoLoading ? 'Generating…' : 'Auto-Generate POs'}
                  </button>
                  <button onClick={() => setShowPredictiveModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 16 }}>
                {predictiveLoading ? (
                  <p style={{ padding: 24, textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>Analyzing stock velocity...</p>
                ) : predictiveData.length === 0 ? (
                  <p style={{ padding: 24, textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>No restock recommendations.</p>
                ) : (
                  <div className="w-full overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid #f1f5f9' }}>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>PRODUCT</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>CURRENT STOCK</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>DAILY VELOCITY</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>DAYS REMAINING</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>RECOMMENDED ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictiveData.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                          <td style={{ padding: '12px 20px', fontWeight: 800, color: 'var(--text-main)' }}>{item.name}</td>
                          <td style={{ padding: '12px 20px', fontWeight: 700, color: '#475569' }}>{item.stock} units</td>
                          <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>{item.dailySalesRate} units/day</td>
                          <td style={{ padding: '12px 20px', fontWeight: 900, color: item.daysLeft <= 4 ? '#ef4444' : '#10b981' }}>
                            {item.daysLeft === Infinity ? 'N/A' : `${item.daysLeft} days`}
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            {item.orderNeeded ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                                  Order +{item.suggestedQty} Units
                                </span>
                                <button 
                                  onClick={async () => {
                                    try {
                                      await inventoryAPI.restock({ productId: item.id, quantity: item.suggestedQty, reason: 'AI suggested restock' });
                                      alert(`Restocked ${item.name} by ${item.suggestedQty} units!`);
                                      fetchPredictive();
                                      fetchData();
                                    } catch (err) {
                                      alert('Failed to restock');
                                    }
                                  }}
                                  style={{ padding: '6px 12px', borderRadius: 8, background: '#0a84ff', color: 'var(--bg-panel)', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Restock Now
                                </button>
                              </div>
                            ) : (
                              <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                                Stock Level Safe
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AUTO DISCOUNTS MODAL */}
      <AnimatePresence>
        {showAutoDiscountModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAutoDiscountModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'var(--bg-panel)', borderRadius: 32, width: '90%', maxWidth: 750, position: 'relative', padding: 40, display: 'flex', flexDirection: 'column', maxHeight: '80vh', boxShadow: '0 40px 100px var(--shadow-strong-rgb)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 900 }}>Expiring Auto-Discounts</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Products expiring within 5 days are auto-discounted by 50% in sales POS.</p>
                </div>
                <button onClick={() => setShowAutoDiscountModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 16 }}>
                {autoDiscountLoading ? (
                  <p style={{ padding: 24, textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>Scanning database...</p>
                ) : autoDiscounts.length === 0 ? (
                  <p style={{ padding: 24, textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>No products currently qualifying for auto-discount.</p>
                ) : (
                  <div className="w-full overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid #f1f5f9' }}>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>PRODUCT</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>DAYS TO EXPIRY</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>ORIGINAL PRICE</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>PROMO PRICE (50%)</th>
                        <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {autoDiscounts.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                          <td style={{ padding: '12px 20px', fontWeight: 800, color: 'var(--text-main)' }}>{item.name}</td>
                          <td style={{ padding: '12px 20px', fontWeight: 900, color: '#ef4444' }}>{item.daysToExpiry} days left</td>
                          <td style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', textDecoration: 'line-through' }}>SAR {item.originalPrice}</td>
                          <td style={{ padding: '12px 20px', fontWeight: 900, color: '#10b981' }}>SAR {item.promoPrice}</td>
                          <td style={{ padding: '12px 20px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                              Auto-Applied
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
