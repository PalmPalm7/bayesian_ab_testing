import './App.css';
import { useState } from 'react';
import BayesianDashboard from './components/BayesianDashboard';
import DailyDashboard from './components/DailyDashboard';
import SyntheticDashboard from './components/SyntheticDashboard';

function App() {
  const [activeView, setActiveView] = useState('daily');

  return (
    <div className="App">
      <div className="p-4 bg-gray-100 border-b">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button 
            onClick={() => setActiveView('daily')}
            className={`px-4 py-2 rounded ${
              activeView === 'daily' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Daily Analysis
          </button>
          {/* <button 
            onClick={() => setActiveView('hourly')}
            className={`px-4 py-2 rounded ${
              activeView === 'hourly' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Hourly Analysis
          </button> */}
          <button 
            onClick={() => setActiveView('synthetic')}
            className={`px-4 py-2 rounded ${
              activeView === 'synthetic' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Hourly Analysis
          </button>
        </div>
      </div>
      
      {/* {activeView === 'daily' ? (
        <DailyDashboard />
      ) : activeView === 'hourly' ? (
        <BayesianDashboard />
      ) : (
        <SyntheticDashboard />
      )} */}
      {activeView === 'daily' ? (
        <DailyDashboard />
      ) : (
        <SyntheticDashboard />
      )}
    </div>
  );
}

export default App;
