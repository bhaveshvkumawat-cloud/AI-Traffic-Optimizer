export const initialQLearningData = [
  { episode: 10, reward: -88.5, avgWait: 39.2, queueLength: 22 },
  { episode: 30, reward: -64.2, avgWait: 31.8, queueLength: 17 },
  { episode: 50, reward: -42.1, avgWait: 23.4, queueLength: 12 },
  { episode: 70, reward: -26.7, avgWait: 17.1, queueLength: 8 },
  { episode: 90, reward: -15.3, avgWait: 11.5, queueLength: 5 },
  { episode: 110, reward: -8.9, avgWait: 7.8, queueLength: 3 },
  { episode: 130, reward: -4.8, avgWait: 6.2, queueLength: 2 },
  { episode: 150, reward: -2.9, avgWait: 5.1, queueLength: 1 }
];

export const modelComparisonData = [
  { metric: 'Avg Wait (s)', FixedTimer: 34.8, Actuated: 25.2, QLearning: 10.8, DQN: 7.4 },
  { metric: 'Max Queue', FixedTimer: 21, Actuated: 15, QLearning: 7, DQN: 3 },
  { metric: 'Fuel Waste (L)', FixedTimer: 48.6, Actuated: 38.1, QLearning: 17.2, DQN: 12.8 },
  { metric: 'Throughput', FixedTimer: 41, Actuated: 59, QLearning: 88, DQN: 97 }
];

export const vehiclePieData = [
  { name: 'Sedans / SUVs', value: 58, color: '#06b6d4' },
  { name: 'Buses', value: 16, color: '#f59e0b' },
  { name: 'Trucks', value: 12, color: '#a855f7' },
  { name: 'Bikes', value: 14, color: '#10b981' }
];

