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
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            <Sales 
              isActive={tab.id === activeTabId} 
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={setActiveTabId}
              onCloseTab={handleCloseTab}
              onAddTab={handleAddTab}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesContainer;
