import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Printer, ArrowLeft, ArrowRight, Save, X, Settings, User, 
  ChevronRight, ChevronLeft, CreditCard, Banknote, Calendar, BarChart2, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { salesAPI, inventoryAPI, customerAPI } from '../api';

const AdvancedSalesTerminal = ({ onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Invoice Details');
  const [activeCustomerTab, setActiveCustomerTab] = useState('Customer Data');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Header State
  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: '', date: new Date().toISOString().split('T')[0], hijriyDate: '',
    type: 'Cash', costCenter: '', salesman: '', stock: 'Main Warehouse', deliv: '',
    reference: '', orderNo: '', currency: 'SAR', exchangeRate: 1
  });

  const [customerData, setCustomerData] = useState({
    customer: null, subAccount: '', address: '', taxNo: '', 
    balance: 0, note: '', fax: '', tel: ''
  });

  // Grid State
  const [gridItems, setGridItems] = useState([
    { id: 1, itemNo: '', desc: '', unit: 'PCS', qty: 1, price: 0, discountPercent: 0, discountAmt: 0, total: 0, includeTax: true, tax: 0, net: 0 }
  ]);
  const [selectedRow, setSelectedRow] = useState(0);

  // Totals State
  const [totals, setTotals] = useState({
    totalQty: 0, paid: 0, mada: 0, return: 0, rest: 0,
    sTotal: 0, additions: 0, total: 0, netTaxDiscount: 0, netAmount: 0, totalTaxes: 0, netWithTaxes: 0
  });

  useEffect(() => {
    // Fetch data
    inventoryAPI.getProducts().then(res => setProducts(res.data)).catch(console.error);
    customerAPI.getCustomers().then(res => setCustomers(res.data)).catch(console.error);
  }, []);

  // Calculation Logic
  useEffect(() => {
    let sTotal = 0;
    let totalQty = 0;
    let totalTaxes = 0;
    
    const updatedItems = gridItems.map(item => {
      let lineTotal = item.qty * item.price;
      let discAmt = item.discountAmt || (lineTotal * (item.discountPercent / 100));
      let afterDisc = lineTotal - discAmt;
      let tax = item.includeTax ? (afterDisc * 0.15) : 0; // Assuming 15% VAT
      let net = afterDisc + tax;
      
      sTotal += afterDisc;
      totalQty += item.qty;
      totalTaxes += tax;
      
      return { ...item, discountAmt: discAmt, total: afterDisc, tax, net };
    });

    if (JSON.stringify(gridItems) !== JSON.stringify(updatedItems)) {
      setGridItems(updatedItems);
    }

    setTotals(prev => ({
      ...prev,
      sTotal,
      totalQty,
      totalTaxes,
      netWithTaxes: sTotal + totalTaxes + prev.additions,
      total: sTotal + totalTaxes + prev.additions
    }));

  }, [gridItems]);

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'F2') {
         e.preventDefault();
         setGridItems(prev => [...prev, { id: Date.now(), itemNo: '', desc: '', unit: 'PCS', qty: 1, price: 0, discountPercent: 0, discountAmt: 0, total: 0, includeTax: true, tax: 0, net: 0 }]);
         setSelectedRow(gridItems.length);
      if (e.key === 'F8') {
         e.preventDefault();
         handleCheckout();
      }
      if (e.key === 'F11') {
         e.preventDefault();
         handlePrint();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [onClose, gridItems.length]);

  const handleGridChange = (index, field, value) => {
    const newItems = [...gridItems];
    newItems[index][field] = value;
    
    // Auto-fill product details if Item No or Description is entered
    if (field === 'itemNo' && value.length > 2) {
      const match = products.find(p => p.sku === value || p.barcode === value || p.name.includes(value));
      if (match) {
        newItems[index].desc = match.name;
        newItems[index].price = match.price;
        newItems[index].itemNo = match.sku || match.barcode || match._id;
        newItems[index].productId = match._id;
      }
    } else if (field === 'desc' && value.length > 2) {
      const match = products.find(p => p.name === value);
      if (match) {
        newItems[index].itemNo = match.sku || match.barcode || match._id;
        newItems[index].price = match.price;
        newItems[index].productId = match._id;
      }
    }
    
    setGridItems(newItems);
  };

  const handleKeyDown = (e, index, field) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (index === gridItems.length - 1) {
        setGridItems([...gridItems, { id: Date.now(), itemNo: '', desc: '', unit: 'PCS', qty: 1, price: 0, discountPercent: 0, discountAmt: 0, total: 0, includeTax: true, tax: 0, net: 0 }]);
        setSelectedRow(index + 1);
      } else {
        setSelectedRow(index + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) setSelectedRow(index - 1);
    }
  };

  const handleCheckout = async () => {
    if (isProcessing) return;
    
    const validItems = gridItems.filter(item => item.productId && item.qty > 0);
    if (validItems.length === 0) {
      alert("No valid products in grid to checkout.");
      return;
    }

    setIsProcessing(true);
    try {
      const items = validItems.map(item => ({
         productId: item.productId,
         quantity: Number(item.qty),
         price: Number(item.price),
         tax: Number(item.tax) || 0,
         discountAmount: Number(item.discountAmt) || 0
      }));

      const isCredit = invoiceData.type === 'Credit';
      const saleData = {
        items,
        customerId: customerData.customer?.id || null,
        customerName: customerData.customer?.name || 'Walk-in',
        customerPhone: customerData.tel || '',
        totalAmount: totals.sTotal,
        discount: 0,
        tax: totals.totalTaxes,
        grandTotal: totals.netWithTaxes,
        paymentMethod: isCredit ? 'credit' : 'cash',
        cashAmount: isCredit ? 0 : totals.netWithTaxes,
        cardAmount: 0,
        discountType: 'amount',
        extraCharges: 0,
        notes: `Wholesale - ${invoiceData.reference || ''}`,
        cashierName: 'Staff'
      };

      const res = await salesAPI.createSale(saleData);
      
      if (res.data && res.data._id) {
         setInvoiceData(prev => ({ ...prev, invoiceNo: res.data.invoiceNumber || res.data._id.substring(res.data._id.length - 6) }));
      }
      
      alert("Wholesale Checkout Successful! You can now press F11 to print the invoice.");
      
    } catch (err) {
      console.error(err);
      alert("Checkout failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    let itemsHTML = '';
    gridItems.forEach((item, index) => {
      if (item.desc || item.itemNo) {
        itemsHTML += `
          <tr>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${index + 1}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${item.itemNo}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${item.desc}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${item.unit}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.qty}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.price.toFixed(2)}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.discountAmt.toFixed(2)}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.tax.toFixed(2)}</td>
            <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${item.net.toFixed(2)}</td>
          </tr>
        `;
      }
    });

    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #0f172a;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e3a8a; margin: 0; font-size: 28px;">TAX INVOICE</h1>
          <p style="margin: 4px 0; color: #64748b; font-weight: bold;">Wholesale Division</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px;">
          <div style="line-height: 1.6;">
            <strong>Invoice No:</strong> ${invoiceData.invoiceNo || 'DRAFT'}<br/>
            <strong>Date:</strong> ${invoiceData.date}<br/>
            <strong>Type:</strong> ${invoiceData.type}
          </div>
          <div style="line-height: 1.6; text-align: right;">
            <strong>Customer:</strong> ${customerData.customer?.name || 'Walk-in'}<br/>
            <strong>Phone:</strong> ${customerData.tel || '-'}<br/>
            <strong>Tax No:</strong> ${customerData.taxNo || '-'}
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 40px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #94a3b8;">
              <th style="padding: 10px 6px; text-align: left; color: #334155;">#</th>
              <th style="padding: 10px 6px; text-align: left; color: #334155;">Item No</th>
              <th style="padding: 10px 6px; text-align: left; color: #334155;">Description</th>
              <th style="padding: 10px 6px; text-align: left; color: #334155;">Unit</th>
              <th style="padding: 10px 6px; text-align: right; color: #334155;">Qty</th>
              <th style="padding: 10px 6px; text-align: right; color: #334155;">Price</th>
              <th style="padding: 10px 6px; text-align: right; color: #334155;">Disc</th>
              <th style="padding: 10px 6px; text-align: right; color: #334155;">Tax</th>
              <th style="padding: 10px 6px; text-align: right; color: #334155;">Net Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 300px; border: 1px solid #cbd5e1; padding: 20px; border-radius: 8px; background: #f8fafc;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #475569;">
              <span>Subtotal:</span> <strong>SAR ${totals.sTotal.toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 14px; color: #475569;">
              <span>Taxes (VAT):</span> <strong>SAR ${totals.totalTaxes.toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; border-top: 2px solid #cbd5e1; padding-top: 16px; margin-top: 8px;">
              <span style="color: #0f172a; font-weight: bold;">Net Total:</span> <strong style="color: #1e3a8a;">SAR ${totals.netWithTaxes.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.innerHTML = printContent;
    
    document.body.appendChild(printContainer);
    document.body.classList.add('printing');
    
    window.print();
    
    document.body.classList.remove('printing');
    document.body.removeChild(printContainer);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#e2e8f0', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div style={{ background: '#cbd5e1', padding: '4px', borderBottom: '2px solid #94a3b8', display: 'flex', gap: 4 }}>
        <button onClick={onClose} style={{ background: '#ef4444', color: 'white', border: '1px solid #b91c1c', padding: '4px 12px', fontWeight: 'bold', cursor: 'pointer', borderRadius: 4 }}>Close (Esc)</button>
        <span style={{ fontSize: 14, fontWeight: 'bold', padding: '4px 8px', color: '#1e293b' }}>Invoice Sales - Pro Mode</span>
      </div>

      <div style={{ padding: '8px', display: 'flex', gap: 8, flexShrink: 0, background: '#f8fafc' }}>
        
        {/* Invoice Data Panel */}
        <div style={{ flex: 1, border: '1px solid #94a3b8', background: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', fontSize: 12, fontWeight: 'bold' }}>Invoice Data</div>
          <div style={{ padding: 8, display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', gap: '4px 12px', fontSize: 12 }}>
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Invoice NO :</label>
            <input value={invoiceData.invoiceNo} readOnly style={{ background: '#fee2e2', border: '1px solid #94a3b8', padding: 2 }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Date :</label>
            <input type="date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }} />

            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Order NO :</label>
            <input value={invoiceData.orderNo} onChange={e => setInvoiceData({...invoiceData, orderNo: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Hijriy Date :</label>
            <input value={invoiceData.hijriyDate} onChange={e => setInvoiceData({...invoiceData, hijriyDate: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }} />

            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Reference :</label>
            <input value={invoiceData.reference} onChange={e => setInvoiceData({...invoiceData, reference: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Currency :</label>
            <select value={invoiceData.currency} onChange={e => setInvoiceData({...invoiceData, currency: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2, background: '#fef3c7' }}>
              <option>SR</option><option>USD</option>
            </select>
          </div>
        </div>

        {/* Middle Meta Panel */}
        <div style={{ flex: 1, border: '1px solid #94a3b8', background: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', fontSize: 12, fontWeight: 'bold', height: 20 }}></div>
          <div style={{ padding: 8, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 12 }}>
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Type :</label>
            <select value={invoiceData.type} onChange={e => setInvoiceData({...invoiceData, type: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }}>
              <option>Cash</option><option>Credit</option>
            </select>
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>C.Cost :</label>
            <input value={invoiceData.costCenter} onChange={e => setInvoiceData({...invoiceData, costCenter: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>S.Man :</label>
            <input value={invoiceData.salesman} onChange={e => setInvoiceData({...invoiceData, salesman: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Stock :</label>
            <input value={invoiceData.stock} onChange={e => setInvoiceData({...invoiceData, stock: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }} />
          </div>
        </div>

        {/* Customer Data Panel */}
        <div style={{ flex: 1.5, border: '1px solid #94a3b8', background: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex' }}>
            {['Customer Data', 'Commission Data', 'Other Data'].map(tab => (
              <div key={tab} onClick={() => setActiveCustomerTab(tab)} style={{ background: activeCustomerTab === tab ? '#e2e8f0' : '#cbd5e1', padding: '2px 8px', fontSize: 12, fontWeight: 'bold', borderTop: '1px solid #94a3b8', borderRight: '1px solid #94a3b8', cursor: 'pointer', borderBottom: activeCustomerTab === tab ? 'none' : '1px solid #94a3b8', zIndex: activeCustomerTab === tab ? 10 : 1, marginTop: activeCustomerTab === tab ? -1 : 0 }}>
                {tab}
              </div>
            ))}
          </div>
          <div style={{ padding: 8, display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', gap: '4px 12px', fontSize: 12 }}>
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Customer :</label>
            <select style={{ border: '1px solid #94a3b8', padding: 2, gridColumn: 'span 3' }} onChange={e => {
               const c = customers.find(x => x._id === e.target.value);
               if(c) setCustomerData({...customerData, customer: c, taxNo: '123456', balance: c.loyaltyPoints || 0, tel: c.phone, address: 'N/A'});
            }}>
              <option value="">Select Customer...</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Sub Account :</label>
            <input value={customerData.subAccount} onChange={e => setCustomerData({...customerData, subAccount: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }} />
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Fax :</label>
            <input value={customerData.fax} onChange={e => setCustomerData({...customerData, fax: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Tax NO :</label>
            <input value={customerData.taxNo} readOnly style={{ border: '1px solid #94a3b8', padding: 2, background: '#f1f5f9' }} />
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Tel :</label>
            <input value={customerData.tel} onChange={e => setCustomerData({...customerData, tel: e.target.value})} style={{ border: '1px solid #94a3b8', padding: 2 }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Balance :</label>
            <input value={customerData.balance} readOnly style={{ border: '1px solid #94a3b8', padding: 2, background: '#f1f5f9' }} />
          </div>
        </div>
      </div>

      {/* GRID SECTION */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderTop: '2px solid #3b82f6', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#cbd5e1' }}>
          {['Invoice Details', 'Invoice Add', 'Inv Materials Produced', 'Cuff Movement', 'Valin ny Fahefana Zakat'].map(tab => (
            <div key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? '#3b82f6' : '#cbd5e1', color: activeTab === tab ? 'white' : 'black', padding: '4px 12px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer', borderRight: '1px solid #94a3b8' }}>
              {tab}
            </div>
          ))}
        </div>
        
        {/* Table Header */}
        <datalist id="pro-products-list">
          {products.map(p => <option key={p._id} value={p.name} />)}
        </datalist>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 120px 1fr 60px 60px 80px 80px 80px 80px 40px 80px 100px', background: '#3b82f6', color: 'white', fontSize: 11, fontWeight: 'bold', textAlign: 'center', borderBottom: '2px solid #1e3a8a' }}>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>#</div>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>Item No</div>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>Item Description</div>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>Unit</div>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>Qty</div>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>Price</div>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>Discount %</div>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>Discount</div>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>Total</div>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>Inc Tax</div>
          <div style={{ padding: 4, borderRight: '1px solid #60a5fa' }}>Tax</div>
          <div style={{ padding: 4 }}>Net With Tax</div>
        </div>

        {/* Table Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {gridItems.map((item, index) => (
            <div key={item.id} onClick={() => setSelectedRow(index)} style={{ display: 'grid', gridTemplateColumns: '40px 120px 1fr 60px 60px 80px 80px 80px 80px 40px 80px 100px', background: selectedRow === index ? '#bfdbfe' : (index % 2 === 0 ? '#f8fafc' : '#f1f5f9'), fontSize: 12, borderBottom: '1px solid #cbd5e1' }}>
              <div style={{ padding: 4, textAlign: 'center', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{index + 1}</div>
              <input value={item.itemNo} onChange={e => handleGridChange(index, 'itemNo', e.target.value)} onKeyDown={e => handleKeyDown(e, index, 'itemNo')} style={{ padding: 4, border: 'none', background: 'transparent', width: '100%', borderRight: '1px solid #cbd5e1', outline: 'none' }} placeholder="Item No" />
              <input list="pro-products-list" value={item.desc} onChange={e => handleGridChange(index, 'desc', e.target.value)} onKeyDown={e => handleKeyDown(e, index, 'desc')} style={{ padding: 4, border: 'none', background: 'transparent', width: '100%', borderRight: '1px solid #cbd5e1', outline: 'none' }} placeholder="Type product name..." />
              <input value={item.unit} onChange={e => handleGridChange(index, 'unit', e.target.value)} onKeyDown={e => handleKeyDown(e, index, 'unit')} style={{ padding: 4, border: 'none', background: 'transparent', width: '100%', borderRight: '1px solid #cbd5e1', outline: 'none', textAlign: 'center' }} />
              <input type="number" value={item.qty} onChange={e => handleGridChange(index, 'qty', Number(e.target.value))} onKeyDown={e => handleKeyDown(e, index, 'qty')} style={{ padding: 4, border: 'none', background: 'transparent', width: '100%', borderRight: '1px solid #cbd5e1', outline: 'none', textAlign: 'right' }} />
              <input type="number" value={item.price} onChange={e => handleGridChange(index, 'price', Number(e.target.value))} onKeyDown={e => handleKeyDown(e, index, 'price')} style={{ padding: 4, border: 'none', background: 'transparent', width: '100%', borderRight: '1px solid #cbd5e1', outline: 'none', textAlign: 'right' }} />
              <input type="number" value={item.discountPercent} onChange={e => handleGridChange(index, 'discountPercent', Number(e.target.value))} onKeyDown={e => handleKeyDown(e, index, 'discountPercent')} style={{ padding: 4, border: 'none', background: 'transparent', width: '100%', borderRight: '1px solid #cbd5e1', outline: 'none', textAlign: 'right' }} />
              <input type="number" value={item.discountAmt} onChange={e => handleGridChange(index, 'discountAmt', Number(e.target.value))} onKeyDown={e => handleKeyDown(e, index, 'discountAmt')} style={{ padding: 4, border: 'none', background: 'transparent', width: '100%', borderRight: '1px solid #cbd5e1', outline: 'none', textAlign: 'right' }} />
              <div style={{ padding: 4, textAlign: 'right', borderRight: '1px solid #cbd5e1', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{item.total.toFixed(2)}</div>
              <div style={{ padding: 4, textAlign: 'center', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input type="checkbox" checked={item.includeTax} onChange={e => handleGridChange(index, 'includeTax', e.target.checked)} />
              </div>
              <div style={{ padding: 4, textAlign: 'right', borderRight: '1px solid #cbd5e1', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{item.tax.toFixed(2)}</div>
              <div style={{ padding: 4, textAlign: 'right', background: '#e2e8f0', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{item.net.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER & TOTALS */}
      <div style={{ display: 'flex', background: '#e2e8f0', borderTop: '2px solid #94a3b8', padding: 8, gap: 8 }}>
        
        {/* Left Side: Stock & Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, border: '1px solid #94a3b8', background: '#f8fafc', padding: 4, fontSize: 12 }}>
              <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Description:</span> {gridItems[selectedRow]?.desc}
            </div>
            <div style={{ width: 120, border: '1px solid #94a3b8', background: '#f8fafc', padding: 4, fontSize: 12 }}>
              <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Loc:</span> M-01
            </div>
            <div style={{ width: 120, border: '1px solid #94a3b8', background: '#f8fafc', padding: 4, fontSize: 12 }}>
              <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Packing:</span> BOX
            </div>
          </div>
          
          {/* Stock Bar */}
          <div style={{ border: '1px solid #94a3b8', background: '#64748b', display: 'flex', color: 'white', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>
            <div style={{ flex: 1, padding: 4, borderRight: '1px solid #94a3b8' }}>Stock</div>
            <div style={{ flex: 1, padding: 4, borderRight: '1px solid #94a3b8' }}>Quantity</div>
            <div style={{ flex: 1, padding: 4, borderRight: '1px solid #94a3b8' }}>Q.Storage</div>
            <div style={{ flex: 1, padding: 4, borderRight: '1px solid #94a3b8' }}>Reserved</div>
            <div style={{ flex: 1, padding: 4, borderRight: '1px solid #94a3b8' }}>Required</div>
            <div style={{ flex: 1, padding: 4 }}>Location</div>
          </div>
          <div style={{ border: '1px solid #94a3b8', borderTop: 'none', background: '#f8fafc', display: 'flex', fontSize: 11, textAlign: 'center' }}>
            <div style={{ flex: 1, padding: 4, borderRight: '1px solid #94a3b8', background: '#93c5fd' }}>{gridItems[selectedRow]?.itemNo ? 'Available' : ''}</div>
            <div style={{ flex: 1, padding: 4, borderRight: '1px solid #94a3b8' }}>1500</div>
            <div style={{ flex: 1, padding: 4, borderRight: '1px solid #94a3b8' }}>1500</div>
            <div style={{ flex: 1, padding: 4, borderRight: '1px solid #94a3b8' }}>0</div>
            <div style={{ flex: 1, padding: 4, borderRight: '1px solid #94a3b8' }}>0</div>
            <div style={{ flex: 1, padding: 4 }}>Main</div>
          </div>

          {/* Toolbar Buttons */}
          <div style={{ display: 'flex', gap: 4, marginTop: 'auto' }}>
            <button style={{ padding: '6px 12px', background: '#f8fafc', border: '1px solid #94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 'bold' }}>
              <Plus size={14} color="#16a34a" /> F2 Insert
            </button>
            <button style={{ padding: '6px 12px', background: '#f8fafc', border: '1px solid #94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 'bold' }}>
              <Search size={14} color="#2563eb" /> F5 Search
            </button>
            <button onClick={handlePrint} style={{ padding: '6px 12px', background: '#f8fafc', border: '1px solid #94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 'bold' }}>
              <Printer size={14} color="#475569" /> F11 Print
            </button>
            
            <button style={{ padding: '6px 12px', background: '#f8fafc', border: '1px solid #94a3b8', cursor: 'pointer' }}><ArrowLeft size={14} /></button>
            <button style={{ padding: '6px 12px', background: '#f8fafc', border: '1px solid #94a3b8', cursor: 'pointer' }}><ArrowRight size={14} /></button>
            
            <button onClick={onClose} style={{ padding: '6px 12px', background: '#fee2e2', border: '1px solid #fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 'bold', marginLeft: 'auto' }}>
              <X size={14} color="#dc2626" /> Esc Exit
            </button>
          </div>
        </div>

        {/* Right Side: Totals */}
        <div style={{ width: 350, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px', fontSize: 11 }}>
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>Total Qty:</label>
            <input value={totals.totalQty} readOnly style={{ border: '1px solid #94a3b8', background: '#dcfce7', textAlign: 'center', fontWeight: 'bold' }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>Paid:</label>
            <input value={totals.paid} readOnly style={{ border: '1px solid #94a3b8', background: '#dcfce7', textAlign: 'center' }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>Mada:</label>
            <input value={totals.mada} readOnly style={{ border: '1px solid #94a3b8', background: '#dcfce7', textAlign: 'center' }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>Return:</label>
            <input value={totals.return} readOnly style={{ border: '1px solid #94a3b8', background: '#fee2e2', textAlign: 'center' }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>The Rest:</label>
            <input value={totals.rest} readOnly style={{ border: '1px solid #94a3b8', background: '#fee2e2', textAlign: 'center' }} />
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px', fontSize: 11 }}>
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>S. Total:</label>
            <input value={totals.sTotal.toFixed(2)} readOnly style={{ border: '1px solid #94a3b8', background: '#94a3b8', color: 'white', textAlign: 'right', fontWeight: 'bold', outline: 'none' }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>Additions:</label>
            <input value={totals.additions.toFixed(2)} readOnly style={{ border: '1px solid #94a3b8', background: '#94a3b8', color: 'white', textAlign: 'right', outline: 'none' }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>Total:</label>
            <input value={totals.total.toFixed(2)} readOnly style={{ border: '1px solid #94a3b8', background: '#94a3b8', color: 'white', textAlign: 'right', outline: 'none' }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>Net Amt:</label>
            <input value={totals.netAmount.toFixed(2)} readOnly style={{ border: '1px solid #94a3b8', background: '#94a3b8', color: 'white', textAlign: 'right', outline: 'none' }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>Taxes:</label>
            <input value={totals.totalTaxes.toFixed(2)} readOnly style={{ border: '1px solid #94a3b8', background: '#dcfce7', textAlign: 'right', outline: 'none' }} />
            
            <label style={{ fontWeight: 'bold', color: '#1d4ed8', textAlign: 'right', paddingRight: 4 }}>Net w/Tax:</label>
            <input value={totals.netWithTaxes.toFixed(2)} readOnly style={{ border: '1px solid #94a3b8', background: '#fecaca', color: '#b91c1c', textAlign: 'right', fontWeight: 'bold', outline: 'none' }} />
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdvancedSalesTerminal;
