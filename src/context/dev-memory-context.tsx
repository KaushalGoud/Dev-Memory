"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface MemoryDataset {
  id: string;
  name: string;
  url?: string;
  dateAdded: string;
  nodeCount: number;
  description: string;
  files: string[];
  code?:string[]
}

export interface CodeReview {
  id: string;
  code: string;
  summary: string;
  date: string;
  status: "resolved" | "open" | "warning";
  bullets: string[];
  contextUsed: string[];
  pastBugsWarning?: string;
  feedback?: "up" | "down" | null;
}

export interface MemoryStats {
  totalFiles: number;
  totalReviews: number;
  memoryNodesCount: number;
  memoryHealth: number; // Percentage
}

interface DevMemoryContextType {
  datasets: MemoryDataset[];
  reviews: CodeReview[];
  stats: MemoryStats;
  addDataset: (name: string, url: string, code: string) => Promise<void>;
  deleteDataset: (id: string) => void;
  addReview: (code: string) => Promise<CodeReview>;
  updateReviewFeedback: (id: string, feedback: "up" | "down") => void;
  isIngesting: boolean;
  isReviewing: boolean;
  ingestionLog: string[];
}

const DevMemoryContext = createContext<DevMemoryContextType | undefined>(undefined);

const initialDatasets: MemoryDataset[] = [
  {
    id: "auth-module",
    name: "auth-module",
    url: "github.com/devmemory/auth-module",
    dateAdded: "2026-06-15",
    nodeCount: 42,
    description: "Authenticates users via JWT, handles OAuth2 configuration, and controls route guards.",
    files: ["auth.service.ts", "jwt.strategy.ts", "oauth.controller.ts", "roles.guard.ts"],
  },
  {
    id: "database-layer",
    name: "database-layer",
    url: "github.com/devmemory/database-layer",
    dateAdded: "2026-06-20",
    nodeCount: 89,
    description: "Main database setup using Prisma, handles schema definitions, transactional locks, and connection pooling.",
    files: ["schema.prisma", "db.service.ts", "transaction.utils.ts", "pool.config.ts"],
  },
  {
    id: "api-routes",
    name: "api-routes",
    url: "github.com/devmemory/api-routes",
    dateAdded: "2026-06-28",
    nodeCount: 56,
    description: "Express/Next routing mapping endpoints for user profiles, dashboards, and reporting.",
    files: ["route.ts", "middleware.ts", "user.router.ts", "billing.ts"],
  },
];

const initialReviews: CodeReview[] = [
  {
    id: "rev-1",
    code: `// db.service.ts\nexport class DBService {\n  private client: any;\n  async connect() {\n    this.client = await createClient();\n  }\n}`,
    summary: "Potential database connection leak in db.service.ts helper",
    date: "2026-06-21",
    status: "resolved",
    bullets: [
      "No client.disconnect() found in DBService.",
      "Database connection pooling limits might be reached if multiple instances connect.",
      "Recommendation: implement a clean-up method or use Prisma connection sharing.",
    ],
    contextUsed: ["database-layer"],
    pastBugsWarning: "You made this mistake in PR #3 where a database pool leak caused an API outage in database-layer.",
    feedback: "up",
  },
  {
    id: "rev-2",
    code: `// auth.service.ts\nconst token = jwt.sign({ id }, 'secret');`,
    summary: "Hardcoded secret key in JWT token signing",
    date: "2026-06-16",
    status: "resolved",
    bullets: [
      "Hardcoded 'secret' is used for token signing.",
      "Highly vulnerable to reverse engineering and spoofed tokens.",
      "Recommendation: replace with process.env.JWT_SECRET.",
    ],
    contextUsed: ["auth-module"],
    pastBugsWarning: "In auth-module, private developer secrets were exposed in a previous commit and needed a rotational key migration.",
    feedback: null,
  },
  {
    id: "rev-3",
    code: `// user.router.ts\nrouter.get('/profile/:id', async (req, res) => {\n  const user = await db.query('SELECT * FROM users WHERE id = ' + req.params.id);\n});`,
    summary: "Critical SQL Injection risk on user profile endpoint",
    date: "2026-06-29",
    status: "warning",
    bullets: [
      "Raw string concatenation creates a high SQL Injection vulnerability.",
      "Any attacker can access arbitrary database tables by crafting the :id param.",
      "Recommendation: Use parameterized queries like db.query('SELECT * FROM users WHERE id = $1', [req.params.id]).",
    ],
    contextUsed: ["database-layer", "api-routes"],
    pastBugsWarning: "A similar raw query vulnerability was flagged in PR #12 database-layer changes which triggered a security review.",
    feedback: "down",
  },
];

