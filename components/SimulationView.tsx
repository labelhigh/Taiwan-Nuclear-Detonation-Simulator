import React, { useState, useEffect, useRef } from 'react';
import { Point, SimulationPhase, Yield, City } from '../types';

declare var L: any;

interface SimulationViewProps {
  selectedCity: City;
  targetCoords: Point;
  onTargetSelect: (coords: Point) => void;
  phase: SimulationPhase;
  selectedYield: Yield;
  shockwaveRadius: number;
  setMap: (map: any) => void;
}

const useGeigerCounter = (isPlaying: boolean, hoverActive: boolean) => {
    const geigerAudioRef = useRef<HTMLAudioElement | null>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!geigerAudioRef.current) {
            geigerAudioRef.current = new Audio('https://cdn.pixabay.com/audio/2024/03/31/audio_9b31b30897.mp3');
            geigerAudioRef.current.loop = true;
            geigerAudioRef.current.volume = 0.4;
        }
        const audio = geigerAudioRef.current;
        
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (isPlaying) {
            audio.playbackRate = hoverActive ? 2.5 : 1.0;
            if (audio.paused) {
                audio.play().catch(e => console.error("Geiger sound playback failed:", e));
            }
            timeoutRef.current = window.setTimeout(() => {
                if (audio && !audio.paused) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }, 20000); // Stop audio after 20 seconds
        } else {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        }
        
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, [isPlaying, hoverActive]);
};

