import React, { useState } from 'react';
import { Plus, X, ShoppingCart } from 'lucide-react';
import Sales from './Sales';

const SalesContainer = () => {
  const [tabs, setTabs] = useState([{ id: 1, title: 'Sale 1' }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [tabCounter, setTabCounter] = useState(1);

  const handleAddTab = () => {
    setTabCounter(prev => {
      const newId = prev + 1;
      setTabs(currentTabs => [...currentTabs, { id: newId, title: `Sale ${newId}` }]);
      setActiveTabId(newId);
      return newId;
    });
  };

  const handleCloseTab = (idToClose, e) => {
    e.stopPropagation();
    setTabs(currentTabs => {
      if (currentTabs.length === 1) return currentTabs;
      const newTabs = currentTabs.filter(t => t.id !== idToClose);
      if (activeTabId === idToClose) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  };

  React.useEffect(() => {
    const handleGlobalKey = (e) => {
      // Direct jump with Alt + 1, 2, 3...
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        setTabs(currentTabs => {
          if (index < currentTabs.length) {
            setActiveTabId(currentTabs[index].id);
          }
          return currentTabs;
        });
      }
      
      // Cycle tabs with F6
      if (e.key === 'F6') {
        e.preventDefault();
        setTabs(currentTabs => {
          const currentIndex = currentTabs.findIndex(t => t.id === activeTabId);
          if (currentIndex >= 0 && currentTabs.length > 1) {
            const nextIndex = (currentIndex + 1) % currentTabs.length;
            setActiveTabId(currentTabs[nextIndex].id);
          }
          return currentTabs;
        });
      }

      // Add new tab with F7
      if (e.key === 'F7') {
        e.preventDefault();
        handleAddTab();
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [activeTabId]); // Re-bind when activeTabId changes so F6 knows current tab

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