export const DevMemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<MemoryDataset[]>([]);
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [ingestionLog, setIngestionLog] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Fetch initial state from FastAPI backend, fallback to localStorage/mock
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const dsRes = await fetch("/api/datasets");
        if (!dsRes.ok) throw new Error();
        const datasetsData = await dsRes.json();
        setDatasets(datasetsData);
      } catch {
        console.warn("Backend datasets API offline. Falling back to local storage.");
        const savedDatasets = localStorage.getItem("devmemory_datasets");
        setDatasets(savedDatasets ? JSON.parse(savedDatasets) : initialDatasets);
      }

      try {
        const revsRes = await fetch("/api/reviews");
        if (!revsRes.ok) throw new Error();
        const reviewsData = await revsRes.json();
        setReviews(reviewsData);
      } catch {
        console.warn("Backend reviews API offline. Falling back to local storage.");
        const savedReviews = localStorage.getItem("devmemory_reviews");
        setReviews(savedReviews ? JSON.parse(savedReviews) : initialReviews);
      }

      setHydrated(true);
    };

    fetchInitialData();
  }, []);

  // Save to LocalStorage helper for fallback states
  const saveDatasetsLocally = (newDatasets: MemoryDataset[]) => {
    localStorage.setItem("devmemory_datasets", JSON.stringify(newDatasets));
  };

  const saveReviewsLocally = (newReviews: CodeReview[]) => {
    localStorage.setItem("devmemory_reviews", JSON.stringify(newReviews));
  };

  // Add Dataset simulated ingestion & API submission
  const addDataset = async (name: string, url: string, code: string) => {
    setIsIngesting(true);
    setIngestionLog([]);

    const steps = [
      `Initializing ingestion for repository: ${url || "local-upload"}`,
      `Scanning source files for dataset: "${name}"`,
      "Creating AST (Abstract Syntax Trees) for code snippets...",
      "Resolving inter-file dependencies and functions imports...",
      "Generating code semantic chunks...",
      "Vectorizing chunk nodes with local LLM embedding model...",
      "Connecting semantic nodes into DevMemory database...",
      "Indexing memory nodes for pattern recognition...",
      `Dataset "${name}" successfully ingested into Memory!`,
    ];

    for (let i = 0; i < steps.length - 1; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setIngestionLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[i]}`]);
    }

    try {
      const res = await fetch("/api/remember", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, code }),
      });
      if (!res.ok) {
        const errDetail = await res.json();
        throw new Error(errDetail.detail || "Remember API error");
      }
      
      await res.json();

      setIngestionLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ${steps[steps.length - 1]}`,
      ]);

      // Refresh datasets from backend
      const dsRes = await fetch("/api/datasets");
      const datasetsData = await dsRes.json();
      setDatasets(datasetsData);
      saveDatasetsLocally(datasetsData);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to contact API";
      setIngestionLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ❌ Ingestion error: ${errMsg}`,
      ]);
      throw err;
    } finally {
      setIsIngesting(false);
    }
  };

  // Delete Dataset
  const deleteDataset = async (id: string) => {
    try {
      const res = await fetch(`/api/forget/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Forget API error");

      const dsRes = await fetch("/api/datasets");
      const datasetsData = await dsRes.json();
      setDatasets(datasetsData);
      saveDatasetsLocally(datasetsData);
    } catch {
      console.warn("Backend API forget endpoint error. Running local deletion.");
      const updated = datasets.filter((d) => d.id !== id);
      setDatasets(updated);
      saveDatasetsLocally(updated);
    }
  };

  // Run real code review against Cognee and GPT-4o-mini
  const addReview = async (code: string): Promise<CodeReview> => {
    setIsReviewing(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const errDetail = await res.json();
        throw new Error(errDetail.detail || "Review API error");
      }
      
      const newReview = await res.json();

      // Refresh reviews from backend
      const revsRes = await fetch("/api/reviews");
      const reviewsData = await revsRes.json();
      setReviews(reviewsData);
      saveReviewsLocally(reviewsData);

      return newReview;
    } catch (err: unknown) {
      console.error(err);
      setIsReviewing(false);
      throw err;
    } finally {
      setIsReviewing(false);
    }
  };

  const updateReviewFeedback = async (id: string, feedback: "up" | "down") => {
    try {
      const res = await fetch(`/api/reviews/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (!res.ok) throw new Error("Feedback API error");

      const revsRes = await fetch("/api/reviews");
      const reviewsData = await revsRes.json();
      setReviews(reviewsData);
      saveReviewsLocally(reviewsData);
    } catch {
      console.warn("Backend API feedback endpoint error. Running local toggle.");
      const updated = reviews.map((r) => {
        if (r.id === id) {
          return { ...r, feedback };
        }
        return r;
      });
      setReviews(updated);
      saveReviewsLocally(updated);
    }
  };

  // Derive stats
  const totalFiles = datasets.reduce((acc, curr) => acc + curr.files.length, 0);
  const totalReviews = reviews.length;
  const memoryNodesCount = datasets.reduce((acc, curr) => acc + curr.nodeCount, 0);

  // Compute memory health score
  const healthyCount = reviews.filter((r) => r.status === "resolved" || r.feedback === "up").length;
  const memoryHealth = Math.min(100, Math.round(((healthyCount + 2) / (totalReviews + 2)) * 100));

  const stats: MemoryStats = {
    totalFiles,
    totalReviews,
    memoryNodesCount,
    memoryHealth: hydrated ? memoryHealth : 98,
  };

  return (
    <DevMemoryContext.Provider
      value={{
        datasets: hydrated ? datasets : [],
        reviews: hydrated ? reviews : [],
        stats,
        addDataset,
        deleteDataset,
        addReview,
        updateReviewFeedback,
        isIngesting,
        isReviewing,
        ingestionLog,
      }}
    >
      {children}
    </DevMemoryContext.Provider>
  );
};

export const useDevMemory = () => {
  const context = useContext(DevMemoryContext);
  if (context === undefined) {
    throw new Error("useDevMemory must be used within a DevMemoryProvider");
  }
  return context;
};
