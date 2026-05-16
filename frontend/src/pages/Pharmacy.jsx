import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, FileText, CheckCircle, AlertTriangle, 
  Stethoscope, Pill, ClipboardList, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pharmacyAPI, inventoryAPI } from '../api';

const Pharmacy = () => {
  const [drugs, setDrugs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // inventory | prescriptions

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const res = await pharmacyAPI.getDrugs();
        setDrugs(res.data);
      } else {
        const res = await pharmacyAPI.getPendingPrescriptions();
        setPrescriptions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await pharmacyAPI.verifyPrescription(id, status);
      fetchData();
    } catch (err) {
      alert('Verification failed');
    }
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Medical Pharmacy</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Manage drug inventory and prescription verifications.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, background: 'white', padding: 6, borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => setActiveTab('inventory')}
            style={{ 
              padding: '10px 20px', borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer',
              background: activeTab === 'inventory' ? '#0f172a' : 'transparent',
              color: activeTab === 'inventory' ? 'white' : '#64748b'
            }}
          >
            Inventory
          </button>
          <button 
            onClick={() => setActiveTab('prescriptions')}
            style={{ 
              padding: '10px 20px', borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer',
              background: activeTab === 'prescriptions' ? '#0f172a' : 'transparent',
              color: activeTab === 'prescriptions' ? 'white' : '#64748b'
            }}
          >
            Prescriptions
          </button>
        </div>
      </header>

      {activeTab === 'inventory' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {drugs.map(drug => (
            <motion.div 
              layout
              key={drug.id}
              style={{ background: 'white', padding: 24, borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#0a84ff' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={24} color="#0a84ff" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', background: '#dcfce7', padding: '4px 10px', borderRadius: 10 }}>
                  STOCK: {drug.Product?.stock}
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{drug.brandName}</h3>
              <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 16 }}>{drug.genericName}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Manufacturer</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{drug.manufacturer}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Batch No</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{drug.batchNo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Expiry</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>{drug.expiryDate}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {drugs.length === 0 && <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: 100, color: '#94a3b8' }}>No drugs found in the specialized pharmacy database.</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {prescriptions.map(p => (
            <div key={p.id} style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 40, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#0f172a' }}>
                  {p.Customer?.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 18 }}>{p.Customer?.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Dr. {p.doctorName}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {p.Items?.map(item => (
                  <div key={item.id} style={{ padding: '8px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 700 }}>
                    {item.Drug?.brandName} x{item.quantity}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => handleVerify(p.id, 'verified')}
                  style={{ flex: 1, padding: '12px', borderRadius: 14, background: '#10b981', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                >
                  Verify
                </button>
                <button 
                  onClick={() => handleVerify(p.id, 'rejected')}
                  style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'white', color: '#ef4444', border: '1px solid #fee2e2', fontWeight: 800, cursor: 'pointer' }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {prescriptions.length === 0 && <div style={{ textAlign: 'center', padding: 100, color: '#94a3b8' }}>No pending prescriptions for verification.</div>}
        </div>
      )}
    </div>
  );
};

export default Pharmacy;
