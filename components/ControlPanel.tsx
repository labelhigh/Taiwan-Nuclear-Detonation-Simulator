
import React from 'react';
import { City, Yield, SimulationPhase } from '../types';

interface ControlPanelProps {
  cities: City[];
  yields: Yield[];
  selectedCity: City;
  selectedYield: Yield;
  onCityChange: (cityName: string) => void;
  onYieldChange: (yieldKt: string) => void;
  onLaunch: () => void;
  onReset: () => void;
  phase: SimulationPhase;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  cities,
  yields,
  selectedCity,
  selectedYield,
  onCityChange,
  onYieldChange,
  onLaunch,
  onReset,
  phase,
}) => {
  const isSimulating = phase > SimulationPhase.Idle;

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-4">
      <h2 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">模擬參數設定</h2>
      
      <div>
        <label htmlFor="city-select" className="block text-sm font-medium text-gray-400 mb-1">目標城市</label>
        <select
          id="city-select"
          value={selectedCity.name}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={isSimulating}
          className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
        >
          {cities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="yield-select" className="block text-sm font-medium text-gray-400 mb-1">爆炸當量 (Yield)</label>
        <select
          id="yield-select"
          value={selectedYield.kt}
          onChange={(e) => onYieldChange(e.target.value)}
          disabled={isSimulating}
          className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
        >
          {yields.map(y => <option key={y.kt} value={y.kt}>{y.name}</option>)}
        </select>
      </div>
      
      <div className="flex space-x-2 pt-2">
        <button
          onClick={onLaunch}
          disabled={isSimulating}
          className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          啟動模擬
        </button>
        <button
          onClick={onReset}
          disabled={!isSimulating}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500"
        >
          重設
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
