import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Printer, ArrowLeft, ArrowRight, Save, X, Settings, User, 
  ChevronRight, ChevronLeft, CreditCard, Banknote, Calendar, BarChart2, Package,
  WifiOff, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Barcode from 'react-barcode';
import { useNavigate } from 'react-router-dom';
import { salesAPI, inventoryAPI, customerAPI } from '../api';

const AdvancedSalesTerminal = ({ onClose, isActive = true }) => {
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
      if (!isActive) return;
      if (e.key === 'Escape') { 
        e.preventDefault(); 
        if (receipt) {
          setReceipt(null);
          setGridItems([{ id: Date.now(), itemNo: '', desc: '', unit: 'PCS', qty: 1, price: 0, discountPercent: 0, discountAmt: 0, total: 0, includeTax: true, tax: 0, net: 0 }]);
          setTotals({ sTotal: 0, totalQty: 0, additions: 0, totalTaxes: 0, netWithTaxes: 0, total: 0 });
        } else {
          onClose(); 
        }
      }
      if (e.key === 'F2') {
         e.preventDefault();
         setGridItems(prev => [...prev, { id: Date.now(), itemNo: '', desc: '', unit: 'PCS', qty: 1, price: 0, discountPercent: 0, discountAmt: 0, total: 0, includeTax: true, tax: 0, net: 0 }]);
         setSelectedRow(gridItems.length);
      }
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
  }, [isActive, onClose, gridItems, totals, invoiceData, customerData, receipt]);

  const handleGridChange = (index, field, value) => {
    const newItems = [...gridItems];
    newItems[index][field] = value;
    
    // Auto-fill product details if Item No or Description is entered
    if (field === 'itemNo' && value.length > 2) {
      const match = products.find(p => p.sku === value || p.barcode === value || p.name.includes(value));
      if (match) {
        newItems[index].desc = match.name;
        newItems[index].price = match.price;
        newItems[index].itemNo = match.sku || match.barcode || match.id || match._id;
        newItems[index].productId = match.id || match._id;
      }
    } else if (field === 'desc' && value.length > 2) {
      const match = products.find(p => p.name === value);
      if (match) {
        newItems[index].itemNo = match.sku || match.barcode || match.id || match._id;
        newItems[index].price = match.price;
        newItems[index].productId = match.id || match._id;
      }
    }
    
    setGridItems(newItems);
  };

  const handleKeyDown = (e, index, field) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (index === gridItems.length - 1) {
        setGridItems(prev => [...prev, { id: Date.now(), itemNo: '', desc: '', unit: 'PCS', qty: 1, price: 0, discountPercent: 0, discountAmt: 0, total: 0, includeTax: true, tax: 0, net: 0 }]);
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
    
    const items = [];
    gridItems.forEach(item => {
      let pid = item.productId;
      if (!pid && (item.itemNo || item.desc)) {
         const match = products.find(p => p.sku === item.itemNo || p.barcode === item.itemNo || p.name === item.desc || p.name === item.itemNo);
         if (match) pid = match.id || match._id;
      }
      if (pid && item.qty > 0) {
         items.push({
           productId: pid,
           quantity: Number(item.qty),
           price: Number(item.price),
           tax: Number(item.tax) || 0,
           discountAmount: Number(item.discountAmt) || 0
         });
      }
    });

    if (items.length === 0) {
      alert("No valid products in grid to checkout.");
      return;
    }

    setIsProcessing(true);
    try {

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
        discountType: 'flat',
        extraCharges: 0,
        notes: `Wholesale - ${invoiceData.reference || ''}`,
        cashierName: 'Staff'
      };

      const res = await salesAPI.createSale(saleData);
      
      if (res.data && res.data._id) {
         setInvoiceData(prev => ({ ...prev, invoiceNo: res.data.invoiceNumber || res.data._id.substring(res.data._id.length - 6) }));
      }
      
      setReceipt({ 
        ...saleData, 
        id: res.data?._id || 'OFFLINE-' + Date.now(), 
        createdAt: new Date().toISOString(), 
        items: items.map(item => ({
          name: products.find(p => p.id === item.productId || p._id === item.productId)?.name || 'Unknown',
          quantity: item.quantity,
          price: item.price
        })), 
        cashTendered: isCredit ? 0 : totals.netWithTaxes,
        changeDue: 0,
        offline: false
      });
      
    } catch (err) {
      console.error(err);
      alert("Checkout failed: " + (err.response?.data?.message || err.response?.data?.error || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (!document.getElementById('printable-invoice')) return;
    const printContent = document.getElementById('printable-invoice').innerHTML;
    
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
    <div style={{ position: 'relative', height: '100%', flex: 1, zIndex: 100, background: '#e2e8f0', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}>
      
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
            <select onChange={e => {
               const c = customers.find(x => (x.id || x._id) === e.target.value);
               if(c) setCustomerData({...customerData, customer: c, tel: c.phone || c.tel, taxNo: c.taxNo || ''});
            }} style={{ border: '1px solid #94a3b8', padding: 2, gridColumn: 'span 3' }}>
              <option value="">Select Customer...</option>
              {customers.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
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
          {products.map(p => <option key={p.id || p._id} value={p.name} />)}
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

      {/* Receipt Modal */}
      {receipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
            style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: 450, padding: 32, borderRadius: 32, maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <button onClick={() => setReceipt(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} color='var(--text-muted)' />
            </button>
            {receipt.offline && (
              <div style={{ background: '#fef3c7', padding: 10, borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                <WifiOff size={14} /> Saved offline — will sync when connection restored
              </div>
            )}
            <div id="printable-invoice" style={{ flex: 1, overflowY: 'auto', paddingRight: 8, direction: 'ltr' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {/* Simulated BTG Logo */}
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: '50%', background: '#0a84ff', color: '#fff', fontSize: 24, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>BTG</div>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px', textTransform: 'uppercase' }}>Tax Invoice / فاتورة ضريبية</h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 600 }}>
                  Txn: {receipt.id?.split('-')[0]?.toUpperCase()}<br/>
                  Cashier: {receipt.cashierName || 'Staff'}<br/>
                  Date: {new Date(receipt.createdAt).toLocaleString()}
                </div>
              </div>
              
              {(receipt.customerName || receipt.customerPhone || receipt.customerId) && (
                <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Customer / العميل</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> {receipt.customerName || 'Customer'}</div>
                  {receipt.customerPhone && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} /> {receipt.customerPhone}</div>}
                </div>
              )}

              <div style={{ borderTop: '2px dashed #cbd5e1', borderBottom: '2px dashed #cbd5e1', padding: '16px 0', margin: '16px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', paddingBottom: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 8 }}>
                  <span>Item / الصنف</span>
                  <span style={{ textAlign: 'center' }}>Qty / الكمية</span>
                  <span style={{ textAlign: 'right' }}>Total / المجموع</span>
                </div>
                {receipt.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, fontSize: 13, paddingBottom: 8, paddingTop: 8, borderBottom: '1px dashed #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{item.name}</div>
                      {item.nameAr && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', direction: 'rtl' }}>{item.nameAr}</div>}
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 700 }}>{item.quantity}</div>
                    <div style={{ textAlign: 'right', fontWeight: 800 }}>SAR {(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
                
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                  <Barcode value={receipt.id} width={1.5} height={40} fontSize={12} background="transparent" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, padding: '0 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>
                  <span>Subtotal <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>المجموع الفرعي</span></span><span>SAR {parseFloat(receipt.totalAmount || 0).toFixed(2)}</span>
                </div>
                {parseFloat(receipt.discount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#ef4444', fontWeight: 800 }}>
                    <span>Discount <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>الخصم</span></span><span>-SAR {parseFloat(receipt.discount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(receipt.extraCharges) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#0a84ff', fontWeight: 800 }}>
                    <span>Extra <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>إضافي</span></span><span>+SAR {parseFloat(receipt.extraCharges).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(receipt.tax) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>
                    <span>VAT 15% <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>ضريبة القيمة المضافة</span></span><span>+SAR {parseFloat(receipt.tax).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 20, color: 'var(--text-main)', fontWeight: 900, marginTop: 12, paddingTop: 12, borderTop: '2px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Grand Total</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', direction: 'rtl' }}>الإجمالي النهائي</span>
                  </div>
                  <span>SAR {parseFloat(receipt.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 16, borderRadius: 16, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Method <span style={{ fontSize: 11, marginLeft: 4 }}>طريقة الدفع</span></span>
                  <span style={{ textTransform: 'capitalize', color: 'var(--text-main)', fontWeight: 900 }}>{receipt.paymentMethod === 'credit' ? 'Credit / أجل' : (receipt.paymentMethod === 'card' ? 'Card / بطاقة' : 'Cash / نقداً')}</span>
                </div>
                {receipt.creditReason && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Credit Reason</span>
                    <span style={{ color: '#d97706' }}>{receipt.creditReason}</span>
                  </div>
                )}
                {receipt.paymentMethod === 'cash' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tendered <span style={{ fontSize: 11, marginLeft: 4 }}>المدفوع</span></span>
                      <span style={{ color: 'var(--text-main)' }}>SAR {parseFloat(receipt.cashTendered || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 14 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Change <span style={{ fontSize: 11, marginLeft: 4 }}>الباقي</span></span>
                      <span style={{ color: '#16a34a' }}>SAR {parseFloat(receipt.changeDue || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 16 }}>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: 14, marginBottom: 4 }}>Thank you for your business!</div>
                <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 13, direction: 'rtl' }}>شكراً لتعاملكم معنا!</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handlePrint} style={{ flex: 1, padding: 14, borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Printer size={18} /> Print Invoice (F11)
              </button>
              <button onClick={() => {
                setReceipt(null);
                setGridItems([{ id: Date.now(), itemNo: '', desc: '', unit: 'PCS', qty: 1, price: 0, discountPercent: 0, discountAmt: 0, total: 0, includeTax: true, tax: 0, net: 0 }]);
                setTotals({ sTotal: 0, totalQty: 0, additions: 0, totalTaxes: 0, netWithTaxes: 0, total: 0 });
              }} style={{ flex: 1, padding: 14, borderRadius: 16, background: '#0a84ff', color: 'var(--bg-panel)', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                New Sale (Esc)
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default AdvancedSalesTerminal;
