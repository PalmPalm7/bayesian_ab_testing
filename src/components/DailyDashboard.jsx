import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import Papa from 'papaparse';

const DailyDashboard = () => {
  const [data, setData] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Monday');

  useEffect(() => {
    // Change this fetch call
    fetch(`${process.env.PUBLIC_URL}/marketing_data_sample.csv`)
    // To this:
    fetch(`${process.env.PUBLIC_URL}/bayesian_ab_testing/marketing_data_sample.csv`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
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
      .catch(error => {
        console.error('Error loading data:', error);
        setData([]); // Set empty data on error
      });
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

    const adMean = adAlpha / (adAlpha + adBeta);
    const psaMean = psaAlpha / (psaAlpha + psaBeta);

    // Calculate average ads per user
    const adAvgAds = adData.reduce((sum, row) => sum + row['total ads'], 0) / adTrials;
    const psaAvgAds = psaData.reduce((sum, row) => sum + row['total ads'], 0) / psaTrials;

    return {
      posteriorData: points,
      statistics: {
        adMean,
        psaMean,
        adTrials,
        psaTrials,
        adSuccesses,
        psaSuccesses,
        adAvgAds,
        psaAvgAds,
        probAdBetter: adMean > psaMean ? 
          (1 - Math.exp(-Math.abs(adMean - psaMean) * 10)) : 
          Math.exp(-Math.abs(adMean - psaMean) * 10),
      }
    };
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const dailyStats = React.useMemo(() => {
    if (data.length === 0) return [];
    
    return days.map(day => {
      const filteredData = data.filter(row => row['most ads day'] === day);
      const analysis = bayesianAnalysis(filteredData);
      return {
        day,
        adRate: analysis?.statistics.adMean * 100 || 0,
        psaRate: analysis?.statistics.psaMean * 100 || 0,
        adSampleSize: analysis?.statistics.adTrials || 0,
        psaSampleSize: analysis?.statistics.psaTrials || 0,
        adAvgAds: analysis?.statistics.adAvgAds || 0,
        psaAvgAds: analysis?.statistics.psaAvgAds || 0,
      };
    });
  }, [data]);

  if (data.length === 0) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-4xl p-4 mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Conversion Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                <Tooltip 
                  formatter={(value, name) => [`${value.toFixed(2)}%`, name === 'adRate' ? 'Ad Group' : 'PSA Group']}
                />
                <Legend />
                <Bar name="Ad Group" dataKey="adRate" fill="#3b82f6" />
                <Bar name="PSA Group" dataKey="psaRate" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value.toFixed(1),
                    name === 'adAvgAds' ? 'Ad Group Avg Ads' : 'PSA Group Avg Ads'
                  ]}
                />
                <Legend />
                <Bar name="Ad Group Avg Ads" dataKey="adAvgAds" fill="#818cf8" />
                <Bar name="PSA Group Avg Ads" dataKey="psaAvgAds" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">Daily Sample Sizes</h3>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Day</th>
                    <th className="text-right">Ad Group</th>
                    <th className="text-right">PSA Group</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyStats.map(stat => (
                    <tr key={stat.day}>
                      <td>{stat.day}</td>
                      <td className="text-right">{stat.adSampleSize}</td>
                      <td className="text-right">{stat.psaSampleSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">Key Insights</h3>
              <ul className="space-y-2">
                <li>Best performing day: {
                  dailyStats.reduce((max, stat) => 
                    stat.adRate > max.adRate ? stat : max
                  ).day
                }</li>
                <li>Highest ad exposure: {
                  dailyStats.reduce((max, stat) => 
                    stat.adAvgAds > max.adAvgAds ? stat : max
                  ).day
                }</li>
                <li>Average conversion rate: {
                  (dailyStats.reduce((sum, stat) => sum + stat.adRate, 0) / 7).toFixed(2)
                }%</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyDashboard;