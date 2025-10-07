import React, { useState, useEffect } from 'react';
import { Yield, SimulationPhase, Asset, City } from '../types';
import WeaponImpactArticle from './WeaponImpactArticle';

interface InfoPanelProps {
  selectedYield: Yield;
  phase: SimulationPhase;
  affectedAssets: Asset[];
  shockwaveRadius: number;
  selectedCity: City;
}

const CountUp: React.FC<{ end: number; duration: number; start: boolean }> = ({ end, duration, start }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) {
      setCount(0);
      return;
    }
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const currentCount = Math.min(Math.floor(end * (progress / duration)), end);
      setCount(currentCount);
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);
  
  return <span className="font-mono text-2xl">{count.toLocaleString()}</span>;
};

const InfoPanel: React.FC<InfoPanelProps> = ({
  selectedYield,
  phase,
  affectedAssets,
  shockwaveRadius,
  selectedCity,
}) => {
  const isSimulating = phase > SimulationPhase.Idle;
  const isCounting = phase === SimulationPhase.FireballAndShockwave;
  
  const phaseText = {
      [SimulationPhase.Idle]: "待命中...",
      [SimulationPhase.PreLaunch]: "系統準備中",
      [SimulationPhase.Warning]: "警告 - 即將衝擊 (T-10s)",
      [SimulationPhase.ImpactEve]: "衝擊前夕 (T-3s)",
      [SimulationPhase.Flash]: "零時 - 閃光 (T=0s)",
      [SimulationPhase.FireballAndShockwave]: "火球與衝擊波 (T+0.1s)",
      [SimulationPhase.Aftermath]: "蘑菇雲與火災 (T+1m)",
      [SimulationPhase.Fallout]: "放射性落塵擴散",
  };

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex-grow flex flex-col space-y-4">
      <h2 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">即時數據報告</h2>
      
      <div className="text-center bg-gray-800/50 p-2 rounded-md">
        <p className="text-sm text-gray-400">目前階段</p>
        <p className="text-lg font-bold text-yellow-400">{phaseText[phase]}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-900/50 p-3 rounded-lg text-center">
          <h3 className="text-sm text-red-300">預計死亡人數</h3>
          <CountUp end={selectedYield.casualties.fatalities} duration={4000} start={isCounting || phase > SimulationPhase.FireballAndShockwave} />
        </div>
        <div className="bg-orange-900/50 p-3 rounded-lg text-center">
          <h3 className="text-sm text-orange-300">預計受傷人數</h3>
           <CountUp end={selectedYield.casualties.injuries} duration={4000} start={isCounting || phase > SimulationPhase.FireballAndShockwave} />
        </div>
      </div>

      <div className="flex-grow flex flex-col min-h-0">
        <h3 className="text-md font-semibold text-gray-400 mb-2">
            {isSimulating ? "受災項目清單" : "武器影響層面分析"}
        </h3>
        <div className="bg-gray-800/50 p-2 rounded-md flex-grow overflow-y-auto">
            {isSimulating ? (
                <div>
                  <div className="text-gray-400 text-xs p-1 mb-1 border-b border-gray-700 font-mono">
                    <p>衝擊半徑: {(shockwaveRadius / 1000).toFixed(2)} km</p>
                    <p>評估損毀: {affectedAssets.length} / {selectedCity.assets.length} 個項目</p>
                  </div>
                  {phase >= SimulationPhase.FireballAndShockwave ? (
                    affectedAssets.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                            {affectedAssets.slice(-1000).reverse().map((asset) => (
                                <li key={asset.id} className="text-red-400 line-through animate-fade-in">
                                    {asset.name}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-500 text-sm mt-2">正在接收即時數據...</p>
                  ) : <p className="text-gray-500 text-sm mt-2">正在計算衝擊範圍...</p>
                  }
                </div>
            ) : <WeaponImpactArticle />
            }
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;