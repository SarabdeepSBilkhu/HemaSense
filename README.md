# HemaSense: Deterministic Clinical Reasoning System

**"A deterministic clinical reasoning system with AI-assisted explanation."**

HemaSense represents a fundamental shift from simple "report explainers" to a rigorous, auditable pattern recognition engine. It processes raw laboratory blood test values through a strict deterministic pipeline before any natural language generation occurs.

---

## 🌟 Core Mechanism

HemaSense guarantees medical safety and reasoning transparency through a strict separation of deterministic logic and AI presentation:

1. **Pipeline Separation**: Input → Verified Range Matching → Deviation Calculation → Rule Resolution → AI Explanation.
2. **Coherent Diagnosis Engine**: The system does not stop at individual markers. It combines multiple parameters (e.g., *low Hb + low MCV + high RDW*), detects patterns, and outputs a single dominant interpretation with a calculated confidence level.
3. **Deviation Intelligence**: The engine computes exact `% deviation from normal`, assigns severity grading (mild/moderate/severe), and weighs the impact per parameter, moving beyond simple "low" or "high" binaries.
4. **Prioritized Cause Mapping**: Replaces generic lists with ranked causes (most likely → least likely) strictly based on multi-parameter pattern recognition.
5. **Evidence Anchoring**: Every generated output attaches specific clinical references (e.g., NIH) and explicitly reveals the deterministic rule used to reach the conclusion, ensuring auditable reasoning.
6. **Contradiction Detection**: If inputs conflict (e.g., *Normal Hb + low MCV*), the system flags the strictly mathematical anomaly rather than forcing an unsafe AI guess.
7. **Transparency Layer**: The engine operates purely as a white-box system, explicitly exposing *why* a conclusion was reached, *which* exact values contributed to it, and how strong the signal is.

---

## 🏗️ Architecture & Data Flow

The application follows a standard decoupled Three-Tier Architecture, operating asynchronously to manage rules, state, and external AI calls gracefully.

```mermaid
graph TD
    classDef frontend fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef database fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef ai fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff

    subgraph Client Tier
    UI[React Vite Frontend]:::frontend
    end

    subgraph Application Tier
    API[Node.js / Express Backend]:::backend
    Logic{Interpretation Engine}:::backend
    end

    subgraph Data Tier
    DB[(MongoDB)]:::database
    end

    subgraph External Services
    LLM{{Groq API - Mixtral}}:::ai
    end

    UI -->|POST: /api/analyze <br> (Raw Lab Values)| API
    API -->|1. Fetch Reference Ranges| DB
    DB -.->|Biomarker Definitions & Causes| API
    API -->|2. Evaluate Status <br> (High/Low/Normal)| Logic
    Logic -->|3. Pass Abnormalities| LLM
    LLM -.->|Return Natural Language Narrative| Logic
    Logic -->|4. Aggregate JSON| API
    API -->|Return Structured Summary & Data| UI
```

### Architectural Breakdown
1. **Client Tier (Frontend)**: Presents an intuitive form for the user to input data from categorized panels (CBC, Lipids, etc.). When submitted, it fires a highly-responsive React hook sequence to await data.
2. **Application Tier (Backend)**: The `Express.js` server receives the raw biomarker entries, pulls standardized reference constraints in real-time from the database, and flags values (with respective severities) based on local JSON-mapped evaluation.
3. **External AI Hook**: Once flagged, only the abnormal ranges are parsed out and securely pushed via prompt engineering to the **Groq API** to synthesize a cohesive narrative. 
4. **Data Tier (Database)**: Contains the rigid rule engine models (e.g. `min`, `max`, `high_causes`, `explanation`).

---

## 💻 Tech Stack

### Frontend
- **React 19** via **Vite**: For highly optimized, component-based view rendering. Fast HMR and lightweight bundling.
- **Tailwind CSS v4**: Utility-first CSS framework establishing the aesthetic application design (glassmorphism UI patterns).
- **Framer Motion**: Enables fluid entry animations and dropdown transitional logic in the dashboard.
- **Lucide React**: Vector icon library mapped into standard React components for iconography.
- **Axios**: Promised-based HTTP client for API interactions.

### Backend
- **Node.js** & **Express.js**: Core runtime and minimalist routing framework capturing API requests gracefully. 
- **Mongoose**: Elegant MongoDB object modeling providing a rigorous validation framework over our highly-typed Biomarker schemas.
- **Groq SDK**: External fast inference SDK hook directly querying the `mixtral-8x7b-32768` model.
- **Dotenv**: Safely manages environment-specific injection of connections (`PORT`, `MONGODB_URI`, `GROQ_API_KEY`).

### Database
- **MongoDB**: The NoSQL engine utilized for its flexible JSON-alike document structures, allowing nested arrays (e.g., strings containing causal health links).

---

## 🚀 Running the Project locally

1. Ensure **MongoDB** is running locally on `mongodb://127.0.0.1:27017`.
2. Populate `backend/.env` with your `GROQ_API_KEY`.
3. In terminal `#1`, run backend: `cd backend && npm install && node server.js`
4. In terminal `#2`, run frontend: `cd frontend && npm install && npm run dev`
5. Visit `http://localhost:5173` to explore.

