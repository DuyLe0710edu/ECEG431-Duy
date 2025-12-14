/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { BuildingConfig, BuildingType, PortfolioCheckpoint } from './types';

// Map Settings
export const GRID_SIZE = 15;

// Game Settings
export const TICK_RATE_MS = 2000; // Game loop updates every 2 seconds
export const INITIAL_MONEY = 999999999; // Infinite Money

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  [BuildingType.None]: {
    type: BuildingType.None,
    cost: 0,
    name: 'Bulldoze',
    description: 'Clear a tile',
    color: '#ef4444', // Red X
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Road]: {
    type: BuildingType.Road,
    cost: 10,
    name: 'Road',
    description: 'Connects buildings.',
    color: '#374151', // Dark Grey
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Residential]: {
    type: BuildingType.Residential,
    cost: 100,
    name: 'House',
    description: '+5 Pop/day',
    color: '#38bdf8', // Sky-400
    popGen: 5,
    incomeGen: 0,
  },
  [BuildingType.Commercial]: {
    type: BuildingType.Commercial,
    cost: 200,
    name: 'Shop',
    description: '+$15/day',
    color: '#60a5fa', // Blue-400
    popGen: 0,
    incomeGen: 15,
  },
  [BuildingType.Industrial]: {
    type: BuildingType.Industrial,
    cost: 400,
    name: 'Factory',
    description: '+$40/day',
    color: '#475569', // Slate-600 (Was Yellow)
    popGen: 0,
    incomeGen: 40,
  },
  [BuildingType.Park]: {
    type: BuildingType.Park,
    cost: 50,
    name: 'Park',
    description: 'Looks nice.',
    color: '#22d3ee', // Cyan-400
    popGen: 1,
    incomeGen: 0,
  },
};

export const PORTFOLIO_CONTENT: PortfolioCheckpoint[] = [
  {
    id: 0,
    title: "Foundations: Logic & Arithmetic",
    projects: [
      {
        title: "Project 1 (Boolean Logic)",
        content: "Building the basic gates from Nand made me realize how every “smart” operation is just combinations of simple logic. The hardest part was debugging tiny wiring mistakes, because one wrong connection breaks everything."
      },
      {
        title: "Project 2 (Boolean Arithmetic)",
        content: "Creating adders and the ALU connected directly to what I learned about binary math and CPU design. I struggled most with keeping track of control bits and verifying edge cases like overflow and negative numbers."
      }
    ]
  },
  {
    id: 1,
    title: "Sequential Logic & Machine Code",
    projects: [
      {
        title: "Project 3 (Sequential Logic)",
        content: "This project helped me understand memory: how a computer “remembers” using registers and clocked components. The tricky part was thinking in time steps (clock cycles) instead of only pure combinational logic."
      },
      {
        title: "Project 4 (Machine Language)",
        content: "Writing Hack assembly programs showed me how low-level code really controls the machine (registers, RAM, jumps). It was frustrating at first because one small addressing mistake can silently produce wrong behavior."
      }
    ]
  },
  {
    id: 2,
    title: "Architecture & Assembly",
    projects: [
      {
        title: "Project 5 (Computer Architecture)",
        content: "Putting CPU + memory + ROM together felt like the first moment the computer became “real.” I learned the importance of clean interfaces, and I struggled with debugging because errors could come from many connected components."
      },
      {
        title: "Project 6 (Assembler)",
        content: "Implementing an assembler taught me how symbolic code becomes binary instructions, and why translation rules must be exact. The biggest challenge was handling symbols/labels correctly and keeping the two-pass logic organized."
      }
    ]
  },
  {
    id: 3,
    title: "Virtual Machine: The Stack",
    projects: [
      {
        title: "Project 7 (VM I: Stack Arithmetic / Memory Access)",
        content: "This project connected to compiler ideas: higher-level commands expanded into many assembly instructions. The hard part was segment addressing (local/argument/this/that) and getting push/pop correct in every case."
      },
      {
        title: "Project 8 (VM II: Program Control / Function Calls)",
        content: "I learned how function calls are really stack-frame management plus jumps, which made recursion feel much less “magical.” Debugging return addresses and saving/restoring state was the most painful part."
      }
    ]
  },
  {
    id: 4,
    title: "High-Level Language & Compilation",
    projects: [
      {
        title: "Project 9 (High-Level Language)",
        content: "Writing programs in Jack showed how much easier high-level constructs are compared to assembly/VM. I struggled mostly with designing clean program structure and using the provided OS library correctly."
      },
      {
        title: "Project 10 (Compiler I: Syntax Analysis)",
        content: "Building the tokenizer and parser helped me see how grammar rules become code (recursive descent), and how token lookahead drives decisions. The most frustrating part was matching the XML output format exactly and tracking token flow carefully."
      },
      {
        title: "Project 11 (Compiler II: Code Generation)",
        content: "Adding a symbol table and VM code generation made the compiler feel complete: now the code actually runs, not just “parses.” The hardest part was mapping variables to the right VM segments and generating correct control-flow labels for if/while."
      }
    ]
  }
];