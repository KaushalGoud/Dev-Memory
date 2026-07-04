"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDevMemory } from "@/context/dev-memory-context";
import {
  Upload,
  Link as LinkIcon,
  Database,
  Cpu,
  FileCode,
  Terminal as TerminalIcon,
  CheckCircle,
  AlertCircle,
  GitBranch,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const {
    datasets,
    reviews,
    stats,
    addDataset,
    isIngesting,
    ingestionLog,
  } = useDevMemory();

  const [datasetName, setDatasetName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs to bottom during ingestion
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ingestionLog]);

  const handleRemember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetName.trim()) {
      setErrorMsg("Please provide a name for this codebase/dataset.");
      return;
    }
    if (!repoUrl.trim() && !codeContent.trim()) {
      setErrorMsg("Please provide either a GitHub Repository URL or paste some code.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg(false);
    
    try {
      await addDataset(datasetName.trim(), repoUrl.trim(), codeContent.trim());
      setSuccessMsg(true);
      setDatasetName("");
      setRepoUrl("");
      setCodeContent("");
      setTimeout(() => setSuccessMsg(false), 5000);
    } catch {
      setErrorMsg("An error occurred during codebase ingestion.");
    }
  };

  const loadSampleCode = () => {
    setDatasetName("payment-gateway");
    setRepoUrl("github.com/devmemory/payment-gateway");
    setCodeContent(`// payment.controller.ts
import { Request, Response } from 'express';
import { StripeService } from '../services/stripe.service';

export async function processPayment(req: Request, res: Response) {
  const { amount, currency, token } = req.body;
  try {
    const charge = await StripeService.createCharge(amount, currency, token);
    return res.status(200).json({ success: true, chargeId: charge.id });
  } catch (error: any) {
    // Missing structured logging or error masking
    return res.status(500).json({ error: error.message });
  }
}`);
  };

  const latestReview = reviews[0]; // most recent review

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a1a1a] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            System <span className="text-[#00ff88]">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Build and feed DevMemory&apos;s persistent vector space with your project configurations.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#111] border border-[#222] px-4 py-2 rounded-xl">
          <GitBranch className="w-4 h-4 text-[#00ff88]" />
          <span className="text-xs text-gray-300 font-mono">
            CONNECTED TO LOCAL GRAPH DB
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Code Upload Form & Ingestion Logger */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#1a1a1a] bg-[#0c0c0c] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#00ff88]" />
                Ingest Codebase Memory
              </h2>
              <button
                type="button"
                onClick={loadSampleCode}
                className="text-xs text-[#00ff88] hover:text-[#00ff88]/80 transition-colors font-mono border border-[#00ff88]/20 bg-[#00ff88]/5 px-2.5 py-1 rounded"
              >
                Load Mock Code
              </button>
            </div>

            <form onSubmit={handleRemember} className="p-6 space-y-5">
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-xs">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Codebase successfully mapped to permanent memory nodes!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 font-semibold block">
                    CODEBASE IDENTIFIER
                  </label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="e.g. payment-gateway"
                    disabled={isIngesting}
                    className="w-full bg-[#161616] border border-[#222] rounded-lg px-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#00ff88]/60 transition-colors disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-400 font-semibold block">
                    GITHUB REPOSITORY URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="github.com/org/repo"
                      disabled={isIngesting}
                      className="w-full bg-[#161616] border border-[#222] rounded-lg pl-9 pr-3.5 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#00ff88]/60 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-400 font-semibold block">
                  PASTE SOURCE CODE (ALTERNATIVE OR ADDITIONAL REFERENCE)
                </label>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="// Paste files, configurations, or key module structures..."
                  disabled={isIngesting}
                  rows={8}
                  className="w-full bg-[#161616] border border-[#222] rounded-lg p-3.5 text-xs text-gray-300 font-mono focus:outline-none focus:border-[#00ff88]/60 transition-colors disabled:opacity-50 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isIngesting}
                className="w-full flex items-center justify-center gap-2 bg-[#00ff88] text-black font-semibold text-sm py-2.5 px-4 rounded-lg hover:bg-[#00ff88]/90 transition-colors shadow-[0_4px_20px_-5px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Database className="w-4 h-4" />
                {isIngesting ? "Synthesizing Memory Nodes..." : "Remember This Codebase"}
              </button>
            </form>
          </div>

          {/* Terminal logger simulator */}
          <div className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-xl overflow-hidden shadow-lg font-mono">
            <div className="bg-[#121212] px-4 py-2 border-b border-[#1c1c1c] flex items-center justify-between">
              <span className="text-[11px] text-gray-400 flex items-center gap-2 font-semibold">
                <TerminalIcon className="w-3.5 h-3.5 text-[#00ff88]" />
                INGESTION ENGINE SYSTEM LOGS
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
            </div>
            <div className="p-4 bg-[#050505] text-xs h-40 overflow-y-auto space-y-1.5 scrollbar-thin text-gray-400">
              {ingestionLog.length === 0 ? (
                <div className="text-gray-600 flex items-center justify-center h-full italic">
                  Awaiting ingestion trigger... Ingest a codebase to visualize node synthesis steps.
                </div>
              ) : (
                ingestionLog.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.includes("Ingested") ? "text-[#00ff88] font-bold" : ""
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
              {isIngesting && (
                <div className="text-[#00ff88] flex items-center gap-1">
                  <span>Processing vector chunks</span>
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:0.2s]">.</span>
                  <span className="animate-bounce [animation-delay:0.4s]">.</span>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Latest Review & Stats */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Latest Review Card */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#1a1a1a] bg-[#0c0c0c] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#00ff88]" />
                Latest AI Review
              </h2>
              {latestReview && (
                <span className={`text-[10px] font-mono tracking-wider uppercase font-semibold px-2 py-0.5 rounded border ${
                  latestReview.status === 'resolved'
                    ? 'text-[#00ff88] border-[#00ff88]/20 bg-[#00ff88]/5'
                    : 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'
                }`}>
                  {latestReview.status}
                </span>
              )}
            </div>
            <div className="p-6">
              {latestReview ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                      SUMMARY
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-1 leading-snug">
                      {latestReview.summary}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-[#161616] p-3 rounded-lg border border-[#222]">
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">
                        DATE REVIEWED
                      </span>
                      <span className="text-xs font-medium text-gray-300 font-mono">
                        {latestReview.date}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">
                        CONTEXT RETRIEVED
                      </span>
                      <span className="text-xs font-medium text-[#00ff88] font-mono">
                        {latestReview.contextUsed.join(", ")}
                      </span>
                    </div>
                  </div>

                  {latestReview.pastBugsWarning && (
                    <div className="p-3 bg-red-950/15 border border-red-500/20 rounded-lg text-xs text-red-300 leading-relaxed font-mono">
                      <span className="text-red-400 font-semibold block mb-1">
                        ⚠️ Recurring Bug Warning:
                      </span>
                      {latestReview.pastBugsWarning}
                    </div>
                  )}

                  <Link
                    href="/review"
                    className="inline-flex items-center gap-1.5 text-xs text-[#00ff88] hover:underline font-semibold font-mono"
                  >
                    View review report
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="text-gray-500 text-sm text-center py-8">
                  No review reports found. Paste code in the Review page to trigger.
                </div>
              )}
            </div>
          </div>

          {/* Quick Memory Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            
            <div className="bg-[#111] border border-[#1a1a1a] p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-mono text-gray-400 tracking-wider">
                  MEMORY NODES
                </span>
                <Cpu className="w-4 h-4 text-[#00ff88]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-mono">
                  {stats.memoryNodesCount}
                </span>
                <span className="text-xs text-gray-500">nodes</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                <span className="text-[#00ff88]">+{datasets.length * 10}</span>
                <span>links active</span>
              </div>
            </div>

            <div className="bg-[#111] border border-[#1a1a1a] p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-mono text-gray-400 tracking-wider">
                  TOTAL REVIEWS
                </span>
                <TrendingUp className="w-4 h-4 text-[#00ff88]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-mono">
                  {stats.totalReviews}
                </span>
                <span className="text-xs text-gray-500">runs</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                <span className="text-[#00ff88]">{stats.memoryHealth}%</span>
                <span>satisfaction rate</span>
              </div>
            </div>

          </div>

          {/* Connected Repos Card List */}
          <div className="bg-[#111] border border-[#1a1a1a] p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-semibold font-mono text-gray-400 tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-[#00ff88]" />
              ACTIVE CODEBASE GRAPH DATASETS
            </h3>
            <div className="space-y-2.5">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between p-3 bg-[#151515] hover:bg-[#181818] transition-colors rounded-xl border border-[#222]"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-white">
                      {dataset.name}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {dataset.url || "Local Upload"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-300 font-mono block">
                      {dataset.nodeCount} nodes
                    </span>
                    <span className="text-[9px] text-[#00ff88] font-mono">
                      active memory
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/memory"
              className="inline-flex items-center gap-1.5 text-xs text-[#00ff88] hover:underline font-semibold font-mono"
            >
              Configure memory nodes
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
