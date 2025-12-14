/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Grid, TileData, BuildingType, CityStats, AIGoal, NewsItem } from './types';
import { GRID_SIZE, TICK_RATE_MS, INITIAL_MONEY, BUILDINGS, PORTFOLIO_CONTENT } from './constants';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';

// --- Path Generation ---
interface Point { x: number; y: number; }

const generateWindingPath = (start: Point, end: Point): Point[] => {
    // To make a long, winding path, we define intermediate waypoints
    // This forces the path to snake around the map instead of going straight
    const waypoints: Point[] = [
        start,
        { x: 2, y: 12 },
        { x: 6, y: 12 },
        { x: 6, y: 9 },
        { x: 2, y: 9 },
        { x: 2, y: 5 },
        { x: 10, y: 5 },
        { x: 10, y: 10 },
        { x: 13, y: 10 },
        { x: 13, y: 3 },
        end
    ];

    const fullPath: Point[] = [];

    // Helper to move between two points
    const connectPoints = (p1: Point, p2: Point) => {
        let curr = { ...p1 };
        const segment: Point[] = [];
        
        while (curr.x !== p2.x || curr.y !== p2.y) {
            // Determine direction preferences
            const dx = p2.x - curr.x;
            const dy = p2.y - curr.y;
            
            let moveX = false;
            
            // Simple logic: try to move in the major direction first, but create "steps"
            if (Math.abs(dx) > Math.abs(dy)) {
                moveX = true;
            } else if (Math.abs(dy) > Math.abs(dx)) {
                moveX = false;
            } else {
                moveX = Math.random() > 0.5;
            }

            if (moveX && dx !== 0) {
                curr.x += Math.sign(dx);
            } else if (dy !== 0) {
                curr.y += Math.sign(dy);
            } else if (dx !== 0) {
                // Fallback if we only have X left
                curr.x += Math.sign(dx);
            }

            segment.push({ ...curr });
        }
        return segment;
    };

    fullPath.push(start);
    for (let i = 0; i < waypoints.length - 1; i++) {
        const segment = connectPoints(waypoints[i], waypoints[i+1]);
        fullPath.push(...segment);
    }

    return fullPath;
};

// Initialize Grid & Path
const createInitialState = (): { grid: Grid, path: Point[] } => {
  const grid: Grid = [];
  const start = { x: 0, y: 14 };
  const end = { x: 14, y: 0 };
  const path = generateWindingPath(start, end);
  const pathSet = new Set(path.map(p => `${p.x},${p.y}`));

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      let type = BuildingType.None;
      
      if (pathSet.has(`${x},${y}`)) {
          type = BuildingType.Road;
      } else if (x >= 12 && y <= 2) {
          // Clear zone around end point (14,0) to prevent visual obstruction
          // Specifically targeting the "closest one the end of the map"
          type = BuildingType.None;
      } else {
          // New "Fun" Generation Logic
          const rand = Math.random();
          
          // High chance of generating something to make it lively, but keep 20% grass
          if (rand > 0.2) {
              const buildingRoll = Math.random();
              if (buildingRoll > 0.55) {
                  type = BuildingType.Residential;
              } else if (buildingRoll > 0.3) {
                  type = BuildingType.Commercial;
              } else {
                  type = BuildingType.Park;
              }
          }
      }

      row.push({ x, y, buildingType: type });
    }
    grid.push(row);
  }
  return { grid, path };
};

function App() {
  const [initialState] = useState(createInitialState);
  const [grid, setGrid] = useState<Grid>(initialState.grid);
  const [stats, setStats] = useState<CityStats>({
    money: INITIAL_MONEY,
    population: 340,
    day: 1,
  });
  
  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.Commercial); 

  // --- Portfolio State ---
  // null = cycling, number = stopped at that checkpoint index
  const [activeCheckpointIndex, setActiveCheckpointIndex] = useState<number | null>(null);
  const [cycleKey, setCycleKey] = useState(0); // Used to restart the cyclist
  
  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
          ...prev,
          day: prev.day + 1
      }));
    }, TICK_RATE_MS);
    return () => clearInterval(interval);
  }, []);

  const handleTileClick = (x: number, y: number) => {
    const currentTile = grid[y][x];
    const isPath = initialState.path.some(p => p.x === x && p.y === y);

    if (selectedTool === BuildingType.None) {
        if (!isPath) {
            const newGrid = [...grid];
            newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None };
            setGrid(newGrid);
        }
        return;
    }

    if (currentTile.buildingType === BuildingType.None) {
        const newGrid = [...grid];
        newGrid[y][x] = { ...currentTile, buildingType: selectedTool };
        setGrid(newGrid);
    }
  };

  const handleReachCheckpoint = (index: number) => {
      setActiveCheckpointIndex(index);
  };

  const handleContinueCycle = () => {
      setActiveCheckpointIndex(null);
  };

  const handleCycleFinish = () => {
      // Just stop, maybe show a "Replay" notification or simply wait for user to hit restart
      console.log("Cycle Finished");
  };

  const handleRestart = () => {
      setActiveCheckpointIndex(null);
      setCycleKey(prev => prev + 1);
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden selection:bg-transparent selection:text-transparent bg-[#60a5fa]">
      <IsoMap 
        grid={grid} 
        onTileClick={handleTileClick} 
        hoveredTool={selectedTool}
        population={stats.population}
        path={initialState.path}
        activeCheckpointIndex={activeCheckpointIndex}
        onReachCheckpoint={handleReachCheckpoint}
        cycleKey={cycleKey}
        onCycleFinish={handleCycleFinish}
      />
      <UIOverlay 
        stats={stats}
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        currentGoal={null}
        newsFeed={[]}
        onClaimReward={() => {}}
        isGeneratingGoal={false}
        aiEnabled={false}
        activeCheckpoint={activeCheckpointIndex !== null ? PORTFOLIO_CONTENT[activeCheckpointIndex] : null}
        onContinueCycle={handleContinueCycle}
        onRestart={handleRestart}
      />
    </div>
  );
}

export default App;