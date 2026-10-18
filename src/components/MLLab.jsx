import React from 'react';
import { 
  Cpu, Sparkles, Camera, Activity, ShieldAlert, Award, BarChart3, 
  Car, Bus, Truck, Bike, Siren, Zap, Radio, MapPin, Grid, Flame,
  CheckCircle2, Globe, Compass, Shield, Gauge, Sliders, Play, Pause,
  RotateCcw, ArrowRight, Eye, RefreshCw, AlertTriangle, ChevronRight,
  TrendingUp, Crosshair, Layers, Volume2, Info, FileText, Check
} from 'lucide-react';
import { 
  LineChart, Line, BarChart as ReBarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, CartesianGrid, Legend, ScatterChart, Scatter, Cell, PieChart, Pie
} from 'recharts';

import { modelComparisonData } from '../data/chartData';

export default function MLLab(props) {
  const { alpha, setAlpha, gamma, setGamma, epsilon, setEpsilon, rewardHistory, trainModel, trainingBusy, backendStatus } = props;
  return (
<div className="space-y-6">
            
            {/* Q-Learning Parameters Control */}
            <div className="bg-[#060b19]/90 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" /> Q-Learning Hyperparameter Tuning
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Learning Rate (&alpha; Alpha):</span>
                    <span className="text-cyan-400 font-mono font-bold">{alpha}</span>
                  </div>
                  <input type="range" min="0.01" max="0.5" step="0.01" value={alpha} onChange={e => setAlpha(parseFloat(e.target.value))} className="w-full accent-cyan-500 bg-slate-950 h-2 rounded cursor-pointer" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Discount Factor (&gamma; Gamma):</span>
                    <span className="text-purple-400 font-mono font-bold">{gamma}</span>
                  </div>
                  <input type="range" min="0.5" max="0.99" step="0.01" value={gamma} onChange={e => setGamma(parseFloat(e.target.value))} className="w-full accent-purple-500 bg-slate-950 h-2 rounded cursor-pointer" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Exploration Rate (&epsilon; Epsilon):</span>
                    <span className="text-emerald-400 font-mono font-bold">{epsilon}</span>
                  </div>
                  <input type="range" min="0.01" max="0.5" step="0.01" value={epsilon} onChange={e => setEpsilon(parseFloat(e.target.value))} className="w-full accent-emerald-500 bg-slate-950 h-2 rounded cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={trainModel} disabled={trainingBusy} className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm">{trainingBusy ? 'Training...' : 'Train Q-Learning Backend'}</button>
              <span className="text-xs text-slate-400">API: {backendStatus} · Synthetic training environment</span>
            </div>
            {/* Graphs Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Reward Convergence Chart */}
              <div className="bg-[#060b19]/90 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase">Q-Learning Training Reward Curve</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rewardHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="episode" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155' }} />
                      <Line type="monotone" dataKey="reward" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Model Comparison Bar Chart */}
              <div className="bg-[#060b19]/90 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase">Algorithm Performance Benchmark</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={modelComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="metric" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155' }} />
                      <Legend />
                      <Bar dataKey="FixedTimer" fill="#64748b" name="Fixed Timer" />
                      <Bar dataKey="QLearning" fill="#06b6d4" name="Q-Learning AI" />
                      <Bar dataKey="DQN" fill="#10b981" name="Deep Q-Network" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
  );
}
