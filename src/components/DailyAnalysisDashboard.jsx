import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { jStat } from 'jstat';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SAMPLE_SIZE = 10000;

function DailyDashboard() {
  const [data, setData] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Papa.parse(process.env.PUBLIC_URL + '/marketing_data_sample.csv', {
      download: true,
      header: true,
      dynamicTyping: false,
      error: (error) => {
        console.error('Error loading data:', error);
        setLoading(false);
      },
      complete: (results) => {
        const parsedData = results.data.map((row) => {
          const convertedValue = (row['converted'] || '').toUpperCase() === 'TRUE' ? 1 : 0;
          return {
            ...row,
            converted: convertedValue,
          };
        });
        setData(parsedData);
        setLoading(false);
      },
    });
  }, []);

  const analysisResult = useMemo(() => {
    if (data.length === 0) return null;

    // Filter data only by the selected day
    const filtered = data.filter(d => d['most ads day'] === selectedDay);

    const adGroup = filtered.filter(d => d['test group'] === 'ad');
    const psaGroup = filtered.filter(d => d['test group'] === 'psa');

    const adSuccesses = adGroup.reduce((acc, row) => acc + row.converted, 0);
    const adTrials = adGroup.length;
    const psaSuccesses = psaGroup.reduce((acc, row) => acc + row.converted, 0);
    const psaTrials = psaGroup.length;

    if (adTrials === 0 || psaTrials === 0) {
      return null;
    }

    // Calculate summary statistics
    const summary = {
      adTotal: adTrials,
      adConversions: adSuccesses,
      adRate: ((adSuccesses / adTrials) * 100).toFixed(2),
      psaTotal: psaTrials,
      psaConversions: psaSuccesses,
      psaRate: ((psaSuccesses / psaTrials) * 100).toFixed(2)
    };

    // Beta(1,1) priors
    const alpha_prior = 1;
    const beta_prior = 1;

    const ad_alpha_post = alpha_prior + adSuccesses;
    const ad_beta_post = beta_prior + (adTrials - adSuccesses);

    const psa_alpha_post = alpha_prior + psaSuccesses;
    const psa_beta_post = beta_prior + (psaTrials - psaSuccesses);

    const adPosterior = Array.from({length: SAMPLE_SIZE}, () => jStat.beta.sample(ad_alpha_post, ad_beta_post));
    const psaPosterior = Array.from({length: SAMPLE_SIZE}, () => jStat.beta.sample(psa_alpha_post, psa_beta_post));

    const quantile = (arr, q) => {
      const sorted = arr.slice().sort((a,b) => a-b);
      const pos = (sorted.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (sorted[base+1] !== undefined) {
        return sorted[base] + rest*(sorted[base+1]-sorted[base]);
      } else {
        return sorted[base];
      }
    };

    const adCredibleInterval = [quantile(adPosterior, 0.025), quantile(adPosterior, 0.975)];
    const psaCredibleInterval = [quantile(psaPosterior, 0.025), quantile(psaPosterior, 0.975)];

    let countAdBetter = 0;
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      if (adPosterior[i] > psaPosterior[i]) countAdBetter++;
    }
    const probAdBetter = countAdBetter / SAMPLE_SIZE;

    const bins = 50;
    const createHistogram = (samples) => {
      const sorted = samples.slice().sort((a,b)=>a-b);
      const min = sorted[0];
      const max = sorted[sorted.length-1];
      const binWidth = (max - min) / bins;
      const hist = [];
      for (let i = 0; i < bins; i++) {
        const binStart = min + i*binWidth;
        const binEnd = binStart + binWidth;
        const count = sorted.filter(x => x >= binStart && x < binEnd).length;
        hist.push({ 
          conversionRate: (binStart+binEnd)/2, 
          density: count / (samples.length * binWidth) 
        });
      }
      return hist;
    };

    const adHist = createHistogram(adPosterior);
    const psaHist = createHistogram(psaPosterior);

    // Align histograms bin-to-bin
    const combinedData = adHist.map((bin, idx) => ({
      conversionRate: bin.conversionRate,
      adDensity: bin.density,
      psaDensity: psaHist[idx].density
    }));

    return {
      posteriorData: combinedData,
      statistics: {
        adCredibleInterval,
        psaCredibleInterval,
        probAdBetter
      },
      summary
    };

  }, [data, selectedDay]);

  if (loading) {
    return <div>Loading data...</div>;
  }

  if (!analysisResult) {
    return <div>No data available for the selected day.</div>;
  }

  return (
    <div className="w-full max-w-4xl p-4 mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bayesian Analysis Dashboard (Daily)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <select 
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="p-2 border rounded"
            >
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">Ad Group Summary</h3>
              <p>Total Users: {analysisResult.summary.adTotal}</p>
              <p>Conversions: {analysisResult.summary.adConversions}</p>
              <p>Raw Rate: {analysisResult.summary.adRate}%</p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">PSA Group Summary</h3>
              <p>Total Users: {analysisResult.summary.psaTotal}</p>
              <p>Conversions: {analysisResult.summary.psaConversions}</p>
              <p>Raw Rate: {analysisResult.summary.psaRate}%</p>
            </div>
          </div>

          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysisResult.posteriorData}>
                <XAxis 
                  dataKey="conversionRate" 
                  tickFormatter={(value) => `${(value * 100).toFixed(2)}%`}
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value.toFixed(4),
                    name === 'adDensity' ? 'Ad Group Density' : 'PSA Group Density'
                  ]}
                  labelFormatter={(label) => `Conversion Rate: ${(label * 100).toFixed(2)}%`}
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
                {(analysisResult.statistics.adCredibleInterval[0] * 100).toFixed(2)}% - 
                {(analysisResult.statistics.adCredibleInterval[1] * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">PSA Group (95% CI)</h3>
              <p>
                {(analysisResult.statistics.psaCredibleInterval[0] * 100).toFixed(2)}% - 
                {(analysisResult.statistics.psaCredibleInterval[1] * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 border rounded">
            <h3 className="font-semibold mb-2">Probability Ad Better than PSA</h3>
            <p>{(analysisResult.statistics.probAdBetter * 100).toFixed(2)}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DailyDashboard;
