import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const BayesianDashboard = () => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedHour, setSelectedHour] = useState(10);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Simulated data generation (replace with your actual data processing)
  const generatePosteriorData = (day, hour) => {
    // This is a simplified version - replace with your actual Bayesian calculation
    const adMean = 0.15 + Math.random() * 0.05;
    const psaMean = 0.12 + Math.random() * 0.05;
    
    // Generate distribution points
    const points = Array.from({ length: 100 }, (_, i) => {
      const x = i / 100;
      return {
        conversionRate: x,
        adDensity: Math.exp(-Math.pow((x - adMean) * 20, 2)),
        psaDensity: Math.exp(-Math.pow((x - psaMean) * 20, 2))
      };
    });

    return {
      posteriorData: points,
      statistics: {
        adCredibleInterval: [adMean - 0.02, adMean + 0.02],
        psaCredibleInterval: [psaMean - 0.02, psaMean + 0.02],
        probAdBetter: adMean > psaMean ? 0.8 + Math.random() * 0.2 : 0.2 + Math.random() * 0.2
      }
    };
  };

  const analysisResult = useMemo(() => 
    generatePosteriorData(selectedDay, selectedHour),
    [selectedDay, selectedHour]
  );

  return (
    <div className="w-full max-w-4xl p-4 mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bayesian Analysis Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <select 
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="p-2 border rounded"
            >
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(parseInt(e.target.value))}
              className="p-2 border rounded"
            >
              {hours.map(hour => (
                <option key={hour} value={hour}>
                  {hour.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysisResult.posteriorData}>
                <XAxis 
                  dataKey="conversionRate" 
                  tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value.toFixed(3),
                    name === 'adDensity' ? 'Ad Group' : 'PSA Group'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="adDensity"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Ad Group"
                />
                <Area
                  type="monotone"
                  dataKey="psaDensity"
                  stroke="#dc2626"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="PSA Group"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">Ad Group (95% CI)</h3>
              <p>
                {(analysisResult.statistics.adCredibleInterval[0] * 100).toFixed(1)}% - 
                {(analysisResult.statistics.adCredibleInterval[1] * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">PSA Group (95% CI)</h3>
              <p>
                {(analysisResult.statistics.psaCredibleInterval[0] * 100).toFixed(1)}% - 
                {(analysisResult.statistics.psaCredibleInterval[1] * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 border rounded">
            <h3 className="font-semibold mb-2">Probability Ad Better than PSA</h3>
            <p>{(analysisResult.statistics.probAdBetter * 100).toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BayesianDashboard;