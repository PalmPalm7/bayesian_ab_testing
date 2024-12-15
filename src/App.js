import './App.css';
import { useState } from 'react';
import DailyDashboard from './components/DailyDashboard';
import DailyAnalysisDashboard from './components/DailyAnalysisDashboard';
import HourlyDashboard from './components/HourlyDashboard';

function App() {
  const [activeView, setActiveView] = useState('daily');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button 
            onClick={() => setActiveView('daily')}
            className={`px-4 py-2 rounded transition-colors ${
              activeView === 'daily' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            Daily Dashboard
          </button>
          <button 
            onClick={() => setActiveView('analysis')}
            className={`px-4 py-2 rounded transition-colors ${
              activeView === 'analysis' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            Daily Analysis
          </button>
          <button 
            onClick={() => setActiveView('hourly')}
            className={`px-4 py-2 rounded transition-colors ${
              activeView === 'hourly' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            Hourly Analysis
          </button>
        </div>
      </div>
      
      <main className="p-4">
        {activeView === 'daily' && <DailyDashboard />}
        {activeView === 'analysis' && <DailyAnalysisDashboard />}
        {activeView === 'hourly' && <HourlyDashboard />}
      </main>
    </div>
  );
}

export default App;