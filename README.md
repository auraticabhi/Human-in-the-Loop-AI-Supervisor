# Human-in-the-Loop AI Supervisor 

A Modular Human-in-the-Loop AI Receptionist system that intelligently escalates unknown queries to a human supervisor for resolution, sends a text follow-up (simulated), and autonomously updates its knowledge base (KB) for continuous learning. Built with LiveKit, Node/Express/Mongo, React.

---

## What It Does

This system enables AI receptionists to:
-  Answer known questions instantly via voice
-  Escalate unknown questions to human supervisors immediately
-  Responds customers back as soon as supervisors respond
-  Learn from every escalation and get smarter over time

---

## Quick Setup
1. Clone: `git clone https://github.com/auraticabhi/Human-in-the-Loop-AI-Supervisor.git && cd Human-in-the-Loop-AI-Supervisor`.

2. Configure the Database:
   - **If using local MongoDB:** Ensure the MongoDB service is running and copy default connection string. Example: mongodb://localhost:27017/HITL
   - **If using MongoDB Atlas:** Copy your Atlas connection string.
   
2. **Backend** (`server/`): `npm i && cp .env.example .env` (add Mongo URI). `npm run dev` (port 5000; seeds KB).
3. **Frontend** (`client/`): `npm i && cp .env.example .env` (REACT_APP_API_URL=`http://localhost:5000`). `npm run dev` (localhost:3000).
4. **Agent** (`agent/`): `npm i && cp .env.example .env` (add LiveKit/Gemini/Deepgram/Cartesia keys). `npm run dev`.
5. Simulate call: Test calls in [LiveKit Playground](https://agents-playground.livekit.io/).

---

## How It Works

### 1. Customer Calls → AI Agent Answers

```
Customer: "What are your business hours?"
AI: "We're open Monday-Saturday 9am-7pm, Sunday 10am-5pm"
✅ Answered from system knowledge
```

### 2. Unknown Question → Immediate Escalation

```
Customer: "Do you offer discounts?"
AI: [Checks knowledge base... not found]
AI: "Let me check with my supervisor and text you. What's your number?"
Customer: "989......."
AI: "Perfect! My supervisor will text you shortly."

→ Creates help request in database
→ Notifies supervisor
→ Shows in dashboard immediately
```

### 3. Supervisor Resolves → Instant Callback

```
Supervisor opens dashboard → Sees pending request
Supervisor types: "Yes! we are offering flat 25% off"
Supervisor clicks "Submit"

→ Request marked as resolved
→ Customer immediately gets simulated message:
→ Answer automatically added to knowledge base
```

### 4. AI Gets Smarter

```
Next customer calls...
Customer: "Do you offer discounts?"
AI: "Yes! we are offering flat 25% off"
✅ Answered immediately (learned from previous escalation!)
```

---

## Design Decisions
- **Help Requests Modeling**: Schema to track call escalations, including caller/session context (question, phone, sessionId), status management (status, timeoutAt), and performance indexes.
- **KnowledgeBase Structure**: Normalized Qs for fuzzy aggregation search, auto-create 'learned' on resolve, Separate 'initial' seeds.
- **Timeouts**: Background service (cron-style):
   ```
   Finds all requests past their timeoutAt
   Marks as 'timeout' status
   Sends customer notification
   ```
- **Clean Separation of Concerns**:
   ```
   Agent handles voice only
   Backend handles business logic
   Dashboard handles human interaction
   Each can be deployed independently
   ```
- **Modular architecture**: isolates agent/utils from backend services (notifications/cron) and controllers/routes, enabling seamless swaps like Twilio for SMS or LLM providers.
---

## Contact

I'd be happy to answer any questions you may have. Please feel free to get in touch.

- **Email:** [abhijeetgupta989@gmail.com](mailto:abhijeetgupta989@gmail.com)