const SimulationView: React.FC<SimulationViewProps> = ({
  selectedCity,
  targetCoords,
  onTargetSelect,
  phase,
  selectedYield,
  shockwaveRadius,
  setMap
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any | null>(null);
  const [targetPixels, setTargetPixels] = useState<{x: number, y: number} | null>(null);
  const [isFalloutHovered, setIsFalloutHovered] = useState(false);
  const explosionAudioRef = useRef<HTMLAudioElement | null>(null);
  const [shockwaveRadiusInPixels, setShockwaveRadiusInPixels] = useState(0);
  const [firePositions, setFirePositions] = useState<{x: number, y: number}[]>([]);

  const [fireballRadiusPixels, setFireballRadiusPixels] = useState(0);
  const [shockwave5psiRadiusPixels, setShockwave5psiRadiusPixels] = useState(0);
  const [thermalRadiusPixels, setThermalRadiusPixels] = useState(0);

  // Map Initialization Effect (runs once)
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const mapInstance = L.map(mapContainerRef.current, {
      center: selectedCity.coords,
      zoom: 10,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      attributionControl: false,
    });
    mapRef.current = mapInstance;
    setMap(mapInstance);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
    
    return () => {
      mapInstance.remove();
      mapRef.current = null;
    };
  }, [setMap, selectedCity.coords]);

  // Effect to calculate shockwave radius in pixels for animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !targetCoords) return;

    if (shockwaveRadius === 0) {
      setShockwaveRadiusInPixels(0);
      return;
    }

    try {
      const bounds = map.getBounds();
      const eastPointLatLng = L.latLng(targetCoords.lat, bounds.getEast());
      const centerLatLng = L.latLng(targetCoords.lat, targetCoords.lng);

      const distanceInMeters = centerLatLng.distanceTo(eastPointLatLng);
      const eastPointPixels = map.latLngToContainerPoint(eastPointLatLng);
      const centerPointPixels = map.latLngToContainerPoint(centerLatLng);
      const distanceInPixels = Math.abs(eastPointPixels.x - centerPointPixels.x);

      if (distanceInPixels > 0) {
        const metersPerPixel = distanceInMeters / distanceInPixels;
        const radiusInPixels = shockwaveRadius / metersPerPixel;
        setShockwaveRadiusInPixels(radiusInPixels);
      }
    } catch (e) {
      console.error("Error calculating shockwave pixel radius:", e);
    }
  }, [shockwaveRadius, targetCoords]);

  // Effect to calculate static damage ring radii in pixels
  useEffect(() => {
    const map = mapRef.current;
    if (phase < SimulationPhase.FireballAndShockwave || !map || !targetCoords) {
        setFireballRadiusPixels(0);
        setShockwave5psiRadiusPixels(0);
        setThermalRadiusPixels(0);
        return;
    }

    const calculateRadiusInPixels = (radiusInMeters: number): number => {
        try {
            const centerLatLng = L.latLng(targetCoords.lat, targetCoords.lng);
            const bounds = map.getBounds();
            const eastPointLatLng = L.latLng(targetCoords.lat, bounds.getEast());

            const distanceInMeters = centerLatLng.distanceTo(eastPointLatLng);
            const eastPointPixels = map.latLngToContainerPoint(eastPointLatLng);
            const centerPointPixels = map.latLngToContainerPoint(centerLatLng);
            const distanceInPixels = Math.abs(eastPointPixels.x - centerPointPixels.x);

            if (distanceInPixels > 0) {
                const metersPerPixel = distanceInMeters / distanceInPixels;
                return radiusInMeters / metersPerPixel;
            }
            return 0;
        } catch (e) {
            console.error("Error calculating static pixel radius:", e);
            return 0;
        }
    };

    setFireballRadiusPixels(calculateRadiusInPixels(selectedYield.fireballRadius));
    setShockwave5psiRadiusPixels(calculateRadiusInPixels(selectedYield.shockwaveRadius));
    setThermalRadiusPixels(calculateRadiusInPixels(selectedYield.thermalRadius));

  }, [phase, targetCoords, selectedYield]);
  
  // Effect to generate and clear firestorm positions
  useEffect(() => {
    // Generate fires only when the Aftermath phase begins and conditions are met.
    if (phase === SimulationPhase.Aftermath && targetPixels && thermalRadiusPixels > 0 && firePositions.length === 0) {
      const newFires = [];
      const numFires = 35;
      for (let i = 0; i < numFires; i++) {
        const angle = Math.random() * 2 * Math.PI;
        // Use Math.sqrt for a more uniform distribution within the circle
        const radius = Math.sqrt(Math.random()) * thermalRadiusPixels;
        const x = targetPixels.x + radius * Math.cos(angle);
        const y = targetPixels.y + radius * Math.sin(angle);
        newFires.push({ x, y });
      }
      setFirePositions(newFires);
    } 
    // Clear fires when we are no longer in the Aftermath phase.
    else if (phase !== SimulationPhase.Aftermath && firePositions.length > 0) {
      setFirePositions([]);
    }
  }, [phase, targetPixels, thermalRadiusPixels, firePositions.length]);


  // City Change Effect (flyTo)
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo(selectedCity.coords, 10);
    }
  }, [selectedCity]);

  // Target Update & Map Movement Effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !targetCoords) return;

    const updatePixels = () => {
        try {
            const point = map.latLngToContainerPoint(targetCoords);
            if(point) {
                setTargetPixels(point);
            }
        } catch(e) {
            // Map might be removed during a re-render cycle
        }
    };

    map.on('move', updatePixels);
    map.on('zoom', updatePixels);
    updatePixels(); // Initial calculation

    return () => {
      map.off('move', updatePixels);
      map.off('zoom', updatePixels);
    };
  }, [targetCoords]);

  // Map Click Handler Effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: any) => {
      if (phase === SimulationPhase.Idle || phase === SimulationPhase.PreLaunch) {
        onTargetSelect(e.latlng);
      }
    };
    
    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [phase, onTargetSelect]);

  // Audio Playback Effect
  useEffect(() => {
    const audio = explosionAudioRef.current ?? new Audio('https://cdn.pixabay.com/audio/2025/04/12/audio_1071dfa756.mp3');
    if (!explosionAudioRef.current) explosionAudioRef.current = audio;

    if (phase === SimulationPhase.Warning) {
      audio.currentTime = 0;
      audio.play().catch(e => console.error("Audio playback failed:", e));
    } else if (phase === SimulationPhase.Idle) {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }, [phase]);
  
  useGeigerCounter(phase === SimulationPhase.Fallout, isFalloutHovered);

  const mapStyle: React.CSSProperties = {
    filter: phase >= SimulationPhase.FireballAndShockwave
      ? `grayscale(80%) brightness(60%) contrast(1.2) sepia(20%)`
      : 'grayscale(30%) brightness(80%)',
    transition: 'filter 3s ease-in-out',
  };
  
  const shockwaveClipPath = targetPixels ? `circle(${shockwaveRadiusInPixels}px at ${targetPixels.x}px ${targetPixels.y}px)` : 'none';
  const shockwaveMapStyle: React.CSSProperties = {
    clipPath: shockwaveClipPath,
    WebkitClipPath: shockwaveClipPath,
  };
  
  const falloutStyle: React.CSSProperties = {
    left: targetPixels?.x,
    top: targetPixels?.y,
    width: `${selectedYield.falloutDimensions.width}px`,
    height: `${selectedYield.falloutDimensions.height}px`,
    transform: `translateX(-50%)`,
  };

  return (
    <div className="w-full h-full cursor-crosshair relative overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" style={mapStyle} />

        {phase >= SimulationPhase.FireballAndShockwave && (
            <div 
              className="absolute inset-0 bg-black/40"
              style={{...shockwaveMapStyle, backdropFilter: 'grayscale(100%) brightness(40%) sepia(50%) contrast(1.5)', WebkitBackdropFilter: 'grayscale(100%) brightness(40%) sepia(50%) contrast(1.5)'}} 
            />
        )}

      {phase <= SimulationPhase.PreLaunch && (
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fog.png')] opacity-20 animate-[pulse_20s_ease-in-out_infinite]"></div>
      )}
      
      {targetPixels && (
        <>
          {(phase === SimulationPhase.Idle || phase === SimulationPhase.PreLaunch) && (
            <div 
              className="absolute w-12 h-12 border-2 border-red-500 rounded-full flex items-center justify-center animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
              style={{ left: targetPixels.x, top: targetPixels.y, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              <div className="absolute w-16 h-px bg-red-500/50"></div>
              <div className="absolute h-16 w-px bg-red-500/50"></div>
              <div className="absolute w-12 h-12 border border-red-500 rounded-full animate-[spin_4s_linear_infinite]"></div>
            </div>
          )}

          {phase === SimulationPhase.ImpactEve && (
            <div 
              className="absolute bg-gradient-to-l from-red-500 to-transparent w-1/2 h-0.5"
              style={{ 
                left: targetPixels.x, 
                top: targetPixels.y, 
                animation: 'missile-strike 3s ease-in forwards',
                transformOrigin: 'right center' 
              }}
            >
              <style>{`
                @keyframes missile-strike {
                  0% { transform: translate(100vw, -100vh) scaleX(2); opacity: 0; }
                  50% { opacity: 1; }
                  100% { transform: translate(0, 0) scaleX(1); opacity: 1; }
                }
              `}</style>
            </div>
          )}

          {phase >= SimulationPhase.FireballAndShockwave && (
            <>
              <img
                src="https://media.tenor.com/wMHJk-5S334AAAAM/explosion.gif"
                alt="核爆炸動畫"
                className="absolute pointer-events-none"
                style={{
                  left: targetPixels.x,
                  top: targetPixels.y,
                  width: 200,
                  height: 200,
                  transform: 'translate(-50%, -50%)',
                  animation: 'explosion-anim 5s ease-out forwards',
                  mixBlendMode: 'screen',
                }}
              />
              <style>{`
                @keyframes explosion-anim {
                  0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
                  10% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                  80% { opacity: 1; }
                  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
                }
              `}</style>
              <div
                className="absolute border-2 border-white/50 rounded-full"
                style={{
                  left: targetPixels.x,
                  top: targetPixels.y,
                  width: shockwaveRadiusInPixels * 2,
                  height: shockwaveRadiusInPixels * 2,
                  transform: 'translate(-50%, -50%)',
                  opacity: phase === SimulationPhase.FireballAndShockwave ? 1 : 0,
                  transition: 'opacity 0.5s linear 4.5s',
                }}
              ></div>
            </>
          )}

          {phase >= SimulationPhase.Aftermath && (
            <>
                <div className="absolute" style={{left: targetPixels.x, top: targetPixels.y, transform: 'translate(-50%, -100%) scale(0)', animation: 'mushroom-rise 10s forwards ease-in-out' }}>
                    <svg width="150" height="150" viewBox="0 0 100 100">
                        <path d="M40 95 C 40 85, 30 80, 20 80 C 10 80, 0 70, 0 60 C 0 40, 20 20, 50 20 C 80 20, 100 40, 100 60 C 100 70, 90 80, 80 80 C 70 80, 60 85, 60 95 Z" fill="url(#grad)" />
                        <defs>
                            <radialGradient id="grad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" style={{stopColor: '#FFF', stopOpacity: 0.8}} />
                                <stop offset="100%" style={{stopColor: '#CCC', stopOpacity: 0.5}} />
                            </radialGradient>
                        </defs>
                    </svg>
                    <style>{`
                    @keyframes mushroom-rise {
                    0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translate(-50%, -150%) scale(1); opacity: 1; }
                    }
                `}</style>
                </div>

                {/* Firestorm Effect */}
                {firePositions.map((pos, index) => (
                  <img
                    key={index}
                    src="https://i.pinimg.com/originals/d5/24/86/d52486969a2e2e1440a04469561b4107.gif"
                    alt="Widespread fire"
                    className="absolute pointer-events-none"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: 60,
                      height: 60,
                      transform: 'translate(-50%, -50%)',
                      mixBlendMode: 'screen',
                      opacity: 0,
                      animation: `fire-fade-in 0.5s ease-out ${index * 0.05}s forwards`,
                    }}
                  />
                ))}
                {firePositions.length > 0 && (
                  <style>{`
                    @keyframes fire-fade-in {
                      to { opacity: 0.9; }
                    }
                  `}</style>
                )}

                {/* Fireball Ring */}
                <div
                    className="absolute border-2 border-yellow-300 border-dashed rounded-full pointer-events-none"
                    style={{
                        left: targetPixels.x, top: targetPixels.y,
                        width: fireballRadiusPixels * 2, height: fireballRadiusPixels * 2,
                        transform: 'translate(-50%, -50%)', opacity: 0.8
                    }}
                />
                {fireballRadiusPixels > 20 && (
                    <div
                        className="absolute text-yellow-300 text-xs bg-black/60 px-1 py-0.5 rounded pointer-events-none"
                        style={{
                        left: targetPixels.x,
                        top: targetPixels.y - fireballRadiusPixels,
                        transform: 'translate(-50%, -120%)',
                        }}
                    >
                        火球 ({(selectedYield.fireballRadius / 1000).toFixed(2)} km)
                    </div>
                )}

                {/* Shockwave Ring */}
                <div
                    className="absolute border-2 border-red-500 border-dashed rounded-full pointer-events-none"
                    style={{
                        left: targetPixels.x, top: targetPixels.y,
                        width: shockwave5psiRadiusPixels * 2, height: shockwave5psiRadiusPixels * 2,
                        transform: 'translate(-50%, -50%)', opacity: 0.8
                    }}
                />
                {shockwave5psiRadiusPixels > 20 && (
                    <div
                        className="absolute text-red-500 text-xs bg-black/60 px-1 py-0.5 rounded pointer-events-none"
                        style={{
                        left: targetPixels.x + shockwave5psiRadiusPixels,
                        top: targetPixels.y,
                        transform: 'translate(8px, -50%)',
                        }}
                    >
                        衝擊波 ({(selectedYield.shockwaveRadius / 1000).toFixed(2)} km)
                    </div>
                )}

                {/* Thermal Radiation Ring */}
                <div
                    className="absolute border-2 border-orange-400 border-dashed rounded-full pointer-events-none"
                    style={{
                        left: targetPixels.x, top: targetPixels.y,
                        width: thermalRadiusPixels * 2, height: thermalRadiusPixels * 2,
                        transform: 'translate(-50%, -50%)', opacity: 0.8
                    }}
                />
                {thermalRadiusPixels > 20 && (
                    <div
                        className="absolute text-orange-400 text-xs bg-black/60 px-1 py-0.5 rounded pointer-events-none"
                        style={{
                        left: targetPixels.x,
                        top: targetPixels.y + thermalRadiusPixels,
                        transform: 'translate(-50%, 8px)',
                        }}
                    >
                        熱輻射 ({(selectedYield.thermalRadius / 1000).toFixed(2)} km)
                    </div>
                )}
            </>
          )}
          
          {phase === SimulationPhase.Fallout && (
              <div
                className="absolute rounded-[50%_50%_30%_50%/50%_50%_50%_40%] bg-purple-900/40 backdrop-blur-sm"
                style={{...falloutStyle, animation: 'fallout-spread 20s linear forwards'}}
                onMouseEnter={() => setIsFalloutHovered(true)}
                onMouseLeave={() => setIsFalloutHovered(false)}
              >
                <style>{`
                    @keyframes fallout-spread {
                        0% { transform: translate(-50%, -10%) scale(0.1) rotate(-15deg); opacity: 0; }
                        10% { opacity: 1; }
                        75% { opacity: 1; }
                        100% { transform: translate(150%, 100%) scale(1) rotate(15deg); opacity: 0; }
                    }
                `}</style>
              </div>
          )}
        </>
      )}

      {phase === SimulationPhase.Flash && (
        <div className="absolute inset-0 bg-white z-50" style={{ animation: 'flash 1.5s ease-out forwards' }}>
          <style>{`
            @keyframes flash {
              0% { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default SimulationView;