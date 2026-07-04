"use client";

import React, { useState, useMemo } from "react";
import { useDevMemory } from "@/context/dev-memory-context";
import {
  Database,
  Calendar,
  Layers,
  Trash2,
  AlertTriangle,
  Search,
  Activity,
  Code,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export default function MemoryDashboard() {
  const { datasets, stats, deleteDataset } = useDevMemory();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [showConfirmId, setShowConfirmId] = useState<string | null>(null);

  const filteredDatasets = useMemo(() => {
    return datasets.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [datasets, searchQuery]);

  // Set initial selected dataset if not set and datasets exist
  const activeDataset = useMemo(() => {
    if (selectedDatasetId) {
      return datasets.find((d) => d.id === selectedDatasetId);
    }
    return datasets[0];
  }, [datasets, selectedDatasetId]);

  // SVG Memory Graph layout generator
  const graphData = useMemo(() => {
    const centerX = 350;
    const centerY = 200;
    const radius = 130;
    const datasetNodes = datasets.map((d, index) => {
      const angle = (index * 2 * Math.PI) / datasets.length;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Generate satellite file nodes for each dataset node
      const filesCount = d.files.length;
      const fileNodes = d.files.map((file, fIdx) => {
        const fAngle = angle + ((fIdx - (filesCount - 1) / 2) * 0.4);
        const fx = x + Math.cos(fAngle) * 45;
        const fy = y + Math.sin(fAngle) * 45;
        return {
          id: `${d.id}-file-${fIdx}`,
          name: file,
          x: fx,
          y: fy,
        };
      });

      return {
        id: d.id,
        name: d.name,
        nodeCount: d.nodeCount,
        x,
        y,
        fileNodes,
      };
    });

    return {
      centerX,
      centerY,
      datasetNodes,
    };
  }, [datasets]);

  const handleDelete = (id: string) => {
    deleteDataset(id);
    setShowConfirmId(null);
    if (selectedDatasetId === id) {
      setSelectedDatasetId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a1a1a] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Memory <span className="text-[#00ff88]">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Audit memory health index, map relational files, and purge outdated codebase context.
          </p>
        </div>
      </div>

      {/* Memory Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-[#1a1a1a] p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-semibold">
              FILES INDEXED IN MEMORY
            </span>
            <div className="text-3xl font-black text-white font-mono">
              {stats.totalFiles}
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              Aggregated across codebases
            </span>
          </div>
          <Code className="w-10 h-10 text-[#00ff88]/30 absolute right-6 bottom-6" />
        </div>

        <div className="bg-[#111] border border-[#1a1a1a] p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-semibold">
              TOTAL COMPLETED AUDITS
            </span>
            <div className="text-3xl font-black text-white font-mono">
              {stats.totalReviews}
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              Reviews ran since creation
            </span>
          </div>
          <Activity className="w-10 h-10 text-[#00ff88]/30 absolute right-6 bottom-6" />
        </div>

        <div className="bg-[#111] border border-[#1a1a1a] p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-semibold">
              MEMORY HEALTH SCORE
            </span>
            <div className="text-3xl font-black text-[#00ff88] font-mono">
              {stats.memoryHealth}%
            </div>
            <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00ff88]" />
              Safe and stable operation
            </span>
          </div>
          <Cpu className="w-10 h-10 text-[#00ff88]/30 absolute right-6 bottom-6 animate-pulse-slow" />
        </div>
      </div>

      {/* Interactive Visualizer & Inspect Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Interactive Graph Box */}
        <div className="lg:col-span-8 bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-xl flex flex-col h-[500px]">
          <div className="p-4 border-b border-[#1a1a1a] bg-[#0c0c0c] flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00ff88]" />
              SEMANTIC KNOWLEDGE GRAPH (INTERACTIVE)
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              Click nodes to inspect semantic contents
            </span>
          </div>

          <div className="flex-1 bg-[#050505] relative overflow-hidden flex items-center justify-center p-4">
            {datasets.length === 0 ? (
              <div className="text-gray-600 font-mono text-sm italic">
                Graph database empty. Ingest code to populate nodes.
              </div>
            ) : (
              <svg
                viewBox="0 0 700 400"
                className="w-full h-full select-none"
              >
                <defs>
                  <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00ff88" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Ambient Center Glow */}
                <circle
                  cx={graphData.centerX}
                  cy={graphData.centerY}
                  r="140"
                  fill="url(#glowGrad)"
                />

                {/* Central Kernel Node */}
                <circle
                  cx={graphData.centerX}
                  cy={graphData.centerY}
                  r="24"
                  className="fill-[#111] stroke-[#00ff88] stroke-2 shadow-[0_0_15px_#00ff88]"
                />
                <circle
                  cx={graphData.centerX}
                  cy={graphData.centerY}
                  r="6"
                  className="fill-[#00ff88] animate-ping"
                />
                <text
                  x={graphData.centerX}
                  y={graphData.centerY + 5}
                  textAnchor="middle"
                  className="fill-[#00ff88] font-mono text-[9px] font-bold pointer-events-none"
                >
                  CORE
                </text>

                {/* Edges: Center to Datasets, and Datasets to Files */}
                {graphData.datasetNodes.map((node) => (
                  <g key={`edges-${node.id}`}>
                    {/* Core to Dataset link */}
                    <line
                      x1={graphData.centerX}
                      y1={graphData.centerY}
                      x2={node.x}
                      y2={node.y}
                      className="stroke-[#222] stroke-1"
                      strokeDasharray="4 4"
                    />

                    {/* Active pulse flow on edge */}
                    <line
                      x1={graphData.centerX}
                      y1={graphData.centerY}
                      x2={node.x}
                      y2={node.y}
                      className="stroke-[#00ff88] stroke-1 opacity-40"
                      strokeDasharray="20 180"
                      strokeDashoffset="0"
                      style={{
                        animation: "dash 5s linear infinite",
                      }}
                    />

                    {/* Dataset to File link */}
                    {node.fileNodes.map((fNode) => (
                      <line
                        key={`edge-file-${fNode.id}`}
                        x1={node.x}
                        y1={node.y}
                        x2={fNode.x}
                        y2={fNode.y}
                        className="stroke-[#1d1d1d] stroke-[0.75]"
                      />
                    ))}
                  </g>
                ))}

                {/* Node Groups */}
                {graphData.datasetNodes.map((node) => {
                  const isSelected = activeDataset?.id === node.id;
                  return (
                    <g key={node.id} className="cursor-pointer">
                      {/* Dataset satellites file nodes */}
                      {node.fileNodes.map((fNode) => (
                        <g key={fNode.id} className="pointer-events-none">
                          <circle
                            cx={fNode.x}
                            cy={fNode.y}
                            r="4"
                            className="fill-[#111] stroke-[#555] stroke-[0.5]"
                          />
                          <text
                            x={fNode.x}
                            y={fNode.y - 7}
                            textAnchor="middle"
                            className="fill-gray-500 font-mono text-[7px] pointer-events-none"
                          >
                            {fNode.name}
                          </text>
                        </g>
                      ))}

                      {/* Main Dataset Node */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="18"
                        onClick={() => setSelectedDatasetId(node.id)}
                        className={`transition-all duration-300 ${
                          isSelected
                            ? "fill-[#00ff88]/10 stroke-[#00ff88] stroke-2 shadow-[0_0_15px_#00ff88]"
                            : "fill-[#111] stroke-gray-600 hover:stroke-[#00ff88]"
                        }`}
                      />
                      <text
                        x={node.x}
                        y={node.y + 4}
                        onClick={() => setSelectedDatasetId(node.id)}
                        textAnchor="middle"
                        className={`font-mono text-[8px] font-semibold transition-colors duration-300 pointer-events-none ${
                          isSelected ? "fill-[#00ff88]" : "fill-gray-300"
                        }`}
                      >
                        DB
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 30}
                        textAnchor="middle"
                        className={`font-mono text-[9px] font-bold transition-colors duration-300 ${
                          isSelected ? "fill-[#00ff88]" : "fill-gray-400"
                        }`}
                      >
                        {node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Right Column: Node Inspector Panel */}
        <div className="lg:col-span-4 bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-xl flex flex-col h-[500px]">
          <div className="p-4 border-b border-[#1a1a1a] bg-[#0c0c0c] flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 font-semibold">
              KNOWLEDGE NODE INSPECTOR
            </span>
          </div>

          <div className="p-6 flex-grow flex flex-col justify-between overflow-y-auto">
            {activeDataset ? (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                    MODULE NAME
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {activeDataset.name}
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono mt-0.5 block truncate">
                    {activeDataset.url || "Manually Uploaded"}
                  </span>
                </div>

                <div className="bg-[#0b0b0b] border border-[#1a1a1a] p-4 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Date Logged:</span>
                    <span className="text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#00ff88]" />
                      {activeDataset.dateAdded}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Vector Nodes:</span>
                    <span className="text-gray-300 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#00ff88]" />
                      {activeDataset.nodeCount} vectors
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                    Node Description
                  </span>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {activeDataset.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                    Source Files Embedded ({activeDataset.files.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {activeDataset.files.map((file) => (
                      <span
                        key={file}
                        className="text-[10px] font-mono bg-[#161616] text-gray-300 px-2.5 py-1 rounded border border-[#222]"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm text-center py-12">
                No active memory nodes found. Ingest files to inspect mapping.
              </div>
            )}

            {activeDataset && (
              <div className="pt-6 border-t border-[#1a1a1a]">
                {showConfirmId === activeDataset.id ? (
                  <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-xl space-y-3 animate-fade-in">
                    <div className="text-xs text-red-300 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                      Purge codebase memory? This cannot be undone.
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(activeDataset.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded"
                      >
                        Confirm Purge
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmId(null)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold py-1.5 px-3 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmId(activeDataset.id)}
                    className="w-full flex items-center justify-center gap-2 bg-[#1b1414] border border-red-500/20 text-red-400 text-xs font-semibold py-2 px-4 rounded-lg hover:bg-red-500/10 hover:border-red-500/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Forget Codebase Context
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dataset Grid Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-[#00ff88]" />
            Stored Codebase Memory List
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search codebases..."
              className="w-full bg-[#111] border border-[#222] hover:border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#00ff88]/60 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((dataset) => {
            const isSelected = activeDataset?.id === dataset.id;
            return (
              <div
                key={dataset.id}
                onClick={() => setSelectedDatasetId(dataset.id)}
                className={`bg-[#111] border rounded-2xl p-5 space-y-4 transition-all duration-300 cursor-pointer hover:shadow-lg relative overflow-hidden group ${
                  isSelected
                    ? "border-[#00ff88] bg-[#121413] shadow-[0_4px_25px_-5px_rgba(0,255,136,0.08)]"
                    : "border-[#1a1a1a] hover:border-[#00ff88]/30 hover:bg-[#131313]"
                }`}
              >
                {/* Visual indicator corner ribbon */}
                <div className={`absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 rotate-45 transition-all duration-300 opacity-20 group-hover:opacity-40 ${
                  isSelected ? "bg-[#00ff88]" : "bg-gray-500"
                }`} />

                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors">
                      {dataset.name}
                    </h3>
                    <span className="text-[10px] text-gray-500 font-mono block truncate max-w-[180px]">
                      {dataset.url || "Local Upload"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 bg-[#161616] px-2 py-0.5 rounded border border-[#222]">
                    {dataset.nodeCount} nodes
                  </span>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed h-8">
                  {dataset.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono border-t border-[#1a1a1a] pt-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#00ff88]" />
                    {dataset.dateAdded}
                  </span>
                  <span className="text-[#00ff88] text-[9px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    Inspect Node
                  </span>
                </div>
              </div>
            );
          })}

          {filteredDatasets.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 border border-dashed border-[#222] rounded-2xl">
              No matching memory repositories found.
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -200;
          }
        }
      `}</style>
    </div>
  );
}
