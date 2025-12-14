/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem, PortfolioCheckpoint } from '../types';
import { BUILDINGS } from '../constants';

interface UIOverlayProps {
  stats: CityStats;
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  currentGoal: AIGoal | null;
  newsFeed: NewsItem[];
  onClaimReward: () => void;
  isGeneratingGoal: boolean;
  aiEnabled: boolean;
  
  // Portfolio Props
  activeCheckpoint: PortfolioCheckpoint | null;
  onContinueCycle: () => void;
  onRestart: () => void;
}

const tools = [
  BuildingType.None,
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Park,
];

const ToolButton: React.FC<{
  type: BuildingType;
  isSelected: boolean;
  onClick: () => void;
}> = ({ type, isSelected, onClick }) => {
  const config = BUILDINGS[type];
  const isBulldoze = type === BuildingType.None;
  
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center rounded-xl transition-all duration-200
        w-16 h-16 md:w-20 md:h-20 flex-shrink-0
        ${isSelected ? 'bg-white/20 ring-2 ring-white scale-105 z-10 shadow-lg' : 'bg-black/40 hover:bg-black/60'}
        backdrop-blur-md border border-white/10 cursor-pointer
      `}
      title={config.description}
    >
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-md shadow-inner flex items-center justify-center mb-1" style={{ backgroundColor: isBulldoze ? 'transparent' : config.color }}>
        {isBulldoze && <div className="text-red-500 text-3xl font-bold">✕</div>}
        {type === BuildingType.Road && <div className="w-full h-3 bg-gray-800 transform -rotate-45"></div>}
      </div>
      
      <div className="flex flex-col items-center leading-none">
        <span className="text-[10px] font-bold text-white uppercase tracking-wider shadow-black drop-shadow-md">{config.name}</span>
      </div>
    </button>
  );
};

// --- Portfolio Reflection Card (Simple, Transparent, Elegant) ---
const PortfolioCard: React.FC<{ checkpoint: PortfolioCheckpoint, onContinue: () => void }> = ({ checkpoint, onContinue }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-8 px-4 animate-fade-in-up">
        {/* Simple Glass Card - Increased Transparency */}
        <div className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto flex flex-col">
            
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-white/80 text-xs font-medium uppercase tracking-widest mb-1 block shadow-black drop-shadow-sm">
                            Checkpoint {checkpoint.id + 1}
                        </span>
                        <h2 className="text-3xl font-light text-white tracking-tight drop-shadow-md">{checkpoint.title}</h2>
                    </div>
                </div>

                <div className="space-y-6">
                    {checkpoint.projects.map((project, idx) => (
                        <div key={idx} className="bg-black/20 rounded-lg p-5 border border-white/5 hover:bg-black/30 transition-colors">
                            <h3 className="text-white font-medium text-lg mb-2 drop-shadow-sm">{project.title}</h3>
                            <p className="text-slate-100 text-sm font-light leading-relaxed drop-shadow-sm">{project.content}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={onContinue}
                        className="px-8 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium rounded-full transition-all flex items-center gap-2 tracking-wide backdrop-blur-sm shadow-lg"
                    >
                        <span>Continue</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
  )
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  selectedTool,
  onSelectTool,
  activeCheckpoint,
  onContinueCycle,
  onRestart
}) => {
  
  return (
    <>
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-sans z-10 overflow-hidden">
        
        {/* --- Header --- */}
        <div className="w-full flex justify-between items-start pt-4 pointer-events-auto">
             {/* Title */}
             <div className="bg-black/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 shadow-lg">
                <h1 className="text-xl font-bold text-white uppercase tracking-widest text-center">
                    DUY LE PORTFOLIO - ECEG 431
                </h1>
            </div>

            {/* Restart Button (Top Right) */}
            <button 
                onClick={onRestart}
                className="group bg-black/20 hover:bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/10 transition-all hover:scale-105 active:scale-95 shadow-lg"
                title="Restart Cycle"
            >
                 <svg className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
            </button>
        </div>

        {/* --- Footer (Hide if card is active) --- */}
        {!activeCheckpoint && (
            <div className="flex flex-col-reverse md:flex-row items-end justify-between w-full pointer-events-auto gap-4 pb-2 animate-fade-in-up">
                
                {/* Build Toolbar */}
                <div className="bg-black/60 p-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl flex gap-2 overflow-x-auto mx-auto md:mx-0">
                    {tools.map((type) => (
                        <ToolButton
                            key={type}
                            type={type}
                            isSelected={selectedTool === type}
                            onClick={() => onSelectTool(type)}
                        />
                    ))}
                </div>

                {/* Stats Minimal */}
                <div className="flex gap-4 bg-black/60 text-white p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl ml-auto">
                    <div className="flex flex-col px-2 border-r border-white/10">
                        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">Funds</span>
                        <span className="text-lg font-bold text-green-400 font-mono">∞</span>
                    </div>
                    <div className="flex flex-col px-2">
                        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">Citizens</span>
                        <span className="text-lg font-bold text-blue-300 font-mono">{stats.population.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        )}
        </div>

        {/* --- Portfolio Card Overlay --- */}
        {activeCheckpoint && (
            <PortfolioCard checkpoint={activeCheckpoint} onContinue={onContinueCycle} />
        )}
    </>
  );
};

export default UIOverlay;