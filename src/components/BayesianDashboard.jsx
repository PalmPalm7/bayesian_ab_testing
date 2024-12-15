import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const BayesianDashboard = () => {
  const [data, setData] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedHour, setSelectedHour] = useState(10);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    fetch('/marketing_data_sample.csv')
      .then(response => response.text())
      .then(csvData => {
        const results = Papa.parse(csvData, { 
          header: true, 
          dynamicTyping: true,
          transform: (value, field) => {
            if (field === 'converted') return value.toUpperCase() === 'TRUE';
            return value;
          }
        });
        setData(results.data);
      })
      .catch(error => console.error('Error loading data:', error));
  }, []);

  const bayesianAnalysis = (filteredData) => {
    if (!filteredData || filteredData.length === 0) return null;

    // Separate into groups
    const adData = filteredData.filter(row => row['test group'] === 'ad');
    const psaData = filteredData.filter(row => row['test group'] === 'psa');

    // Calculate successes and trials
    const adSuccesses = adData.filter(row => row.converted).length;
    const adTrials = adData.length;
    const psaSuccesses = psaData.filter(row => row.converted).length;
    const psaTrials = psaData.length;

    // Beta distribution parameters (with prior alpha=1, beta=1)
    const adAlpha = 1 + adSuccesses;
    const adBeta = 1 + (adTrials - adSuccesses);
    const psaAlpha = 1 + psaSuccesses;
    const psaBeta = 1 + (psaTrials - psaSuccesses);

    // Generate points for the distribution curves
    const points = Array.from({ length: 100 }, (_, i) => {
      const x = i / 100;
      // Beta distribution approximation
      const adDensity = Math.pow(x, adAlpha - 1) * Math.pow(1 - x, adBeta - 1);
      const psaDensity = Math.pow(x, psaAlpha - 1) * Math.pow(1 - x, psaBeta - 1);
      
      return {
        conversionRate: x,
        adDensity: adDensity / Math.max(adDensity, psaDensity) * 0.8,
        psaDensity: psaDensity / Math.max(adDensity, psaDensity) * 0.8
      };
    });

    // Calculate means for credible intervals
    const adMean = adAlpha / (adAlpha + adBeta);
    const psaMean = psaAlpha / (psaAlpha + psaBeta);

    // Simple approximation of credible intervals
    const adCI = [
      Math.max(0, adMean - 1.96 * Math.sqrt(adMean * (1 - adMean) / adTrials)),
      Math.min(1, adMean + 1.96 * Math.sqrt(adMean * (1 - adMean) / adTrials))
    ];
    
    const psaCI = [
      Math.max(0, psaMean - 1.96 * Math.sqrt(psaMean * (1 - psaMean) / psaTrials)),
      Math.min(1, psaMean + 1.96 * Math.sqrt(psaMean * (1 - psaMean) / psaTrials))
    ];

    return {
      posteriorData: points,
      statistics: {
        adCredibleInterval: adCI,
        psaCredibleInterval: psaCI,
        probAdBetter: adMean > psaMean ? 
          (1 - Math.exp(-Math.abs(adMean - psaMean) * 10)) : 
          Math.exp(-Math.abs(adMean - psaMean) * 10),
        adTrials,
        psaTrials,
        adSuccesses,
        psaSuccesses
      }
    };
  };

  const analysisResult = React.useMemo(() => {
    if (data.length === 0) return null;
    
    const filteredData = data.filter(
      row => row['most ads day'] === selectedDay && 
            row['most ads hour'] === selectedHour
    );
    
    return bayesianAnalysis(filteredData);
  }, [data, selectedDay, selectedHour]);

  if (!analysisResult) return <div>Loading...</div>;

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
              <p className="text-sm text-gray-600 mt-1">
                ({analysisResult.statistics.adSuccesses} / {analysisResult.statistics.adTrials} conversions)
              </p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">PSA Group (95% CI)</h3>
              <p>
                {(analysisResult.statistics.psaCredibleInterval[0] * 100).toFixed(1)}% - 
                {(analysisResult.statistics.psaCredibleInterval[1] * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                ({analysisResult.statistics.psaSuccesses} / {analysisResult.statistics.psaTrials} conversions)
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