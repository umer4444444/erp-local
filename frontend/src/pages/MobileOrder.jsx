import React from 'react';
import { ShoppingCart, Plus, Minus, CreditCard, Banknote } from 'lucide-react';

const MobileOrder = () => {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px' }}>Direct Sale</h2>
      
      <div style={{ background: 'var(--bg-panel)', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px var(--border-color-rgb)', marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Select Customer</label>
        <select style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: 'var(--bg-main)', fontSize: 16, outline: 'none' }}>
          <option>Madina Cash & Carry</option>
          <option>Walk-in Customer</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {[
          { name: 'Marlboro Red (Carton)', price: 1500, stock: 45 },
          { name: 'Gold Leaf (Carton)', price: 1200, stock: 20 }
        ].map((item, idx) => (
          <div key={idx} style={{ background: 'var(--bg-panel)', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>SAR {item.price} • {item.stock} in vehicle</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #cbd5e1', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
              <span style={{ fontWeight: 700, width: 20, textAlign: 'center' }}>{idx === 0 ? 2 : 0}</span>
              <button style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--text-main)', color: 'var(--bg-panel)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
          <span>SAR 3,000</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #334155' }}>
          <span style={{ color: 'var(--text-muted)' }}>Tax (15%)</span>
          <span>SAR 450</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
          <span>Total</span>
          <span>SAR 3,450</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button style={{ background: '#2563eb', color: 'var(--bg-panel)', border: 'none', padding: 16, borderRadius: 12, fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <Banknote size={20} /> Cash Sale
        </button>
        <button style={{ background: 'var(--bg-panel)', color: '#2563eb', border: '1px solid #2563eb', padding: 16, borderRadius: 12, fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <CreditCard size={20} /> Credit Sale
        </button>
      </div>

    </div>
  );
};

export default MobileOrder;
