import React, { useState, useEffect, useCallback } from 'react';
import { SimulationPhase, City, Yield, Point, Asset } from './types';
import { CITIES, YIELDS } from './constants';
import ControlPanel from './components/ControlPanel';
import InfoPanel from './components/InfoPanel';
import SimulationView from './components/SimulationView';

declare var L: any;

const App: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]);
  const [selectedYield, setSelectedYield] = useState<Yield>(YIELDS[1]);
  const [targetCoords, setTargetCoords] = useState<Point>(CITIES[0].coords);
  const [phase, setPhase] = useState<SimulationPhase>(SimulationPhase.Idle);
  const [shockwaveRadius, setShockwaveRadius] = useState(0); // in meters
  const [countdown, setCountdown] = useState(10);
  const [map, setMap] = useState<any | null>(null);
  const [affectedAssets, setAffectedAssets] = useState<Asset[]>([]);

  const handleCityChange = (cityName: string) => {
    const city = CITIES.find(c => c.name === cityName) || CITIES[0];
    setSelectedCity(city);
    setTargetCoords(city.coords);
  };

  const handleYieldChange = (yieldKt: string) => {
    const y = YIELDS.find(y => y.kt.toString() === yieldKt) || YIELDS[0];
    setSelectedYield(y);
  };

  const handleTargetSelect = useCallback((coords: Point) => {
    if (phase === SimulationPhase.Idle || phase === SimulationPhase.PreLaunch) {
      setTargetCoords(coords);
    }
  }, [phase]);

  const resetSimulation = () => {
    setPhase(SimulationPhase.Idle);
    setShockwaveRadius(0);
    setAffectedAssets([]);
  };
  
  const launchSimulation = () => {
    if (phase === SimulationPhase.Idle || phase === SimulationPhase.PreLaunch) {
      setCountdown(10);
      setPhase(SimulationPhase.Warning);
      setShockwaveRadius(0);
      setAffectedAssets([]);
    }
  };

  useEffect(() => {
    let timer: number;
    switch (phase) {
      case SimulationPhase.Warning:
        timer = window.setTimeout(() => setPhase(SimulationPhase.ImpactEve), 10000);
        break;
      case SimulationPhase.ImpactEve:
        timer = window.setTimeout(() => setPhase(SimulationPhase.Flash), 3000);
        break;
      case SimulationPhase.Flash:
        timer = window.setTimeout(() => setPhase(SimulationPhase.FireballAndShockwave), 1500);
        break;
      case SimulationPhase.FireballAndShockwave:
        timer = window.setTimeout(() => setPhase(SimulationPhase.Aftermath), 5000); // Shockwave duration
        break;
      case SimulationPhase.Aftermath:
        timer = window.setTimeout(() => setPhase(SimulationPhase.Fallout), 4000); // Mushroom cloud rises
        break;
    }
    return () => clearTimeout(timer);
  }, [phase]);
  
  useEffect(() => {
    if (phase === SimulationPhase.Warning) {
      const countdownInterval = window.setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [phase]);

  useEffect(() => {
    let animationFrameId: number;
    if (phase === SimulationPhase.FireballAndShockwave) {
      const animationDuration = 5000;
      let startTime = 0;
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / animationDuration;
        if (progress <= 1) {
          setShockwaveRadius(progress * selectedYield.shockwaveRadius);
          animationFrameId = requestAnimationFrame(animate);
        } else {
          setShockwaveRadius(selectedYield.shockwaveRadius);
        }
      };
      animationFrameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [phase, selectedYield.shockwaveRadius]);

  // Effect to calculate affected assets based on shockwave radius
  useEffect(() => {
    if (phase < SimulationPhase.FireballAndShockwave || !targetCoords) return;

    try {
      const targetLatLng = L.latLng(targetCoords.lat, targetCoords.lng);
      
      const currentlyAffected = selectedCity.assets
        .filter(asset => {
            const assetLatLng = L.latLng(asset.coords.lat, asset.coords.lng);
            const distance = targetLatLng.distanceTo(assetLatLng);
            return distance < shockwaveRadius;
        })
        .sort((a, b) => {
            const aLatLng = L.latLng(a.coords.lat, a.coords.lng);
            const bLatLng = L.latLng(b.coords.lat, b.coords.lng);
            return targetLatLng.distanceTo(aLatLng) - targetLatLng.distanceTo(bLatLng);
        });

      setAffectedAssets(currentlyAffected);
    } catch(e) {
      console.warn("Could not calculate affected assets, map state might be stale.", e);
    }
    
  }, [shockwaveRadius, phase, selectedCity.assets, targetCoords]);

  return (
    <div className="w-screen h-screen bg-black text-gray-200 flex flex-col md:flex-row font-sans overflow-hidden relative">
      <div className="w-full md:w-1/4 h-1/3 md:h-full bg-[#0a0a0a] border-r border-gray-800 p-4 flex flex-col space-y-4 overflow-y-auto z-10">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-red-500">台灣核爆模擬器</h1>
          <p className="text-sm text-gray-400">身臨其境地見證不可承受之重</p>
        </header>
        <ControlPanel
          cities={CITIES}
          yields={YIELDS}
          selectedCity={selectedCity}
          selectedYield={selectedYield}
          onCityChange={handleCityChange}
          onYieldChange={handleYieldChange}
          onLaunch={launchSimulation}
          onReset={resetSimulation}
          phase={phase}
        />
        <InfoPanel
          selectedYield={selectedYield}
          phase={phase}
          affectedAssets={affectedAssets}
          shockwaveRadius={shockwaveRadius}
          selectedCity={selectedCity}
        />
      </div>
      <main className="w-full md:w-3/4 h-2/3 md:h-full relative bg-gray-900">
        <SimulationView
          selectedCity={selectedCity}
          targetCoords={targetCoords}
          onTargetSelect={handleTargetSelect}
          phase={phase}
          selectedYield={selectedYield}
          shockwaveRadius={shockwaveRadius}
          setMap={setMap}
        />
      </main>
      
      {phase === SimulationPhase.Warning && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-center p-4">
            <h2 className="text-6xl md:text-8xl font-bold text-red-500 animate-pulse">緊急警報</h2>
            <p className="text-xl md:text-3xl text-yellow-300 mt-4">偵測到彈道導彈 | 即將衝擊</p>
            <p className="text-8xl md:text-9xl font-mono text-white mt-8">{countdown}</p>
        </div>
      )}
    </div>
  );
};

export default App;