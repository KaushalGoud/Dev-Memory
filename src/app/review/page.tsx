"use client";

import React, { useState } from "react";
import { useDevMemory } from "@/context/dev-memory-context";
import {
  Cpu,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Play,
  RotateCcw,
  Sparkles,
  Database,
  Code2,
} from "lucide-react";

export default function ReviewPage() {
  const {
    datasets,
    reviews,
    addReview,
    updateReviewFeedback,
  } = useDevMemory();

  const [codeToReview, setCodeToReview] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState("");

  const selectedReview = reviews.find((r) => r.id === selectedReviewId) || reviews[0];

  const presets = [
    {
      name: "Prisma Connection Leak",
      desc: "Simulates database connection issues",
      code: `// prisma-repository.ts
import { PrismaClient } from '@prisma/client';

export class UserRepository {
  async findActiveUsers() {
    const prisma = new PrismaClient(); // Initialized inline
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
    });
    // prisma.$disconnect() never called
    return users;
  }
}`,
    },
    {
      name: "Raw Query Concatenation",
      desc: "SQL injection risk on profile paths",
      code: `// express-user-routes.ts
import { Router } from 'express';
import { db } from '../database';

const router = Router();
router.delete('/users/purge/:email', async (req, res) => {
  const sql = \`DELETE FROM users WHERE email = '\${req.params.email}'\`;
  const result = await db.query(sql); // Direct raw execution
  return res.json({ deleted: true, count: result.rowCount });
});`,
    },
    {
      name: "JWT Sign Inlined Key",
      desc: "OAuth/Token authentication secrets leak",
      code: `// token-factory.ts
import jwt from 'jsonwebtoken';

export function generateAccessToken(userId: string) {
  // Signing token with client secret hardcoded inline
  return jwt.sign(
    { sub: userId, role: 'developer' },
    'temp-super-secret-key-1234!',
    { expiresIn: '30m' }
  );
}`,
    },
  ];

  const runReview = async () => {
    if (!codeToReview.trim()) return;

    setShowScanner(true);
    setScanProgress(0);

    const scanSteps = [
      "Retrieving past codebase memory nodes...",
      "Mapping syntax structures to historical context...",
      "Cross-referencing past PR bugs database...",
      "Running memory-informed static code analysis...",
      "Structuring AI review report...",
    ];

    // Simulate progress scanning animation
    for (let i = 0; i <= 100; i += 2) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      setScanProgress(i);
      
      const stepIdx = Math.min(
        Math.floor((i / 100) * scanSteps.length),
        scanSteps.length - 1
      );
      setScanStep(scanSteps[stepIdx]);
    }

    try {
      const review = await addReview(codeToReview);
      setSelectedReviewId(review.id);
    } catch (e) {
      console.error(e);
    } finally {
      setShowScanner(false);
    }
  };

  const handleFeedback = (reviewId: string, type: "up" | "down") => {
    updateReviewFeedback(reviewId, type);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a1a1a] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Review with <span className="text-[#00ff88]">Memory</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Compare incoming code diffs or pull requests against permanent codebase memory.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#00ff88]/30 bg-[#00ff88]/5 text-xs text-[#00ff88] font-mono font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          CONTEXTUAL ENGINE ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Code input area & Presets */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-semibold px-1">
              Select Preset Bug Snippet
            </span>
            <div className="grid grid-cols-3 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setCodeToReview(preset.code)}
                  className="bg-[#111] border border-[#1a1a1a] hover:border-[#00ff88]/40 hover:bg-[#151515] p-3 rounded-xl text-left transition-all group"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-[#00ff88] truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 leading-tight">
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Code Editor Box */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-xl relative">
            <div className="p-4 border-b border-[#1a1a1a] bg-[#0c0c0c] flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400 font-semibold flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#00ff88]" />
                SOURCE CODE / PR DIFF INPUT
              </span>
              <button
                type="button"
                onClick={() => setCodeToReview("")}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors font-mono flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            </div>

            <div className="relative">
              {/* Glowing scanning indicator */}
              {showScanner && (
                <div
                  className="absolute left-0 w-full h-[3px] bg-[#00ff88] shadow-[0_0_15px_4px_#00ff88] opacity-70 pointer-events-none transition-all duration-300 ease-out"
                  style={{ top: `${scanProgress}%` }}
                />
              )}

              <textarea
                value={codeToReview}
                onChange={(e) => setCodeToReview(e.target.value)}
                placeholder="// Paste PR diff or a file to check against memory..."
                rows={18}
                disabled={showScanner}
                className="w-full bg-[#050505] p-4 text-xs font-mono text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/30 resize-none leading-relaxed select-text"
              />
            </div>

            <div className="p-4 border-t border-[#1a1a1a] bg-[#0c0c0c] flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-mono">
                {codeToReview.split("\n").filter(Boolean).length} lines detected
              </span>
              <button
                type="button"
                onClick={runReview}
                disabled={showScanner || !codeToReview.trim()}
                className="flex items-center gap-2 bg-[#00ff88] text-black font-semibold text-xs py-2 px-4 rounded-lg hover:bg-[#00ff88]/90 transition-all shadow-[0_0_15px_rgba(0,255,136,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {showScanner ? "Reviewing..." : "Review with Memory"}
              </button>
            </div>
          </div>

          {/* Scanner Simulation Modal Overlays */}
          {showScanner && (
            <div className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-xl p-4 flex flex-col gap-3 animate-pulse">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#00ff88] font-bold">
                  {scanStep}
                </span>
                <span className="text-xs font-mono text-gray-400">{scanProgress}%</span>
              </div>
              <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#00ff88] h-full rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Review Result Display */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-xl flex flex-col h-full min-h-[500px]">
            <div className="p-4 border-b border-[#1a1a1a] bg-[#0c0c0c] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
<Cpu className="w-[18px] h-[18px] text-[#00ff88]" />
                MEMORY-INFORMED AUDIT REPORT
              </h2>
              {selectedReview && (
                <div className="flex gap-2">
                  {reviews.map((r, index) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReviewId(r.id)}
                      className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-mono border transition-all ${
                        selectedReview.id === r.id
                          ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30 shadow-sm"
                          : "bg-transparent text-gray-500 border-[#222] hover:text-gray-300"
                      }`}
                      title={r.summary}
                    >
                      #{reviews.length - index}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedReview ? (
              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                
                {/* Audit Header */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                      Audit Summary
                    </span>
                    <h3 className="text-base font-bold text-white mt-1 leading-snug">
                      {selectedReview.summary}
                    </h3>
                  </div>

                  {/* Context Cards pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                      Memory Context Retrieved
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedReview.contextUsed.map((ctx) => {
                        const matchedData = datasets.find((d) => d.id === ctx);
                        return (
                          <div
                            key={ctx}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#222] bg-[#161616] text-xs font-mono text-gray-300"
                          >
                            <Database className="w-3.5 h-3.5 text-[#00ff88]" />
                            {matchedData?.name || ctx}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bullet points list */}
                  <div className="space-y-2 pt-2 border-t border-[#1a1a1a]">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">
                      AI Findings
                    </span>
                    <ul className="space-y-2">
                      {selectedReview.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
                          <span className="text-[#00ff88] mt-1 text-sm font-mono">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-[#1a1a1a]">
                  {/* Past similar bugs warning */}
                  {selectedReview.pastBugsWarning && (
                    <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold uppercase tracking-wider">
                        <ShieldAlert className="w-4.5 h-4.5" />
                        RECURRING BUG WARNING
                      </div>
                      <p className="text-xs text-red-300/90 leading-relaxed font-mono">
                        {selectedReview.pastBugsWarning}
                      </p>
                    </div>
                  )}

                  {/* Feedback widget */}
                  <div className="bg-[#0e0e0e] border border-[#1e1e1e] p-3.5 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono">
                      Did this review leverage codebase memory effectively?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleFeedback(selectedReview.id, "up")}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${
                          selectedReview.feedback === "up"
                            ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/40 shadow-[0_0_10px_rgba(0,255,136,0.15)]"
                            : "bg-[#181818] border-[#222] text-gray-400 hover:text-gray-200 hover:border-[#333]"
                        }`}
                        title="Yes, memory match was accurate"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(selectedReview.id, "down")}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${
                          selectedReview.feedback === "down"
                            ? "bg-red-950/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                            : "bg-[#181818] border-[#222] text-gray-400 hover:text-gray-200 hover:border-[#333]"
                        }`}
                        title="No, mismatch or incorrect context"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center flex-1 space-y-3">
                <ShieldAlert className="w-8 h-8 text-gray-600" />
                <p className="text-sm">Awaiting review execution logs.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
