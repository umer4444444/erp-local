import React, { useState } from 'react';
import { Plus, X, ShoppingCart } from 'lucide-react';
import Sales from './Sales';

const SalesContainer = () => {
  const [tabs, setTabs] = useState([{ id: 1, title: 'Sale 1' }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [tabCounter, setTabCounter] = useState(1);

  const handleAddTab = () => {
    const newId = tabCounter + 1;
    setTabCounter(newId);
    setTabs([...tabs, { id: newId, title: `Sale ${newId}` }]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (idToClose, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Don't close the last tab
    
    // Check if the user wants to discard a tab (could add confirmation here later)
    
    const newTabs = tabs.filter(t => t.id !== idToClose);
    setTabs(newTabs);
    
    if (activeTabId === idToClose) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      {/* Tab Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: 'var(--bg-panel)', 
        borderBottom: '1px solid var(--border-color)', 
        padding: '8px 16px',
        gap: '8px',
        overflowX: 'auto',
        flexShrink: 0
      }}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div 
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: isActive ? '#0a84ff' : 'var(--bg-main)',
                color: isActive ? '#ffffff' : 'var(--text-main)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: isActive ? 800 : 600,
                fontSize: '14px',
                transition: 'all 0.2s',
                minWidth: '120px',
                justifyContent: 'space-between',
                border: isActive ? 'none' : '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingCart size={16} />
                <span>{tab.title}</span>
              </div>
              {tabs.length > 1 && (
                <div 
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  style={{ 
                    padding: '2px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.4)' : '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.2)' : 'transparent'}
                >
                  <X size={14} />
                </div>
              )}
            </div>
          );
        })}
        
        <button 
          onClick={handleAddTab}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px dashed var(--text-muted)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            marginLeft: '8px'
          }}
          title="New Tab"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Render all tabs, but hide inactive ones */}
      <div style={{ flex: 1, position: 'relative' }}>
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            style={{ 
              display: tab.id === activeTabId ? 'block' : 'none',
              height: '100%',
              width: '100%'
            }}
          >
            <Sales isActive={tab.id === activeTabId} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesContainer;
