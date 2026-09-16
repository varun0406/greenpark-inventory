import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InventoryProvider } from './context/InventoryContext';

const TestComponent: React.FC = () => {
  return <div>Test Component</div>;
};

const App: React.FC = () => {
  return (
    <InventoryProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<TestComponent />} />
          </Routes>
        </div>
      </Router>
    </InventoryProvider>
  );
};

export default App;