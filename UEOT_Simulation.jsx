import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RefreshCw, Zap, Activity, TrendingUp, 
  Radar, Microscope, Sprout, Skull, Users, Layers, MousePointer2, 
  Sun, Gauge, Eye, Network, Flame, Wind, RotateCw, Magnet, Scale, Dna, AlignCenter, ThermometerSun, Box, Shield
} from 'lucide-react';

/**
 * Universal Evolutionary Object Theory (UEOT) - Simulation Lab V40.8 (Final Clean)
 * Author: Dr. Degui Qian
 * * [FIX LOG]
 * 1. Completely removed duplicate function declarations (updateRange, shock, reset, toggleMomentum, toggleSpinRule).
 * 2. Verified all state logic and physics toggles.
 * 3. Cleaned up code structure.
 */

// --- UI Components ---
const EnergyFluxPlot = ({ history, height = 40 }) => {
  if (!history || history.length < 2) return <div style={{height}} className="bg-slate-900/50 rounded w-full"/>;
  const maxE = Math.max(...history.map(h => h.totalEnergy)) * 1.1;
  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * 100;
    const y = 100 - (h.totalEnergy / (maxE || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="relative bg-slate-900/50 border border-slate-700/30 rounded overflow-hidden w-full" style={{ height }}>
       <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" className="absolute inset-0">
          <defs>
            <linearGradient id="fluxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
            </linearGradient>
          </defs>
          <polygon points={`0,100 ${points} 100,100`} fill="url(#fluxGradient)" />
          <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
       </svg>
       <div className="absolute top-0.5 right-1 text-[8px] text-emerald-500 font-mono">Energy Flux</div>
    </div>
  );
};

const PhaseRadar = ({ eta, rho, history, size = 80 }) => {
  const scaleX = (val) => (Math.min(val || 0, 3.5) / 3.5) * size;
  const scaleY = (val) => size - (Math.min(val || 0, 1.0) / 1.0) * size;
  return (
    <div className="relative bg-slate-900/80 border border-slate-700/50 rounded overflow-hidden shadow-inner group" style={{ width: size, height: size }}>
      <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 0% 100%, #10b981 0%, transparent 60%), radial-gradient(circle at 100% 0%, #ef4444 0%, transparent 60%)` }}></div>
      <svg width={size} height={size} className="absolute inset-0 pointer-events-none">
        <polyline points={history.map(p => `${scaleX(p.eta)},${scaleY(p.rho)}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <circle cx={scaleX(eta)} cy={scaleY(rho)} r="2.5" fill="#fff" className="animate-pulse"/>
      </svg>
      <div className="absolute bottom-0 right-1 text-[7px] text-slate-400">η</div>
      <div className="absolute top-0 left-1 text-[7px] text-slate-400">ρ</div>
    </div>
  );
};

const ConfigurableSlider = ({ label, icon: Icon, value, range, onRangeChange, onValueChange, color, desc, fixedRange = false }) => {
  const minVal = isNaN(range[0]) ? 0 : range[0];
  const maxVal = isNaN(range[1]) ? 100 : range[1];
  const safeStep = (maxVal - minVal) > 0 ? (maxVal - minVal) / 100 : 0.01;
  const safeValue = isNaN(value) ? minVal : value;

  return (
    <div className="group relative flex flex-col gap-1 mb-2">
      <div className="flex justify-between text-[10px] text-slate-400 font-medium items-center">
        <span className="flex items-center gap-1">{Icon && <Icon size={10} className={color.replace('accent-', 'text-')} />}{label}</span>
        <span className="font-mono text-slate-200 bg-slate-800 px-1 rounded text-[9px]">{safeValue.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-1">
        {!fixedRange && (
          <input 
            type="number" 
            value={minVal} 
            onChange={(e) => onRangeChange([parseFloat(e.target.value) || 0, maxVal])}
            className="w-6 h-4 text-[8px] bg-slate-900 border border-slate-700 text-slate-500 text-center rounded focus:border-sky-500 outline-none p-0"
          />
        )}
        <input 
          type="range" 
          min={minVal} 
          max={maxVal} 
          step={safeStep} 
          value={safeValue} 
          onChange={(e) => onValueChange(parseFloat(e.target.value))} 
          className={`flex-1 h-1 bg-slate-700 rounded cursor-pointer appearance-none ${color} hover:h-1.5 transition-all`}
        />
        {!fixedRange && (
          <input 
            type="number" 
            value={maxVal} 
            onChange={(e) => onRangeChange([minVal, parseFloat(e.target.value) || minVal + 1])}
            className="w-6 h-4 text-[8px] bg-slate-900 border border-slate-700 text-slate-500 text-center rounded focus:border-sky-500 outline-none p-0"
          />
        )}
      </div>
      <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 bg-slate-800 text-slate-300 text-[9px] px-2 py-1 rounded border border-slate-600 shadow-xl whitespace-nowrap z-50">{desc}</div>
    </div>
  );
};

const UEOTSimulation = () => {
  const width = 800;
  const height = 400;
  const HISTORY_LEN = 50;
  const FLUX_LEN = 80; 

  const [isRunning, setIsRunning] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [viewMode, setViewMode] = useState('standard'); 

  const [params, setParams] = useState({
    piBias: 2.0, phiBias: 2.0, coupling: 0.5,
    rigidity: 0.3, hierarchyStr: 1.0, 
    friction: 0.02, 
    spinForce: 1.0, spinRatio: 0.5, spinRule: -1,
    openness: 1.0, 
    foodRegen: 20.0, foodValue: 30, metabolism: 1.0,
    reproThreshold: 150, decayEntropy: 0.7, shockIntensity: 0,
    conserveMomentum: true 
  });

  const [ranges, setRanges] = useState({
    piBias: [0, 10], phiBias: [0, 20], coupling: [0, 100],
    rigidity: [0, 1], hierarchyStr: [0, 10], 
    friction: [0.0, 0.2], 
    spinForce: [0, 5], spinRatio: [0, 1], openness: [0, 1], 
    foodRegen: [0, 100], foodValue: [5, 100], metabolism: [0.1, 5],
    reproThreshold: [50, 300], decayEntropy: [0.1, 1.0]
  });

  const [metrics, setMetrics] = useState({ eta: 1.0, rho: 0.0, pop: 0, food: 0, corpses: 0, avgOmega: 100, state: 'Adaptive' });
  const [trajectory, setTrajectory] = useState([{ eta: 1, rho: 0 }]);
  const [energyFlux, setEnergyFlux] = useState([{ totalEnergy: 1000 }]);

  const agentsRef = useRef([]);
  const foodsRef = useRef([]);
  const corpsesRef = useRef([]); 
  const ripplesRef = useRef([]); 
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const tickRef = useRef(0);

  // Init
  const initSystem = useCallback(() => {
    agentsRef.current = Array.from({ length: 60 }).map(() => createAgent());
    foodsRef.current = Array.from({ length: 150 }).map(() => createFood());
    corpsesRef.current = [];
    ripplesRef.current = [];
    setMetrics({ eta: 1, rho: 0, pop: 60, food: 150, corpses: 0, avgOmega: 100, state: 'Adaptive' });
    setTrajectory([{ eta: 1, rho: 0 }]);
    setEnergyFlux(Array(FLUX_LEN).fill({ totalEnergy: 60*80 + 150*30 }));
    setParams(p => ({ ...p, shockIntensity: 0, spinRule: -1, spinRatio: 0.5, openness: 1.0, conserveMomentum: true, friction: 0.02 })); 
    setSelectedAgentId(null);
  }, []);

  const createFood = (x, y, value, type = 'sun') => ({
    id: Math.random().toString(36) + performance.now(),
    x: x ?? Math.random() * width,
    y: y ?? Math.random() * height,
    value: value ?? params.foodValue,
    type: type 
  });

  const createAgent = (x, y, energy = 80, gen = 0, spin = null) => ({
    id: Math.random().toString(36).substr(2, 9) + performance.now(),
    x: x ?? Math.random() * width,
    y: y ?? Math.random() * height,
    vx: (Math.random() - 0.5) * 3, 
    vy: (Math.random() - 0.5) * 3,
    omega: 100, energy: energy, radius: 4,
    omegaPhase: Math.random() * Math.PI * 2,
    spin: spin ?? (Math.random() < params.spinRatio ? 1 : -1), 
    wanderAngle: Math.random() * Math.PI * 2, 
    age: 0, generation: gen,
    vecPi: {x:0, y:0}, vecPhi: {x:0, y:0}, vecGod: {x:0, y:0}
  });

  useEffect(() => { initSystem(); }, [initSystem]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (width / rect.width);
    const y = (e.clientY - rect.top) * (height / rect.height);
    let nearest = null, minDist = 60;
    agentsRef.current.forEach(a => {
      const d = Math.sqrt((a.x - x)**2 + (a.y - y)**2);
      if (d < minDist) { minDist = d; nearest = a; }
    });
    setSelectedAgentId(prev => (nearest && prev !== nearest.id) ? nearest.id : null);
  };

  const handleSpinRatioChange = (newRatio) => {
    setParams(p => ({ ...p, spinRatio: newRatio }));
    agentsRef.current.forEach(a => {
       a.spin = Math.random() < newRatio ? 1 : -1;
    });
  };

  const cycleSpinRule = () => {
    setParams(p => {
      let nextRule = -1;
      if (p.spinRule === -1) nextRule = 1; 
      else if (p.spinRule === 1) nextRule = 0; 
      else nextRule = -1; 
      return { ...p, spinRule: nextRule };
    });
  };
  
  // Define functions ONCE
  const toggleMomentum = () => setParams(p => ({ ...p, conserveMomentum: !p.conserveMomentum }));
  const updateRange = (k, v) => setRanges(p => ({...p, [k]: v}));
  const shock = () => setParams(p => ({ ...p, shockIntensity: 50 }));
  const reset = () => initSystem();
  const toggleSpinRule = () => cycleSpinRule(); // Reuse cycleSpinRule logic

  const update = useCallback(() => {
    if (!isRunning) return;

    const agents = agentsRef.current;
    const foods = foodsRef.current;
    const corpses = corpsesRef.current;
    let vecSumX = 0, vecSumY = 0, totalSpeed = 0, totalOmega = 0;
    let newAgents = [];
    let newFoods = [];

    // Friction Multiplier
    const frictionFactor = 1.0 - params.friction;

    // Corpse Physics
    corpsesRef.current = corpses.filter(c => {
      c.decayTimer--;
      c.x += c.vx; c.y += c.vy;
      c.vx *= frictionFactor; c.vy *= frictionFactor; 
      c.x = (c.x + width) % width; c.y = (c.y + height) % height;
      if (c.decayTimer <= 0) {
        if (c.energy > 5) {
           const foodVal = c.energy * params.decayEntropy;
           newFoods.push(createFood(c.x + (Math.random()-0.5)*5, c.y + (Math.random()-0.5)*5, foodVal, 'decay'));
        }
        return false;
      }
      return true;
    });

    const sunChance = 0.01 * params.foodRegen; 
    const count = Math.floor(sunChance) + (Math.random() < (sunChance % 1) ? 1 : 0);
    if (foods.length < 1500) {
       for(let i=0; i<count; i++) newFoods.push(createFood(null, null, params.foodValue, 'sun'));
    }

    const currentRho = metrics.rho;
    const activeAgents = agents.filter(a => a.omega > 0);

    // Physics Collision (Elastic)
    for (let i = 0; i < activeAgents.length; i++) {
      let a = activeAgents[i];
      for (let j = i + 1; j < activeAgents.length; j++) {
        let b = activeAgents[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx*dx + dy*dy;
        const minD = a.radius + b.radius;
        if (d2 < minD*minD) {
           const d = Math.sqrt(d2) || 0.1;
           const overlap = minD - d;
           const force = Math.min(overlap * 0.5, 4.0); // Spring force
           const nx = dx/d, ny = dy/d;
           
           a.vx -= nx * force; a.vy -= ny * force;
           b.vx += nx * force; b.vy += ny * force;
           
           // Spin Repulsion logic
           if (params.spinRule === 1 && a.spin === b.spin) {
               const repel = params.spinForce * 0.5;
               a.vx -= nx * repel; a.vy -= ny * repel;
               b.vx += nx * repel; b.vy += ny * repel;
           }
        }
      }
    }

    activeAgents.forEach(agent => {
      agent.radius = 4 + Math.sqrt(Math.min(agent.energy, 1000)) * 0.3;
      let nearestFood = null, minDist = Infinity;
      const visionSq = 50000; 
      let visibleFoods = 0;
      for (let f of foods) {
        const d2 = (f.x - agent.x)**2 + (f.y - agent.y)**2;
        if (d2 < visionSq) {
           visibleFoods++;
           if (d2 < minDist) { minDist = d2; nearestFood = f; }
        }
      }
      const dist = Math.sqrt(minDist);

      let alignX = 0, alignY = 0, repelX = 0, repelY = 0, neighbors = 0;
      let spinForceX = 0, spinForceY = 0;
      const visionRadius = 80; 

      activeAgents.forEach(other => {
        if (other === agent) return;
        const dx = agent.x - other.x, dy = agent.y - other.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < 6400) { 
           const d = Math.sqrt(d2);
           if (d < 10 + agent.radius) { repelX += dx/(d+0.1); repelY += dy/(d+0.1); }
           
           if (params.spinForce > 0 && params.spinRule !== 0) {
             const spinProduct = agent.spin * other.spin;
             const interactionType = spinProduct * params.spinRule;
             const dirX = other.x - agent.x; 
             const dirY = other.y - agent.y;
             const distNorm = d + 5.0;
             
             let decay = Math.max(0, 1 - (d / visionRadius));
             decay = decay * decay;
             const strength = params.spinForce * decay * 0.5;

             if (interactionType > 0) { // Attract
               spinForceX += (dirX / distNorm) * strength;
               spinForceY += (dirY / distNorm) * strength;
               // Orbital Assist
               spinForceX += -(dirY / distNorm) * strength * 0.3; 
               spinForceY += (dirX / distNorm) * strength * 0.3;
             } else { // Repel
               spinForceX -= (dirX / distNorm) * strength * 1.2;
               spinForceY -= (dirY / distNorm) * strength * 1.2;
             }
           }
           alignX += other.vx; alignY += other.vy;
           neighbors++;
        }
      });

      let ax = 0, ay = 0;
      
      if (agent.energy > 1) {
          let piX = 0, piY = 0;
          if (params.piBias > 0.01 && nearestFood) {
             const str = params.piBias * 0.2;
             piX = ((nearestFood.x - agent.x) / dist) * str;
             piY = ((nearestFood.y - agent.y) / dist) * str;
          }

          let phiX = 0, phiY = 0;
          if (params.phiBias > 0.1) {
             const competition = neighbors / (visibleFoods + 1); 
             const fearFactor = Math.max(0, 1 - (agent.energy / 200)); 
             const phiBase = params.phiBias * 0.1;
             if (competition > 0.5 && fearFactor > 0.5) {
                phiX = repelX * phiBase * 2.0; phiY = repelY * phiBase * 2.0;
             } else {
                agent.wanderAngle += (Math.random() - 0.5) * 0.5; 
                phiX = Math.cos(agent.wanderAngle) * phiBase;
                phiY = Math.sin(agent.wanderAngle) * phiBase;
                if (agent.energy < 30 && params.phiBias < 8.0) { phiX *= 0.1; phiY *= 0.1; }
                if (!nearestFood) { phiX *= 2.0; phiY *= 2.0; }
             }
          }

          let cX = 0, cY = 0;
          if (neighbors > 0) {
            const cStr = params.coupling * 0.08;
            cX = (alignX / neighbors) * cStr;
            cY = (alignY / neighbors) * cStr;
          }

          ax = piX + phiX + cX + spinForceX;
          ay = piY + phiY + cY + spinForceY;

          if (params.shockIntensity > 0) {
            ax += (Math.random()-0.5) * params.shockIntensity;
            ay += (Math.random()-0.5) * params.shockIntensity;
          }
          
          agent.vecPi = {x: piX, y: piY}; agent.vecPhi = {x: phiX, y: phiY}; agent.vecGod = {x: ax, y: ay};
      } else {
          ax = spinForceX; 
          ay = spinForceY;
          if (!params.conserveMomentum) { agent.vx *= 0.8; agent.vy *= 0.8; }
      }

      agent.vx += ax; agent.vy += ay;
      const speed = Math.sqrt(agent.vx**2 + agent.vy**2);
      
      const limit = 4.0 + params.piBias * 0.5; 
      if (speed > limit) { agent.vx = (agent.vx/speed)*limit; agent.vy = (agent.vy/speed)*limit; }
      
      agent.vx *= frictionFactor; 
      agent.vy *= frictionFactor;
      
      agent.x = (agent.x + agent.vx + width) % width;
      agent.y = (agent.y + agent.vy + height) % height;
      
      agent.omegaPhase += (0.1 + speed * 0.05) * agent.spin; 
      agent.age++;

      const Lo = params.openness;
      let damage = 0.02 * Lo; 
      damage += speed * 0.01 * Lo; 
      damage += currentRho * currentRho * params.hierarchyStr * 0.6 * Lo; 
      if (params.shockIntensity > 0) damage += params.shockIntensity * (1 + params.rigidity * 5) * 0.2;
      agent.omega -= damage;
      
      const massFactor = (agent.radius / 4); 
      const burn = ((0.02 * params.metabolism * massFactor) + (speed * 0.02 * params.metabolism)) * Lo;
      agent.energy -= burn;

      if (Lo > 0.01 && nearestFood && dist < (agent.radius + 2) && !nearestFood.eaten) {
        agent.energy += nearestFood.value;
        nearestFood.eaten = true;
        if (agent.energy > 40) agent.omega = Math.min(100, agent.omega + 15);
      }

      if (agent.energy <= -20 || agent.omega <= 0) { 
         corpsesRef.current.push({
           x: agent.x, y: agent.y, vx: agent.vx, vy: agent.vy, 
           energy: Math.max(10, agent.energy + 20), decayTimer: 60 + Math.random() * 40
         });
         if (agent.energy > 60) ripplesRef.current.push({ x: agent.x, y: agent.y, r: 0, maxR: Math.min(agent.energy, 80), alpha: 0.7, color: '#ef4444' });
         agent.omega = -1;
      }

      const crowdCost = neighbors * 10;
      const realThreshold = params.reproThreshold + crowdCost;
      if (Lo > 0.01 && agent.energy > realThreshold && activeAgents.length < 400) {
        const childEnergy = agent.energy * 0.4;
        agent.energy *= 0.6; 
        const child = createAgent(agent.x, agent.y, childEnergy, agent.generation + 1, agent.spin); 
        child.vx = agent.vx - (Math.random()-0.5); 
        child.vy = agent.vy - (Math.random()-0.5);
        newAgents.push(child);
        ripplesRef.current.push({x: agent.x, y: agent.y, r: 0, maxR: 20, alpha: 0.4, color: '#fff'});
      }

      totalSpeed += speed;
      totalOmega += agent.omega;
      vecSumX += agent.vx; vecSumY += agent.vy;
    });

    foodsRef.current = [...foods.filter(f => !f.eaten), ...newFoods];
    agentsRef.current = [...activeAgents, ...newAgents];
    ripplesRef.current.forEach(r => { r.r += 2; r.alpha -= 0.03; });
    ripplesRef.current = ripplesRef.current.filter(r => r.alpha > 0);

    if (params.shockIntensity > 0) setParams(p => ({ ...p, shockIntensity: Math.max(0, p.shockIntensity - 2) }));

    if (activeAgents.length > 0) {
      const eta = (totalSpeed / activeAgents.length) / 1.0;
      const vMag = Math.sqrt(vecSumX**2 + vecSumY**2);
      const rho = vMag / (totalSpeed + 0.001);
      const avgOmega = totalOmega / activeAgents.length;
      const agentEnergy = activeAgents.reduce((sum, a) => sum + Math.max(0, a.energy), 0);
      const foodEnergy = foodsRef.current.reduce((sum, f) => sum + f.value, 0);
      const totalE = agentEnergy + foodEnergy;
      let state = 'Adaptive';
      if (rho > 0.65) state = 'Critical';
      if (eta > 2.5) state = 'Overheated';
      if (activeAgents.length < 10) state = 'Collapse';

      setMetrics({ eta, rho, state, avgOmega, pop: activeAgents.length, food: foodsRef.current.length, corpses: corpsesRef.current.length });
      tickRef.current++;
      if (tickRef.current % 5 === 0) {
        setTrajectory(prev => {
          const next = [...prev, { eta, rho }];
          if (next.length > HISTORY_LEN) next.shift();
          return next;
        });
        setEnergyFlux(prev => {
           const next = [...prev, { totalEnergy: totalE }];
           if (next.length > FLUX_LEN) next.shift();
           return next;
        });
      }
    } else {
      setMetrics(m => ({ ...m, pop: 0, state: 'Collapse' }));
      setEnergyFlux(prev => [...prev.slice(1), { totalEnergy: 0 }]);
    }
  }, [isRunning, params, width, height, metrics.rho, ranges]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let bg = '15, 23, 42'; 
    if (metrics.state === 'Critical') bg = '40, 10, 10';
    ctx.fillStyle = `rgba(${bg}, 0.3)`; ctx.fillRect(0, 0, width, height);

    if (metrics.rho > 0.4 || viewMode === 'stress') {
       ctx.beginPath();
       const active = agentsRef.current;
       const step = active.length > 100 ? 2 : 1;
       for (let i=0; i<active.length; i+=step) {
         for (let j=i+1; j<active.length; j+=step) {
           const dx = active[i].x - active[j].x, dy = active[i].y - active[j].y;
           if (dx*dx + dy*dy < 3600) { ctx.moveTo(active[i].x, active[i].y); ctx.lineTo(active[j].x, active[j].y); }
         }
       }
       const color = metrics.state === 'Critical' ? '239, 68, 68' : '148, 163, 184';
       ctx.strokeStyle = `rgba(${color}, ${Math.max(0.05, metrics.rho - 0.2)})`; ctx.lineWidth = 1; ctx.stroke();
    }

    ripplesRef.current.forEach(r => {
       ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2);
       ctx.strokeStyle = r.color || `rgba(148, 163, 184, ${r.alpha})`; ctx.lineWidth = 1 + r.alpha * 2; ctx.stroke();
    });

    corpsesRef.current.forEach(c => {
      const alpha = c.decayTimer / 100;
      ctx.beginPath(); ctx.arc(c.x, c.y, 4 + (c.energy/100), 0, Math.PI*2);
      ctx.fillStyle = `rgba(100, 116, 139, ${alpha})`; ctx.fill(); 
      if (Math.abs(c.vx) > 0.1) {
         ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x - c.vx*3, c.y - c.vy*3);
         ctx.strokeStyle = `rgba(100, 116, 139, ${alpha * 0.5})`; ctx.lineWidth=2; ctx.stroke();
      }
    });

    foodsRef.current.forEach(f => {
      ctx.beginPath(); ctx.arc(f.x, f.y, 2.5, 0, Math.PI*2);
      ctx.fillStyle = f.type === 'sun' ? '#10b981' : '#a16207'; ctx.fill();
    });

    agentsRef.current.forEach(a => {
      const isSelected = a.id === selectedAgentId;
      const alpha = Math.min(1, a.omega / 80);
      const r = a.radius;
      let colorBase = a.spin > 0 ? [190, 90, 60] : [280, 80, 60]; 
      if (metrics.state === 'Critical') colorBase = [0, 90, 60];
      let color = `hsla(${colorBase[0]}, ${colorBase[1]}%, ${colorBase[2]}%, ${alpha})`;
      
      if (params.openness < 0.1) {
         color = a.spin > 0 ? '#0e7490' : '#581c87'; 
      }

      if (isSelected) color = '#ffffff';

      ctx.beginPath(); 
      if (params.rigidity > 0.6) { const s = r * 1.6; ctx.rect(a.x - s/2, a.y - s/2, s, s); } 
      else { ctx.arc(a.x, a.y, r, 0, Math.PI*2); }
      ctx.fillStyle = color; ctx.fill();

      if (params.openness > 0.1) {
         const innerR = r * 0.6; const start = a.omegaPhase; const coverage = (Math.max(0, a.omega) / 100) * Math.PI * 2;
         const spinColor = a.spin > 0 ? '#bae6fd' : '#e9d5ff'; 
         ctx.beginPath(); 
         if (a.spin > 0) { ctx.arc(a.x, a.y, innerR, start, start + coverage); } 
         else { ctx.arc(a.x, a.y, innerR, start, start - coverage, true); }
         ctx.strokeStyle = spinColor; ctx.lineWidth = 1.5; ctx.stroke();
         
         if (a.omega < 90) {
            ctx.beginPath();
            if (a.spin > 0) ctx.arc(a.x, a.y, innerR, start + coverage, start + Math.PI*2);
            else ctx.arc(a.x, a.y, innerR, start - coverage, start - Math.PI*2, true);
            ctx.strokeStyle = 'rgba(255,0,0,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
         }
      }

      if (isSelected) {
        const origin = {x: a.x, y: a.y}; const scale = 100;
        const drawV = (v, c, w=2) => {
           ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(origin.x + v.x * scale, origin.y + v.y * scale);
           ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke();
        };
        ctx.beginPath(); ctx.arc(a.x, a.y, 200, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
        drawV(a.vecPi, '#10b981'); drawV(a.vecPhi, '#38bdf8'); drawV(a.vecGod, '#ffffff', 3);
      }
    });

    if (params.shockIntensity > 0) {
       ctx.fillStyle = `rgba(255, 255, 255, ${params.shockIntensity/60})`; ctx.fillRect(0, 0, width, height);
    }
  }, [width, height, metrics.state, metrics.rho, params.shockIntensity, selectedAgentId, viewMode, params.rigidity, params.openness]);

  useEffect(() => {
    const loop = () => { update(); draw(); requestRef.current = requestAnimationFrame(loop); };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update, draw]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-slate-950 text-slate-300 font-sans rounded-xl border border-slate-800 shadow-2xl h-screen flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-2 border-b border-slate-800 pb-2 shrink-0">
        <div className="flex items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none">UEOT Lab <span className="text-indigo-400 text-sm font-mono">V40.8</span></h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider">Inertia & Conservation</span>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setIsRunning(!isRunning)} className={`flex items-center gap-1 px-3 py-1 rounded font-bold text-[10px] border transition-colors ${isRunning ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-emerald-600 text-white border-emerald-500'}`}>
                {isRunning ? <Pause size={12}/> : <Play size={12}/>} {isRunning ? 'PAUSE' : 'RESUME'}
            </button>
            <button onClick={()=>initSystem()} className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded font-bold text-[10px] text-slate-300 transition-colors">
                <RefreshCw size={12}/> RESET
            </button>
            <button onClick={shock} className="flex items-center gap-1 px-4 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] rounded transition-colors shadow-lg shadow-red-900/20 active:scale-95">
                <Zap size={12}/> SHOCK
            </button>
          </div>
        </div>
        
        <div className="flex gap-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            <span className="flex items-center gap-1 text-emerald-400"><Sprout size={12}/> {metrics.food}</span>
            <span className="flex items-center gap-1 text-slate-200"><Users size={12}/> {metrics.pop}</span>
            <span className="flex items-center gap-1 text-slate-500"><Skull size={12}/> {metrics.corpses}</span>
            <span className="flex items-center gap-1 text-sky-400"><Gauge size={12}/> Ω {metrics.avgOmega.toFixed(0)}%</span>
        </div>
      </div>

      {/* MAIN ROW */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        
        {/* LEFT: DASHBOARD */}
        <div className="w-48 flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar">
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex flex-col items-center shadow-lg shrink-0">
             <div className="w-full flex justify-between text-[10px] font-bold text-slate-500 mb-1">
               <span className="flex items-center gap-1"><Radar size={10}/> PHASE</span>
               <span className={`text-[9px] ${metrics.state==='Critical'?'text-red-500 animate-pulse':metrics.state==='Adaptive'?'text-emerald-500':'text-amber-500'}`}>{metrics.state}</span>
             </div>
             <PhaseRadar eta={metrics.eta} rho={metrics.rho} history={trajectory} size={80} />
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex flex-col items-center shadow-lg shrink-0 h-24">
             <div className="w-full flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span className="flex items-center gap-1"><Activity size={10}/> FLUX</span></div>
             <EnergyFluxPlot history={energyFlux} height={60} />
          </div>

          {/* View Toggles */}
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex flex-col gap-2 shrink-0">
             <span className="text-[9px] font-bold text-slate-500 uppercase">View Mode</span>
             <div className="flex gap-1">
               <button onClick={()=>setViewMode('standard')} className={`flex-1 p-1.5 rounded flex justify-center ${viewMode==='standard'?'bg-slate-700 text-white':'text-slate-500 hover:text-slate-300 bg-slate-950'}`} title="Standard"><Eye size={14}/></button>
               <button onClick={()=>setViewMode('stress')} className={`flex-1 p-1.5 rounded flex justify-center ${viewMode==='stress'?'bg-red-900/30 text-red-400 border border-red-900/50':'text-slate-500 hover:text-slate-300 bg-slate-950'}`} title="Stress"><Network size={14}/></button>
               <button onClick={()=>setViewMode('topology')} className={`flex-1 p-1.5 rounded flex justify-center ${viewMode==='topology'?'bg-sky-900/30 text-sky-400 border border-sky-900/50':'text-slate-500 hover:text-slate-300 bg-slate-950'}`} title="Topology"><Layers size={14}/></button>
             </div>
          </div>
          
          {/* Inspector */}
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex-1 min-h-[100px]">
            <div className="text-[9px] font-bold text-slate-500 mb-1 flex items-center gap-1"><Microscope size={10}/> INSPECTOR</div>
            {selectedAgentId ? (
               <div className="space-y-1 font-mono text-[9px] text-slate-400">
                  <div className="flex justify-between"><span>ID</span><span>{selectedAgentId.slice(0,4)}</span></div>
                  <div className="flex justify-between text-emerald-400"><span>Π</span><span>{params.piBias.toFixed(1)}</span></div>
                  <div className="flex justify-between text-sky-400"><span>Φ</span><span>{params.phiBias.toFixed(1)}</span></div>
                  <div className="border-t border-slate-700 pt-1 mt-1">
                    <div className="flex justify-between text-indigo-400"><span>SPIN</span><span>{agentsRef.current.find(a=>a.id===selectedAgentId)?.spin > 0 ? 'R (+1)' : 'L (-1)'}</span></div>
                    <div className="flex justify-between text-amber-400"><span>TYPE</span><span>{params.openness < 0.1 ? 'I (Closed)' : 'II (Open)'}</span></div>
                  </div>
               </div>
            ) : (
               <div className="text-[9px] text-slate-600 italic text-center mt-auto mb-auto">Click Agent<br/>to Inspect</div>
            )}
          </div>
        </div>

        {/* RIGHT: CANVAS */}
        <div className="flex-1 relative bg-slate-950 rounded-lg border border-slate-800 overflow-hidden shadow-inner group">
           <canvas ref={canvasRef} width={width} height={height} onClick={handleCanvasClick} className="w-full h-full object-contain cursor-crosshair"/>
           {!selectedAgentId && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-600 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none flex flex-col items-center"><MousePointer2/><span className="text-xs mt-1">Interact</span></div>}
        </div>
      </div>

      {/* BOTTOM: CONTROL PANEL */}
      <div className="h-auto min-h-[160px] shrink-0 bg-slate-900 border border-slate-800 rounded-lg p-4 mt-3 shadow-xl grid grid-cols-3 gap-6 overflow-hidden">
         {/* COL 1 */}
         <div>
           <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase flex items-center gap-1 border-b border-slate-800 pb-1"><Activity size={10}/> Agent Drives</h3>
           <ConfigurableSlider label="Π: Greed" icon={TrendingUp} value={params.piBias} range={ranges.piBias} onRangeChange={r=>updateRange('piBias',r)} onValueChange={v=>setParams({...params, piBias:v})} color="accent-emerald-500" desc="Food Motivation"/>
           <ConfigurableSlider label="Φ: Explore" icon={Microscope} value={params.phiBias} range={ranges.phiBias} onRangeChange={r=>updateRange('phiBias',r)} onValueChange={v=>setParams({...params, phiBias:v})} color="accent-sky-500" desc="Entropy / Curiosity"/>
           <ConfigurableSlider label="Coupling" icon={Users} value={params.coupling} range={ranges.coupling} onRangeChange={r=>updateRange('coupling',r)} onValueChange={v=>setParams({...params, coupling:v})} color="accent-purple-500" desc="Herd Strength"/>
           
           <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50 gap-2">
              <div className="flex-1">
                <ConfigurableSlider label="Spin Ratio" icon={Scale} value={params.spinRatio} range={ranges.spinRatio} onRangeChange={r=>updateRange('spinRatio',r)} onValueChange={v=>handleSpinRatioChange(v)} color="accent-blue-400" desc="L/R Ratio" fixedRange={true}/>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <button onClick={toggleSpinRule} className={`px-2 py-1 rounded text-[8px] font-bold transition-colors w-16 text-center ${params.spinRule===1 ? 'bg-blue-600 text-white' : params.spinRule===-1 ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                   {params.spinRule===1?'LIKE':params.spinRule===-1?'OPPOSITE':'NO SPIN'}
                 </button>
              </div>
           </div>
         </div>
         {/* COL 2 */}
         <div>
           <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase flex items-center gap-1 border-b border-slate-800 pb-1"><Layers size={10}/> Physics & Topology</h3>
           <ConfigurableSlider label="Rigidity" icon={AlignCenter} value={params.rigidity} range={ranges.rigidity} onRangeChange={r=>updateRange('rigidity',r)} onValueChange={v=>setParams({...params, rigidity:v})} color="accent-slate-400" desc="Structural Stiffness"/>
           <ConfigurableSlider label="Stress Link" icon={Zap} value={params.hierarchyStr} range={ranges.hierarchyStr} onRangeChange={r=>updateRange('hierarchyStr',r)} onValueChange={v=>setParams({...params, hierarchyStr:v})} color="accent-red-500" desc="Risk Damage Multiplier"/>
           {/* FRICTION = INERTIA DAMPING */}
           <ConfigurableSlider label="Friction" icon={Wind} value={params.friction} range={ranges.friction} onRangeChange={r=>updateRange('friction',r)} onValueChange={v=>setParams({...params, friction:v})} color="accent-slate-500" desc="0 = No Drag (Space)"/>
           <ConfigurableSlider label="Spin Force" icon={RotateCw} value={params.spinForce} range={ranges.spinForce} onRangeChange={r=>updateRange('spinForce',r)} onValueChange={v=>setParams({...params, spinForce:v})} color="accent-indigo-400" desc="Chiral Field Strength"/>
           
           <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
             <span className="text-[9px] text-slate-400">Conserve Momentum</span>
             <button onClick={toggleMomentum} className={`px-2 py-1 rounded text-[8px] font-bold ${params.conserveMomentum ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {params.conserveMomentum ? "ON" : "OFF"}
             </button>
           </div>
         </div>
         {/* COL 3 */}
         <div>
           <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase flex items-center gap-1 border-b border-slate-800 pb-1"><Sun size={10}/> Ecosystem</h3>
           <ConfigurableSlider label="Openness (Lo)" icon={Box} value={params.openness} range={ranges.openness} onRangeChange={r=>updateRange('openness',r)} onValueChange={v=>setParams({...params, openness:v})} color="accent-cyan-400" desc="0=Type I (Closed), >0=Type II (Living)"/>
           <ConfigurableSlider label="Sunlight" icon={Sun} value={params.foodRegen} range={ranges.foodRegen} onRangeChange={r=>updateRange('foodRegen',r)} onValueChange={v=>setParams({...params, foodRegen:v})} color="accent-amber-400" desc="Energy Input Rate"/>
           <ConfigurableSlider label="Metabolism" icon={Flame} value={params.metabolism} range={ranges.metabolism} onRangeChange={r=>updateRange('metabolism',r)} onValueChange={v=>setParams({...params, metabolism:v})} color="accent-orange-500" desc="Burn Rate"/>
           <ConfigurableSlider label="Repro Cost" icon={Dna} value={params.reproThreshold} range={ranges.reproThreshold} onRangeChange={r=>updateRange('reproThreshold',r)} onValueChange={v=>setParams({...params, reproThreshold:v})} color="accent-pink-500" desc="Birth Threshold"/>
         </div>
      </div>

    </div>
  );
};

export default UEOTSimulation;
