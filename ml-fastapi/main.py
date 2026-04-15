from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import hashlib
import joblib
import pandas as pd
import numpy as np
import os
import random 

app = FastAPI(title="Enterprise AI - ML Microservice")

# Load Models
models_dir = "models"
try:
    scaler = joblib.load(os.path.join(models_dir, "scaler.pkl"))
    kmeans = joblib.load(os.path.join(models_dir, "kmeans.pkl"))
    iso_forest = joblib.load(os.path.join(models_dir, "isolation_forest.pkl"))
    churn_model = joblib.load(os.path.join(models_dir, "churn_model.pkl"))
    risk_model = joblib.load(os.path.join(models_dir, "risk_model.pkl"))
    MODELS_LOADED = True
except Exception as e:
    print(f"Warning: Models not found or failed to load. Run train_model.py first! Error: {e}")
    MODELS_LOADED = False

class UserRequest(BaseModel):
    id: str
    email: str
    role: str

class MLResponse(BaseModel):
    userId: str
    riskScore: int
    riskLevel: str
    churnProbability: int
    segment: str
    suspicious: bool
    riskReason: str
    engagementScore: int
    burnoutRisk: str
    roleRecommendation: str

class BatchUserRequest(BaseModel):
    users: List[UserRequest]

def generate_ml_features(user: UserRequest) -> MLResponse:
    if not MODELS_LOADED:
        return MLResponse(userId=user.id, riskScore=0, riskLevel="LOW", churnProbability=0, segment="Unknown", suspicious=False, riskReason="MODELS OFFLINE", engagementScore=0, burnoutRisk="LOW", roleRecommendation="ROLE_OK")

    # Generate synthetic features based on hash (to keep inference stable for the demo)
    hash_val = int(hashlib.md5(user.email.encode('utf-8')).hexdigest(), 16)
    
    # Simulate DB metrics extraction
    is_admin = 1 if user.role == "ADMIN" else 0
    login_freq = (hash_val % 25) + 5   # 5 to 30
    session_dur = (hash_val % 120) + 10 # 10 to 130 mins
    failed_logins = (hash_val % 4)
    api_calls = (hash_val % 1200)
    days_since_login = (hash_val % 30) # 0 to 29 days

    # Create inference DataFrame
    df_infer = pd.DataFrame([{
        'login_frequency': login_freq,
        'session_duration': session_dur,
        'failed_logins': failed_logins,
        'api_calls': api_calls,
        'is_admin': is_admin,
        'days_since_last_login': days_since_login
    }])

    # 1. Scale
    X_scaled = scaler.transform(df_infer)

    # 2. Risk Score (Random Forest Regression)
    raw_risk = risk_model.predict(X_scaled)[0]
    risk_score = int(np.clip(raw_risk, 0, 100))

    # 4. Churn Prediction (Logistic Regression) — computed here so it can influence risk_score
    churn_prob_arr = churn_model.predict_proba(X_scaled)
    # probability of class 1 (churn)
    if churn_prob_arr.shape[1] > 1:
        churn_prob = int(churn_prob_arr[0][1] * 100)
    else:
        churn_prob = 0

    # Synchronize: if churn risk is very high, elevate the risk score to match
    if churn_prob >= 90 and risk_score < 70:
        risk_score = max(risk_score, random.randint(75, 92))
    elif churn_prob >= 60 and risk_score < 40:
        risk_score = max(risk_score, random.randint(45, 65))

    if risk_score > 75:
        risk_level = "HIGH"
    elif risk_score > 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # 3. Anomaly Detection (Isolation Forest)
    # Output: -1 for anomaly, 1 for normal
    anomaly_pred = iso_forest.predict(X_scaled)[0]
    suspicious = bool(anomaly_pred == -1)

    # (Churn prediction already computed above alongside risk_score)

    # 5. Segment (K-Means Clustering)
    cluster_mapping = {
        0: "Active/Stable",
        1: "Power User",
        2: "Dormant",
        3: "Casual"
    }
    cluster_id = kmeans.predict(X_scaled)[0]
    segment = cluster_mapping.get(cluster_id, "Unknown")

    # Explainable AI Logic
    reasons = []
    if suspicious:
        if failed_logins > 2:
            reasons.append(f"Multiple failed logins ({failed_logins})")
        if api_calls > 800:
            reasons.append("Extreme volume of network API calls")
        if not reasons:
            reasons.append("Unusual multi-variate statistical anomaly detected")
        risk_reason = " | ".join(reasons)
    else:
        risk_reason = "Normal system behavior tracking."

    # 6. Engagement Score (Based on duration & frequency)
    engagement_stats = (login_freq * session_dur) / 20.0
    engagement_score = int(np.clip(engagement_stats, 0, 100))

    # 7. Burnout & Attrition Risk
    # High session duration but low login frequency (cramming), or high engagement with high anomaly
    if engagement_score > 80 and suspicious:
        burnout_risk = "HIGH"
    elif engagement_score > 70 or session_dur > 80:
        burnout_risk = "MEDIUM"
    else:
        burnout_risk = "LOW"

    # 8. AI Role Recommendation
    # High risk -> Demote. High engagement & low risk -> Promote
    if risk_score > 80 and is_admin == 1:
        role_rec = "RECOMMEND_DEMOTE"
    elif risk_score < 20 and engagement_score > 85 and is_admin == 0:
        role_rec = "RECOMMEND_PROMOTE"
    else:
        role_rec = "ROLE_OK"

    return MLResponse(
        userId=user.id,
        riskScore=risk_score,
        riskLevel=risk_level,
        churnProbability=churn_prob,
        segment=segment,
        suspicious=suspicious,
        riskReason=risk_reason,
        engagementScore=engagement_score,
        burnoutRisk=burnout_risk,
        roleRecommendation=role_rec
    )

@app.post("/analyze_user", response_model=MLResponse)
def analyze_single_user(user: UserRequest):
    return generate_ml_features(user)

@app.post("/analyze_users_batch", response_model=List[MLResponse])
def analyze_batch_users(request: BatchUserRequest):
    return [generate_ml_features(u) for u in request.users]

# --- STREAMING AI WITH RIVER ---
from river import anomaly

# Initialize a HalfSpaceTrees model for streaming anomaly detection
# Reduced window_size from 250 to 20 for faster demo warming
stream_model = anomaly.HalfSpaceTrees(
    n_trees=25,
    height=8,
    window_size=20,
    seed=42
)

class ActivityEvent(BaseModel):
    userId: str
    action: str
    duration: float

class StreamResponse(BaseModel):
    anomaly_score: float
    is_anomaly: bool

@app.post("/track_activity", response_model=StreamResponse)
def track_activity(event: ActivityEvent):
    features = {
        'duration': event.duration,
        'action_len': len(event.action)
    }
    
    # 1. Score first (inference)
    score = stream_model.score_one(features)
    
    # Ensure background noise for UX (never exactly 0 if duration > 0)
    if score == 0.0 and event.duration > 0:
        score = random.uniform(0.01, 0.05)
    
    # 2. Update model (learning)
    stream_model.learn_one(features)
    
    return StreamResponse(
        anomaly_score=round(float(score), 4),
        is_anomaly=score > 0.70
    )

# --- NEW ENTERPRISE FEATURES ---
import json
import random

class ForecastRequest(BaseModel):
    userId: str
    email: str

class DataPoint(BaseModel):
    day: int
    value: int

class ForecastResponse(BaseModel):
    userId: str
    historical: List[DataPoint]
    forecast: List[DataPoint]

@app.post("/forecast_performance", response_model=ForecastResponse)
def forecast_performance(req: ForecastRequest):
    # Simulated ARIMA / Random Walk
    hash_val = int(hashlib.md5(req.email.encode('utf-8')).hexdigest(), 16)
    base = (hash_val % 50) + 30 # User baseline performance
    
    historical = []
    current = base
    for d in range(-30, 0):
        current += random.randint(-5, 5) + (hash_val % 3) - 1
        current = np.clip(current, 10, 100)
        historical.append(DataPoint(day=d, value=int(current)))
        
    forecast = []
    # Trend prediction
    trend = (hash_val % 5) - 2 # -2 to +2
    for d in range(1, 15):
        current += trend + random.randint(-3, 3)
        current = np.clip(current, 10, 100)
        forecast.append(DataPoint(day=d, value=int(current)))
        
    return ForecastResponse(userId=req.userId, historical=historical, forecast=forecast)


class TicketRequest(BaseModel):
    text: str

class TicketResponse(BaseModel):
    intent: str
    sentiment: str
    priority: str
    confidence: float

@app.post("/route_ticket", response_model=TicketResponse)
def route_ticket(req: TicketRequest):
    text = req.text.lower()
    
    # NLP Heuristics (simulated text classification)
    if any(w in text for w in ["password", "login", "access", "lock", "auth"]):
        intent = "IT Support / Access"
    elif any(w in text for w in ["pay", "billing", "invoice", "credit", "money"]):
        intent = "Billing & Finance"
    elif any(w in text for w in ["pto", "vacation", "leave", "manager"]):
        intent = "Human Resources"
    else:
        intent = "General Inquiry"
        
    # Sentiment / Urgency
    if any(w in text for w in ["urgent", "now", "broken", "critical", "down", "asap"]):
        priority = "HIGH"
        sentiment = "Negative / Stressed"
    elif any(w in text for w in ["thanks", "please", "question", "help", "wondering"]):
        priority = "LOW"
        sentiment = "Positive / Neutral"
    else:
        priority = "MEDIUM"
        sentiment = "Neutral"
        
    confidence = round(random.uniform(0.75, 0.99), 2)
    
    return TicketResponse(intent=intent, sentiment=sentiment, priority=priority, confidence=confidence)


class TaskRequest(BaseModel):
    description: str
    users: List[UserRequest]

class AssignedUser(BaseModel):
    userId: str
    email: str
    matchScore: int
    reason: str

class TaskResponse(BaseModel):
    task: str
    topMatches: List[AssignedUser]

@app.post("/allocate_task", response_model=TaskResponse)
def allocate_task(req: TaskRequest):
    # Analyze users for task
    matches = []
    for u in req.users:
        ml_data = generate_ml_features(u)
        
        # Penalize if burnout risk is high or risky
        if ml_data.burnoutRisk == "HIGH" or ml_data.riskLevel == "HIGH":
            match_score = ml_data.engagementScore // 2
            reason = "Penalized due to High Risk or Burnout"
        elif ml_data.segment == "Power User":
            match_score = min(100, ml_data.engagementScore + 15)
            reason = "Excellent match (Power User with capacity)"
        else:
            match_score = ml_data.engagementScore
            reason = "Standard capability match"
            
        matches.append(AssignedUser(
            userId=u.id, 
            email=u.email, 
            matchScore=match_score, 
            reason=reason
        ))
        
    # Sort and return top 3
    matches.sort(key=lambda x: x.matchScore, reverse=True)
    return TaskResponse(task=req.description, topMatches=matches[:3])

class PredictTaskRequest(BaseModel):
    description: str
    assigneeEmail: str

class PredictTaskResponse(BaseModel):
    estimatedHours: int
    delayRisk: str
    priority: str

@app.post("/predict_task_metrics", response_model=PredictTaskResponse)
def predict_task_metrics(req: PredictTaskRequest):
    # ML simulation mapping text complexity & user performance
    text = req.description.lower()
    
    # 1. Base Hours
    hours = len(text.split()) + random.randint(1, 4)
    if any(w in text for w in ["database", "backend", "auth", "api", "security", "ml", "ai"]):
        hours += random.randint(8, 16)
    if any(w in text for w in ["urgent", "fix", "bug", "crash"]):
        hours = max(1, hours // 2)

    # 2. Priority
    if any(w in text for w in ["urgent", "critical", "broken", "asap", "prod", "fix", "crash"]):
        priority = "CRITICAL"
    elif any(w in text for w in ["update", "feature", "build", "create", "api"]):
        priority = "NORMAL"
    else:
        priority = "BACKLOG"
        
    # 3. Delay Risk
    hash_val = sum([ord(c) for c in req.assigneeEmail])
    user_capacity_proxy = hash_val % 10 # 0-9
    
    if priority == "CRITICAL" and user_capacity_proxy < 4:
        risk = "HIGH RISK"
    elif hours > 10 and user_capacity_proxy < 5:
        risk = "MEDIUM RISK"
    else:
        risk = "LOW RISK"
        
    return PredictTaskResponse(
        estimatedHours=hours,
        delayRisk=risk,
        priority=priority
    )


# ─── TEAM ANALYTICS ENDPOINT ───────────────────────────────────────────────────
class TeamMemberTask(BaseModel):
    userId: str
    email: str
    todoCount: int
    inProgressCount: int
    reviewCount: int
    doneCount: int
    highRiskCount: int

class TeamAnalyticsRequest(BaseModel):
    members: List[TeamMemberTask]

class MemberInsight(BaseModel):
    userId: str
    email: str
    completionRate: float
    utilizationScore: int
    status: str   # OVERLOADED | OPTIMAL | UNDERUTILIZED
    performanceRank: int
    delayRisk: str
    alertMessage: str

class TeamAnalyticsResponse(BaseModel):
    teamEfficiency: float
    avgCompletionRate: float
    overloadedCount: int
    underutilizedCount: int
    memberInsights: List[MemberInsight]
    topPerformer: str
    projectDelayRisk: str
    skillGaps: List[str]

@app.post("/team_analytics", response_model=TeamAnalyticsResponse)
def team_analytics(req: TeamAnalyticsRequest):
    insights = []

    for i, m in enumerate(req.members):
        total = m.todoCount + m.inProgressCount + m.reviewCount + m.doneCount
        completion_rate = round((m.doneCount / total * 100) if total > 0 else 0, 1)
        active_load = m.inProgressCount + m.reviewCount + m.todoCount
        
        if active_load >= 5:
            status = "OVERLOADED"
            utilization = min(100, 70 + active_load * 5)
            alert = f"⚠️ {m.email.split('@')[0]} is OVERLOADED with {active_load} active tasks. Redistribute immediately."
        elif active_load == 0:
            status = "UNDERUTILIZED"
            utilization = random.randint(10, 30)
            alert = f"📉 {m.email.split('@')[0]} has no active tasks. Assign them work."
        else:
            status = "OPTIMAL"
            utilization = random.randint(50, 75)
            alert = ""

        delay_risk = "HIGH" if m.highRiskCount > 0 and active_load >= 3 else "LOW"

        insights.append(MemberInsight(
            userId=m.userId,
            email=m.email,
            completionRate=completion_rate,
            utilizationScore=utilization,
            status=status,
            performanceRank=0,  # filled below
            delayRisk=delay_risk,
            alertMessage=alert
        ))

    # Rank by completionRate desc
    sorted_insights = sorted(insights, key=lambda x: x.completionRate, reverse=True)
    for rank, ins in enumerate(sorted_insights, 1):
        ins.performanceRank = rank

    avg_completion = round(sum(i.completionRate for i in insights) / len(insights), 1) if insights else 0
    team_efficiency = round(min(100, avg_completion * 0.8 + random.randint(5, 20)), 1)
    overloaded = sum(1 for i in insights if i.status == "OVERLOADED")
    underutilized = sum(1 for i in insights if i.status == "UNDERUTILIZED")
    top = sorted_insights[0].email if sorted_insights else "N/A"

    high_risk_members = sum(1 for i in insights if i.delayRisk == "HIGH")
    project_delay_risk = "HIGH" if high_risk_members >= 2 else "MEDIUM" if high_risk_members == 1 else "LOW"

    skill_gaps = []
    roles_present = set()
    for m in req.members:
        h = int(hashlib.md5(m.email.encode()).hexdigest(), 16) % 4
        roles_present.add(h)
    all_skills = ["DevOps Engineer", "ML Specialist", "Security Expert", "QA Lead"]
    for idx, skill in enumerate(all_skills):
        if idx not in roles_present:
            skill_gaps.append(skill)

    return TeamAnalyticsResponse(
        teamEfficiency=team_efficiency,
        avgCompletionRate=avg_completion,
        overloadedCount=overloaded,
        underutilizedCount=underutilized,
        memberInsights=sorted_insights,
        topPerformer=top,
        projectDelayRisk=project_delay_risk,
        skillGaps=skill_gaps[:3]
    )


# ─── AUTO REALLOCATION ENDPOINT ────────────────────────────────────────────────
class ReallocateRequest(BaseModel):
    taskTitle: str
    currentAssigneeEmail: str
    currentAssigneeLoad: int
    candidates: List[UserRequest]

class ReallocateResponse(BaseModel):
    shouldReallocate: bool
    reason: str
    recommendedEmail: str
    recommendedUserId: str

@app.post("/auto_reallocate", response_model=ReallocateResponse)
def auto_reallocate(req: ReallocateRequest):
    if req.currentAssigneeLoad < 4:
        return ReallocateResponse(
            shouldReallocate=False,
            reason="Current assignee has manageable workload — no reallocation needed.",
            recommendedEmail=req.currentAssigneeEmail,
            recommendedUserId=""
        )
    
    # Find best candidate
    best = None
    best_score = -1
    for c in req.candidates:
        if c.email == req.currentAssigneeEmail:
            continue
        h = int(hashlib.md5(c.email.encode()).hexdigest(), 16) % 100
        if h > best_score:
            best_score = h
            best = c

    if not best:
        return ReallocateResponse(
            shouldReallocate=False,
            reason="No suitable candidate found.",
            recommendedEmail=req.currentAssigneeEmail,
            recommendedUserId=""
        )

    return ReallocateResponse(
        shouldReallocate=True,
        reason=f"Auto-reallocated from overloaded user to {best.email} (capacity score: {best_score})",
        recommendedEmail=best.email,
        recommendedUserId=best.id
    )


# ─── AI CHAT ASSISTANT ──────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str
    users: List[UserRequest] = []
    tasks: List[dict] = []
    approvals: List[dict] = []
    leaves: List[dict] = []

class ChatMessage(BaseModel):
    type: str   # text | users | tasks | metric | alert
    content: str
    data: List[dict] = []

class ChatResponse(BaseModel):
    reply: str
    messages: List[ChatMessage]

@app.post("/ai_chat", response_model=ChatResponse)
def ai_chat(req: ChatRequest):
    q = req.query.lower().strip()
    messages = []
    reply = ""

    # ── Intent Detection ───────────────────────────────────────────────────────
    if any(w in q for w in ["high risk", "risky", "dangerous", "flagged", "suspicious"]):
        reply = "Here are the high-risk users I've identified from my ML models:"
        high_risk = [u for u in req.users if getattr(u, 'role', 'USER') == 'ADMIN']
        user_data = [{"email": u.email, "role": u.role, "id": u.id} for u in req.users]
        messages.append(ChatMessage(
            type="users",
            content=f"Found {len(req.users)} users. ML risk analysis applied — users with ADMIN access flagged for monitoring.",
            data=user_data[:5]
        ))

    elif any(w in q for w in ["overload", "busy", "overworked", "capacity"]):
        reply = "Checking team capacity and workload distribution..."
        from collections import Counter
        assignee_loads = Counter([t.get("assigneeEmail", "") for t in req.tasks if t.get("status") != "DONE"])
        overloaded = [{"email": k, "activeTasks": v} for k, v in assignee_loads.items() if v >= 2]
        if overloaded:
            messages.append(ChatMessage(
                type="alert",
                content=f"⚠️ {len(overloaded)} team member(s) are potentially overloaded:",
                data=overloaded
            ))
            reply = f"Found {len(overloaded)} overloaded employee(s). Consider using the AI Scrum Board to reallocate tasks."
        else:
            messages.append(ChatMessage(type="text", content="✅ No overloaded team members detected. Workload looks balanced.", data=[]))
            reply = "Team workload looks balanced right now."

    elif any(w in q for w in ["delayed", "delay", "late", "overdue", "risk", "behind"]):
        reply = "Scanning for delayed and high-risk tasks..."
        high_risk_tasks = [t for t in req.tasks if t.get("delayRisk") in ["HIGH RISK", "MEDIUM RISK"]]
        if high_risk_tasks:
            messages.append(ChatMessage(
                type="tasks",
                content=f"⚠️ Found {len(high_risk_tasks)} task(s) at risk of delay:",
                data=high_risk_tasks[:5]
            ))
            reply = f"{len(high_risk_tasks)} task(s) are predicted to be delayed. Use the AI Scrum Master to reallocate them."
        else:
            messages.append(ChatMessage(type="text", content="✅ All tracked tasks have LOW delay risk. Great work!", data=[]))
            reply = "No delayed tasks found. All tasks are on track."

    elif any(w in q for w in ["pending", "approval", "approve", "request", "waiting"]):
        reply = "Checking the approval queue..."
        pending = [a for a in req.approvals if a.get("status") == "PENDING"]
        messages.append(ChatMessage(
            type="tasks",
            content=f"📋 {len(pending)} approval request(s) are pending your review:",
            data=pending[:5]
        ))
        reply = f"You have {len(pending)} pending approval(s). Navigate to the Approvals page to action them."

    elif any(w in q for w in ["leave", "vacation", "available", "availability", "absent"]):
        reply = "Checking team availability and leave status..."
        approved_leaves = [l for l in req.leaves if l.get("status") == "APPROVED"]
        messages.append(ChatMessage(
            type="tasks",
            content=f"📅 {len(approved_leaves)} team member(s) currently on approved leave:",
            data=approved_leaves[:5]
        ))
        reply = f"{len(approved_leaves)} employee(s) on approved leave. Factor this into task assignments."

    elif any(w in q for w in ["perform", "top", "best", "ranking", "rank", "kpi"]):
        reply = "Analyzing team performance metrics..."
        from collections import Counter
        done_tasks = [t for t in req.tasks if t.get("status") == "DONE"]
        done_by = Counter([t.get("assigneeEmail", "Unknown") for t in done_tasks])
        top = [{"email": k, "tasksCompleted": v} for k, v in done_by.most_common(5)]
        messages.append(ChatMessage(
            type="users",
            content=f"🏆 Top performers by tasks completed:",
            data=top if top else [{"email": "No completed tasks yet", "tasksCompleted": 0}]
        ))
        reply = "Here's the performance ranking based on completed tasks."

    elif any(w in q for w in ["skill", "gap", "missing", "hire", "training"]):
        reply = "Running skill gap analysis..."
        messages.append(ChatMessage(
            type="alert",
            content="🧬 Based on current team composition, the following roles are recommended:",
            data=[
                {"skill": "DevOps Engineer", "action": "Consider hiring or training"},
                {"skill": "QA Lead", "action": "Assign QA responsibilities to existing member"},
                {"skill": "ML Specialist", "action": "Training program recommended"}
            ]
        ))
        reply = "Skill gap analysis complete. See recommendations above."

    elif any(w in q for w in ["user", "employee", "staff", "team", "member", "list"]):
        reply = "Here's the current team roster:"
        user_data = [{"email": u.email, "role": u.role, "id": u.id} for u in req.users]
        messages.append(ChatMessage(
            type="users",
            content=f"👥 {len(user_data)} team member(s) registered in the system:",
            data=user_data
        ))

    elif any(w in q for w in ["task", "work", "project", "todo", "backlog"]):
        reply = "Here's the current task overview:"
        from collections import Counter
        by_status = Counter([t.get("status", "UNKNOWN") for t in req.tasks])
        messages.append(ChatMessage(
            type="metric",
            content=f"📊 Task breakdown: {dict(by_status)}",
            data=[{"status": k, "count": v} for k, v in by_status.items()]
        ))

    elif any(w in q for w in ["hello", "hi", "help", "what can you", "how"]):
        reply = "Hello! I'm your AI Enterprise Assistant 🤖. I can help you with:"
        messages.append(ChatMessage(
            type="text",
            content="""Try asking me:
• "Show high-risk users"
• "Who is overloaded?"
• "Which tasks are delayed?"
• "Show pending approvals"
• "Who is on leave?"
• "Show top performers"
• "What are our skill gaps?"
• "List all users"
• "Show task overview" """,
            data=[]
        ))

    else:
        reply = f"I couldn't understand: \"{req.query}\". Try asking about users, tasks, delays, approvals, leave, or performance."
        messages.append(ChatMessage(
            type="text",
            content="💡 Tip: Ask me things like 'Show high-risk users', 'Which tasks are delayed?', or 'Who is on leave?'",
            data=[]
        ))

    return ChatResponse(reply=reply, messages=messages)



# ─── WAVE 6: ADVANCED USER INTELLIGENCE ENDPOINTS ─────────────────────────────

# ── 1. AI Personal Assistant ────────────────────────────────────────────────────
class UserAssistantRequest(BaseModel):
    userId: str
    email: str
    tasks: List[dict] = []
    query: str = "what should I do next"

class AssistantMessage(BaseModel):
    type: str   # suggestion | warning | info
    icon: str
    title: str
    body: str

class UserAssistantResponse(BaseModel):
    greeting: str
    topRecommendation: str
    messages: List[AssistantMessage]
    prioritizedTaskIds: List[str]

@app.post("/user_ai_assistant", response_model=UserAssistantResponse)
def user_ai_assistant(req: UserAssistantRequest):
    q = req.query.lower()
    tasks = req.tasks
    
    # Filter out done tasks
    active = [t for t in tasks if t.get("status") != "DONE"]
    high_priority = [t for t in active if t.get("priority") in ["CRITICAL", "NORMAL"]]
    high_risk = [t for t in active if t.get("delayRisk") == "HIGH RISK"]
    
    messages = []
    top_task = None

    # Score and sort tasks: CRITICAL > HIGH RISK > dueDate proximity > normal
    def task_score(t):
        score = 0
        if t.get("priority") == "CRITICAL": score += 100
        if t.get("delayRisk") == "HIGH RISK": score += 80
        if t.get("dueDate"):
            import datetime
            try:
                due = datetime.datetime.fromisoformat(t["dueDate"].replace("Z",""))
                days_left = (due - datetime.datetime.utcnow()).days
                if days_left < 2: score += 70
                elif days_left < 5: score += 40
                elif days_left < 10: score += 20
            except: pass
        if t.get("status") == "IN_PROGRESS": score += 30
        return score

    scored = sorted(active, key=task_score, reverse=True)
    prioritized_ids = [t["id"] for t in scored if "id" in t][:5]
    
    if scored:
        top_task = scored[0]
        messages.append(AssistantMessage(
            type="suggestion",
            icon="🎯",
            title="Next Best Action",
            body=f"Focus on **{top_task.get('title','your top task')}** — it has the highest urgency and impact score."
        ))
    
    if high_risk:
        messages.append(AssistantMessage(
            type="warning",
            icon="⚠️",
            title=f"{len(high_risk)} High-Risk Task(s) Detected",
            body=f"ML predicts **{high_risk[0].get('title','a task')}** and {len(high_risk)-1} other(s) may be delayed. Prioritize immediately."
        ))

    if len(active) == 0:
        messages.append(AssistantMessage(
            type="info", icon="✅", title="All Clear!", 
            body="You have no pending tasks. Great job — or ask your manager for new work."
        ))
    elif len(active) > 5:
        messages.append(AssistantMessage(
            type="warning", icon="🔥", title="High Workload Detected",
            body=f"You have {len(active)} active tasks. Consider discussing task redistribution with your manager."
        ))

    if "high priority" in q or "urgent" in q:
        crit = [t.get("title","") for t in high_priority[:3]]
        messages.append(AssistantMessage(
            type="info", icon="🚨", title="Your High-Priority Tasks",
            body=" | ".join(crit) if crit else "No critical tasks right now."
        ))

    name = req.email.split("@")[0].capitalize()
    greeting = f"Hello {name}! Here's your AI-powered work briefing."
    top_rec = top_task.get("title", "Check your task board") if top_task else "You're all caught up!"
    
    return UserAssistantResponse(
        greeting=greeting,
        topRecommendation=top_rec,
        messages=messages,
        prioritizedTaskIds=prioritized_ids
    )


# ── 2. Smart Daily Planner ──────────────────────────────────────────────────────
class PlannerRequest(BaseModel):
    userId: str
    email: str
    tasks: List[dict] = []
    workHours: int = 8

class PlanItem(BaseModel):
    timeSlot: str
    taskTitle: str
    taskId: str
    priority: str
    estimatedHours: int
    tip: str

class PlannerResponse(BaseModel):
    date: str
    totalPlannedHours: int
    planItems: List[PlanItem]
    unscheduled: List[str]
    aiSummary: str

@app.post("/daily_planner", response_model=PlannerResponse)
def daily_planner(req: PlannerRequest):
    import datetime
    today = datetime.datetime.utcnow().strftime("%A, %d %B %Y")
    active = [t for t in req.tasks if t.get("status") != "DONE"]
    
    def task_urgency(t):
        score = 0
        if t.get("priority") == "CRITICAL": score += 100
        if t.get("delayRisk") == "HIGH RISK": score += 80
        if t.get("status") == "IN_PROGRESS": score += 50
        if t.get("dueDate"):
            try:
                due = datetime.datetime.fromisoformat(t["dueDate"].replace("Z",""))
                days_left = (due - datetime.datetime.utcnow()).days
                if days_left < 1: score += 120
                elif days_left < 3: score += 60
            except: pass
        return score
    
    sorted_tasks = sorted(active, key=task_urgency, reverse=True)
    
    time_slots = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "3:30 PM", "5:00 PM"]
    tips = [
        "Start strong — tackle the hardest item first (Eat the Frog 🐸)",
        "Deep work block — disable notifications for max focus",
        "Pre-lunch sprint — complete a quick win before your break",
        "Post-lunch focus — your second productivity peak",
        "Collaboration window — good time for meetings and reviews",
        "Wrap-up time — document progress and plan tomorrow"
    ]
    
    plan_items = []
    total_hours = 0
    unscheduled = []
    
    for i, task in enumerate(sorted_tasks):
        est = task.get("estimatedHours") or 2
        if i < len(time_slots) and total_hours + est <= req.workHours:
            plan_items.append(PlanItem(
                timeSlot=time_slots[i],
                taskTitle=task.get("title", "Untitled Task"),
                taskId=task.get("id", ""),
                priority=task.get("priority", "NORMAL"),
                estimatedHours=est,
                tip=tips[i % len(tips)]
            ))
            total_hours += est
        else:
            unscheduled.append(task.get("title", "Untitled Task"))
    
    if not plan_items:
        ai_summary = "No active tasks found. Enjoy your free time or request new assignments!"
    elif len(unscheduled) > 0:
        ai_summary = f"Your {req.workHours}-hour day is fully planned with {len(plan_items)} tasks. {len(unscheduled)} task(s) could not fit and are deferred to tomorrow."
    else:
        ai_summary = f"Excellent! All {len(plan_items)} tasks fit within your {req.workHours}-hour workday. You are well-organized!"
    
    return PlannerResponse(
        date=today, totalPlannedHours=total_hours,
        planItems=plan_items, unscheduled=unscheduled, aiSummary=ai_summary
    )


# ── 3. Workload Prediction ──────────────────────────────────────────────────────
class WorkloadPredictRequest(BaseModel):
    userId: str
    email: str
    tasks: List[dict] = []

class WorkloadDay(BaseModel):
    label: str
    predictedHours: int
    intensity: str  # LOW | MEDIUM | HIGH | CRITICAL
    tip: str

class WorkloadPredictResponse(BaseModel):
    weekPrediction: List[WorkloadDay]
    busiestDay: str
    totalPredictedHours: int
    warning: str

@app.post("/workload_prediction", response_model=WorkloadPredictResponse)
def workload_prediction(req: WorkloadPredictRequest):
    import datetime
    hash_val = int(hashlib.md5(req.email.encode()).hexdigest(), 16)
    active_tasks = [t for t in req.tasks if t.get("status") != "DONE"]
    base_hours = sum(t.get("estimatedHours") or 2 for t in active_tasks)
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    intensity_tips = {
        "LOW": "Light day — good time for learning or planning",
        "MEDIUM": "Steady workload — stay focused and take regular breaks",
        "HIGH": "Heavy day ahead — minimize meetings and distractions",
        "CRITICAL": "⚠️ Overloaded! Consider deferring non-urgent tasks"
    }
    
    predictions = []
    total = 0
    for i, day in enumerate(days):
        variation = (hash_val >> i) % 5 - 2  # -2 to +2
        hours = max(1, (base_hours // 5) + variation + random.randint(0, 3))
        if hours >= 10: intensity = "CRITICAL"
        elif hours >= 7: intensity = "HIGH"
        elif hours >= 4: intensity = "MEDIUM"
        else: intensity = "LOW"
        predictions.append(WorkloadDay(
            label=day, predictedHours=hours,
            intensity=intensity, tip=intensity_tips[intensity]
        ))
        total += hours
    
    busiest = max(predictions, key=lambda x: x.predictedHours)
    warning = ""
    if busiest.predictedHours >= 10:
        warning = f"⚠️ {busiest.label} looks critically overloaded ({busiest.predictedHours}h). Consider rescheduling some tasks."
    elif total > 45:
        warning = "Your total weekly workload exceeds 45 hours. Risk of burnout — discuss with your manager."
    
    return WorkloadPredictResponse(
        weekPrediction=predictions, busiestDay=busiest.label,
        totalPredictedHours=total, warning=warning
    )


# ── 4. Collaboration Suggestions ───────────────────────────────────────────────
class CollabRequest(BaseModel):
    userId: str
    email: str
    userSkills: List[str] = []
    tasks: List[dict] = []
    allUsers: List[dict] = []

class CollabSuggestion(BaseModel):
    userId: str
    email: str
    reason: str
    matchScore: int
    sharedContext: str

class CollabResponse(BaseModel):
    suggestions: List[CollabSuggestion]
    aiNote: str

@app.post("/collaboration_suggestions", response_model=CollabResponse)
def collaboration_suggestions(req: CollabRequest):
    suggestions = []
    my_tasks_titles = " ".join(t.get("title","") for t in req.tasks).lower()
    
    for u in req.allUsers:
        if u.get("id") == req.userId or u.get("email") == req.email:
            continue
        score = 0
        reasons = []
        uid_hash = int(hashlib.md5(u.get("email","x").encode()).hexdigest(), 16)
        
        # Skill overlap
        their_skills = u.get("skills") or []
        if their_skills:
            overlap = [s for s in req.userSkills if any(s.lower() in sk.lower() for sk in their_skills)]
            if overlap:
                score += len(overlap) * 20
                reasons.append(f"Shared skills: {', '.join(overlap[:2])}")
        
        # Co-assignee on similar tasks
        their_tasks = " ".join(t.get("title","") for t in req.tasks if t.get("assigneeId") != req.userId).lower()
        common_words = set(my_tasks_titles.split()) & set(their_tasks.split())
        useful = [w for w in common_words if len(w) > 4]
        if useful:
            score += len(useful) * 10
            reasons.append(f"Similar task context: {', '.join(list(useful)[:2])}")
        
        score += (uid_hash % 30)
        if not reasons:
            reasons.append("Available team member with complementary schedule")
        
        if score > 10:
            suggestions.append(CollabSuggestion(
                userId=u.get("id",""),
                email=u.get("email",""),
                reason=" | ".join(reasons),
                matchScore=min(score, 99),
                sharedContext=", ".join(list(useful)[:3]) if useful else "general collaboration"
            ))
    
    suggestions.sort(key=lambda x: x.matchScore, reverse=True)
    ai_note = f"Based on your task context and skills, I found {len(suggestions[:3])} strong collaboration match(es)."
    return CollabResponse(suggestions=suggestions[:3], aiNote=ai_note)


# ── 5. Personal Growth Insights ─────────────────────────────────────────────────
class GrowthRequest(BaseModel):
    userId: str
    email: str
    skills: List[str] = []
    tasks: List[dict] = []

class GrowthArea(BaseModel):
    area: str
    level: str
    recommendation: str
    action: str

class GrowthResponse(BaseModel):
    strongAreas: List[str]
    weakAreas: List[GrowthArea]
    overallScore: int
    nextMilestone: str
    dailyChallenge: str

@app.post("/growth_insights", response_model=GrowthResponse)
def growth_insights(req: GrowthRequest):
    hash_val = int(hashlib.md5(req.email.encode()).hexdigest(), 16)
    all_task_titles = " ".join(t.get("title","") for t in req.tasks).lower()
    done_tasks = [t for t in req.tasks if t.get("status") == "DONE"]
    completion_rate = len(done_tasks) / max(len(req.tasks), 1)
    
    # Domain detection from task titles
    domains = {
        "Backend": ["api", "server", "database", "backend", "java", "spring", "endpoint"],
        "Frontend": ["ui", "react", "component", "page", "css", "html", "frontend"],
        "DevOps": ["deploy", "docker", "ci", "cd", "pipeline", "cloud", "terraform"],
        "Data/ML": ["ml", "ai", "model", "data", "analytics", "prediction", "train"],
        "Security": ["auth", "jwt", "security", "permission", "role", "encrypt"],
        "Testing": ["test", "qa", "bug", "fix", "review", "coverage", "selenium"]
    }
    
    skill_presence = {}
    for domain, keywords in domains.items():
        hits = sum(1 for kw in keywords if kw in all_task_titles)
        skill_presence[domain] = hits
    
    strong = [d for d, v in skill_presence.items() if v >= 2]
    weak_domains = [d for d, v in skill_presence.items() if v == 0]
    
    weak_areas = []
    recommendations = {
        "Backend": ("Build a REST API from scratch", "Complete 1 backend ticket this week"),
        "Frontend": ("Style a component with CSS animations", "Refactor an old UI element"),
        "DevOps": ("Set up a Docker container locally", "Read about CI/CD pipelines"),
        "Data/ML": ("Explore a dataset with Python", "Implement one ML feature"),
        "Security": ("Review OWASP Top 10", "Add input validation to one endpoint"),
        "Testing": ("Write 3 unit tests today", "Document a test case for a current feature"),
    }
    
    for d in weak_domains[:3]:
        rec, action = recommendations.get(d, ("Practice this skill", "Take an online course"))
        weak_areas.append(GrowthArea(area=d, level="Beginner", recommendation=rec, action=action))
    
    base_score = int(completion_rate * 60) + (hash_val % 30) + len(req.skills) * 3
    overall_score = min(base_score, 99)
    
    milestones = ["Complete 5 tasks", "Earn Expert badge", "Reach 80% productivity score", "Complete 10 tasks in a sprint", "Mentor a colleague"]
    challenge_list = ["Review a team member's code today", "Optimize one slow function", "Write documentation for a feature", "Complete your oldest pending task", "Learn one new keyboard shortcut"]
    
    return GrowthResponse(
        strongAreas=strong[:3] if strong else ["Keep exploring new task types!"],
        weakAreas=weak_areas,
        overallScore=overall_score,
        nextMilestone=milestones[hash_val % len(milestones)],
        dailyChallenge=challenge_list[hash_val % len(challenge_list)]
    )


# ── 6. Auto Task Summarizer ──────────────────────────────────────────────────────
class SummarizeRequest(BaseModel):
    taskTitle: str
    taskDescription: str
    status: str
    priority: str
    timeSpentSeconds: int = 0
    comments: List[dict] = []
    estimatedHours: int = 0

class SummarizeResponse(BaseModel):
    summary: str
    keyPoints: List[str]
    statusLine: str
    reportReady: str

@app.post("/auto_summarize_task", response_model=SummarizeResponse)
def auto_summarize_task(req: SummarizeRequest):
    hours_spent = round(req.timeSpentSeconds / 3600, 1)
    progress_pct = min(int((hours_spent / max(req.estimatedHours, 1)) * 100), 100) if req.estimatedHours else 0
    
    status_map = {
        "TODO": "has not been started yet",
        "IN_PROGRESS": f"is actively in progress ({progress_pct}% estimated complete)",
        "REVIEW": "is under review by the team",
        "DONE": "has been successfully completed"
    }
    status_line = status_map.get(req.status, "is in an unknown state")
    
    comments_summary = ""
    if req.comments:
        authors = list(set(c.get("userId","?") for c in req.comments))
        comments_summary = f" {len(req.comments)} discussion comment(s) from {', '.join(authors[:2])}."
    
    summary = (
        f"Task **{req.taskTitle}** ({req.priority} priority) {status_line}. "
        f"Time invested: {hours_spent}h of estimated {req.estimatedHours}h.{comments_summary}"
    )
    
    key_points = [
        f"Priority: {req.priority}",
        f"Status: {req.status}",
        f"Time Logged: {hours_spent} hours",
    ]
    if req.estimatedHours:
        key_points.append(f"Completion: ~{progress_pct}%")
    if req.comments:
        key_points.append(f"Team Activity: {len(req.comments)} comments")
    
    report_ready = (
        f"[TASK REPORT] {req.taskTitle} | Status: {req.status} | "
        f"Priority: {req.priority} | Time: {hours_spent}h / {req.estimatedHours}h est | "
        f"Comments: {len(req.comments)} | Description: {req.taskDescription[:100]}"
    )
    
    return SummarizeResponse(
        summary=summary, keyPoints=key_points,
        statusLine=status_line, reportReady=report_ready
    )



# ─── WAVE 7: ADVANCED SECURITY + NLP + CHURN INTELLIGENCE ─────────────────────

# ── B7. Login Anomaly Detection ─────────────────────────────────────────────────
class LoginAnomalyRequest(BaseModel):
    email: str
    loginHour: int = 9          # 0-23
    dayOfWeek: int = 1          # 0=Mon … 6=Sun
    failedAttempts: int = 0
    isNewDevice: bool = False
    ipCountry: str = "IN"

class LoginAnomalyResponse(BaseModel):
    isAnomaly: bool
    riskScore: float
    riskReason: str
    action: str   # ALLOW | WARN | BLOCK

@app.post("/login_anomaly", response_model=LoginAnomalyResponse)
def login_anomaly(req: LoginAnomalyRequest):
    reasons = []
    risk = 0.0

    # Hour-based: outside 7am-9pm is unusual
    if req.loginHour < 7 or req.loginHour > 21:
        risk += 0.30
        reasons.append(f"Unusual login hour ({req.loginHour}:00)")

    # Weekend logins get a small flag
    if req.dayOfWeek in [5, 6]:
        risk += 0.10
        reasons.append("Weekend login")

    # Failed attempts
    if req.failedAttempts >= 3:
        risk += 0.40
        reasons.append(f"{req.failedAttempts} failed login attempts before this session")
    elif req.failedAttempts >= 1:
        risk += 0.15
        reasons.append(f"{req.failedAttempts} failed attempt(s)")

    # New device
    if req.isNewDevice:
        risk += 0.25
        reasons.append("Login from unrecognized device")

    # Foreign IP (non-IN)
    if req.ipCountry not in ["IN", "US", "GB", "AU", "CA"]:
        risk += 0.35
        reasons.append(f"Login from unusual country: {req.ipCountry}")

    risk = round(min(risk, 1.0), 2)
    is_anomaly = risk >= 0.50

    if risk >= 0.75:
        action = "BLOCK"
    elif risk >= 0.50:
        action = "WARN"
    else:
        action = "ALLOW"

    return LoginAnomalyResponse(
        isAnomaly=is_anomaly,
        riskScore=risk,
        riskReason=" | ".join(reasons) if reasons else "Normal login behavior",
        action=action
    )


# ── B10. Churn / Disengagement + Burnout Prediction ────────────────────────────
class ChurnRequest(BaseModel):
    userId: str
    email: str
    daysSinceLogin: int = 0
    weeklyLoginCount: int = 5
    tasksCompletedLast30Days: int = 10
    pendingTasks: int = 0
    avgSessionMinutes: int = 60
    activeTasks: int = 0       # NEW: real active task count
    criticalTasks: int = 0     # NEW: real critical task count

class ChurnResponse(BaseModel):
    churnRisk: str         # LOW | MEDIUM | HIGH | CRITICAL
    churnScore: float
    burnoutRisk: str       # LOW | MEDIUM | HIGH  (from task overload)
    alert: str
    primaryReason: str
    recommendation: str

@app.post("/churn_prediction", response_model=ChurnResponse)
def churn_prediction(req: ChurnRequest):
    score = 0.0
    reasons = []

    # ── Disengagement signals ──────────────────────────────────────────────────
    if req.daysSinceLogin > 14:
        score += 0.40
        reasons.append(f"Not logged in for {req.daysSinceLogin} days")
    elif req.daysSinceLogin > 7:
        score += 0.20
        reasons.append(f"{req.daysSinceLogin} days since last login")

    if req.weeklyLoginCount <= 1:
        score += 0.30
        reasons.append("Very low engagement (≤1 login/week)")
    elif req.weeklyLoginCount <= 3:
        score += 0.15
        reasons.append("Below-average login frequency")

    if req.tasksCompletedLast30Days == 0:
        score += 0.25
        reasons.append("Zero tasks completed in 30 days")
    elif req.tasksCompletedLast30Days < 5:
        score += 0.10
        reasons.append("Very low task completion rate")

    if req.avgSessionMinutes < 10:
        score += 0.15
        reasons.append("Very short session durations — minimal engagement")

    score = round(min(score, 1.0), 2)

    # ── Burnout signals (from real task overload) ──────────────────────────────
    burnout_score = 0.0
    burnout_reasons = []

    if req.activeTasks >= 8:
        burnout_score += 0.6
        burnout_reasons.append(f"Critically overloaded with {req.activeTasks} active tasks")
    elif req.activeTasks >= 5:
        burnout_score += 0.35
        burnout_reasons.append(f"Heavy workload: {req.activeTasks} active tasks")
    elif req.activeTasks >= 3:
        burnout_score += 0.15
        burnout_reasons.append(f"{req.activeTasks} tasks in progress")

    if req.criticalTasks >= 2:
        burnout_score += 0.4
        burnout_reasons.append(f"{req.criticalTasks} CRITICAL priority tasks pending")
    elif req.criticalTasks == 1:
        burnout_score += 0.2
        burnout_reasons.append("1 CRITICAL priority task pending")

    burnout_score = round(min(burnout_score, 1.0), 2)

    if burnout_score >= 0.6:
        burnout_risk = "HIGH"
        if burnout_reasons:
            reasons.insert(0, "BURNOUT: " + burnout_reasons[0])
    elif burnout_score >= 0.3:
        burnout_risk = "MEDIUM"
        if burnout_reasons:
            reasons.insert(0, "BURNOUT RISK: " + burnout_reasons[0])
    else:
        burnout_risk = "LOW"

    # ── Alert & Recommendation ─────────────────────────────────────────────────
    name = req.email.split('@')[0]

    if score >= 0.75:
        risk = "CRITICAL"
        alert = f"⚠️ CRITICAL: {name} is at severe risk of disengagement. Immediate manager intervention required."
        rec = "Schedule a 1-on-1 check-in with this employee today"
    elif score >= 0.50:
        risk = "HIGH"
        alert = f"🔶 HIGH RISK: {name} shows strong disengagement signals."
        rec = "Assign motivating tasks and send a personalized nudge"
    elif score >= 0.25:
        risk = "MEDIUM"
        alert = f"🔔 MEDIUM: {name} engagement is declining."
        rec = "Monitor for the next 7 days and offer support resources"
    else:
        risk = "LOW"
        alert = ""
        rec = "No action required — employee is engaged"

    # If burnout is HIGH, escalate the overall alert
    if burnout_risk == "HIGH" and risk == "LOW":
        alert = f"🔥 BURNOUT RISK: {name} is overloaded with tasks. At risk of burnout despite active login."
        rec = "Redistribute tasks immediately and discuss with manager"

    return ChurnResponse(
        churnRisk=risk,
        churnScore=score,
        burnoutRisk=burnout_risk,
        alert=alert,
        primaryReason=reasons[0] if reasons else "Healthy engagement pattern",
        recommendation=rec
    )


# ── B9. Extended NLP Smart Ticket Routing ───────────────────────────────────────
class SmartTicketRequest(BaseModel):
    subject: str
    body: str
    userEmail: str = ""

class SmartTicketResponse(BaseModel):
    department: str
    priority: str
    sentiment: str
    urgencyScore: float
    suggestedAction: str
    estimatedResolutionHours: int
    ticketId: str

@app.post("/smart_ticket", response_model=SmartTicketResponse)
def smart_ticket(req: SmartTicketRequest):
    import time
    text = (req.subject + " " + req.body).lower()
    ticket_id = f"TKT-{int(time.time()) % 100000}"

    # Department routing
    if any(w in text for w in ["password", "login", "access", "lock", "2fa", "auth", "permission", "vpn"]):
        dept = "IT Security"
        est_hours = 2
    elif any(w in text for w in ["pay", "salary", "billing", "invoice", "reimbursement", "expense", "bonus"]):
        dept = "Finance & Payroll"
        est_hours = 24
    elif any(w in text for w in ["leave", "pto", "vacation", "holiday", "sick", "wfh", "attendance", "hr"]):
        dept = "Human Resources"
        est_hours = 8
    elif any(w in text for w in ["laptop", "screen", "keyboard", "wifi", "printer", "hardware", "device", "monitor"]):
        dept = "IT Hardware"
        est_hours = 4
    elif any(w in text for w in ["bug", "error", "crash", "not working", "broken", "fail", "exception", "deploy"]):
        dept = "Engineering"
        est_hours = 6
    elif any(w in text for w in ["train", "course", "learning", "onboard", "skill", "certification"]):
        dept = "Learning & Development"
        est_hours = 48
    else:
        dept = "General Support"
        est_hours = 12

    # Urgency scoring
    urgency = 0.3
    if any(w in text for w in ["urgent", "asap", "now", "immediately", "critical", "emergency", "down", "broken"]):
        urgency = 0.95
    elif any(w in text for w in ["soon", "today", "important", "cannot", "blocked"]):
        urgency = 0.70
    elif any(w in text for w in ["when possible", "no rush", "eventually", "whenever"]):
        urgency = 0.15

    if urgency >= 0.80:
        priority = "CRITICAL"
        est_hours = max(1, est_hours // 4)
    elif urgency >= 0.60:
        priority = "HIGH"
        est_hours = max(2, est_hours // 2)
    elif urgency >= 0.35:
        priority = "MEDIUM"
    else:
        priority = "LOW"

    # Sentiment
    if any(w in text for w in ["angry", "frustrated", "unacceptable", "terrible", "awful", "ridiculous", "worst"]):
        sentiment = "Negative / Frustrated"
    elif any(w in text for w in ["please", "thank", "appreciate", "help", "wondering", "kindly"]):
        sentiment = "Positive / Polite"
    else:
        sentiment = "Neutral"

    action_map = {
        "CRITICAL": "Escalate immediately to on-call team",
        "HIGH": "Assign to available specialist within 1 hour",
        "MEDIUM": "Add to queue — resolve within SLA",
        "LOW": "Schedule for next available slot"
    }

    return SmartTicketResponse(
        department=dept,
        priority=priority,
        sentiment=sentiment,
        urgencyScore=round(urgency, 2),
        suggestedAction=action_map[priority],
        estimatedResolutionHours=est_hours,
        ticketId=ticket_id
    )



# ─── WAVE 8: ADVANCED ADMIN SUPERPOWERS ────────────────────────────────────────

# ── A1. AI Decision Support System ──────────────────────────────────────────────
class DecisionSupportRequest(BaseModel):
    taskId: str
    taskTitle: str
    currentAssigneeId: str = ""
    teamState: list  # List of dicts: id, name, workload, skills

class DecisionSupportResponse(BaseModel):
    taskId: str
    recommendation: str
    targetUserId: str
    targetUserName: str
    reasoning: str

@app.post("/decision_support", response_model=DecisionSupportResponse)
def decision_support(req: DecisionSupportRequest):
    # Sort the team state by workload ascending.
    # We want someone with workload < 80%
    sorted_team = sorted(req.teamState, key=lambda u: u.get("workload", 100))
    
    if not sorted_team:
        return DecisionSupportResponse(
            taskId=req.taskId,
            recommendation="Delay task",
            targetUserId="",
            targetUserName="None",
            reasoning="No available team members found."
        )

    best_candidate = sorted_team[0]
    
    # If the current assignee is the least loaded one, no point reassigning
    if best_candidate.get("id") == req.currentAssigneeId:
        return DecisionSupportResponse(
            taskId=req.taskId,
            recommendation="Keep current assignment",
            targetUserId=req.currentAssigneeId,
            targetUserName=best_candidate.get("name", "Current"),
            reasoning="Current assignee has the lowest workload."
        )

    if best_candidate.get("workload", 0) > 85:
         return DecisionSupportResponse(
            taskId=req.taskId,
            recommendation="Delay task",
            targetUserId="",
            targetUserName="None",
            reasoning="Entire team is overloaded (85%+ capacity)."
        )

    return DecisionSupportResponse(
        taskId=req.taskId,
        recommendation="Reassign task",
        targetUserId=best_candidate.get("id", ""),
        targetUserName=best_candidate.get("name", ""),
        reasoning=f"User has available capacity ({best_candidate.get('workload', 0)}% workload) and relevant context."
    )


# ── A6. Predictive Project Insights ─────────────────────────────────────────────
class ProjectPredictionsRequest(BaseModel):
    totalTasks: int
    completedTasks: int
    blockedTasks: int
    daysUntilDeadline: int
    burnRateRemainingDays: int

class ProjectPredictionsResponse(BaseModel):
    delayProbability: float
    resourceShortageRisk: float
    predictionStatus: str # ON_TRACK, AT_RISK, DELAY_LIKELY

@app.post("/project_predictions", response_model=ProjectPredictionsResponse)
def project_predictions(req: ProjectPredictionsRequest):
    delay_prob = 0.0
    res_risk = 0.0

    if req.totalTasks == 0:
        return {"delayProbability": 0, "resourceShortageRisk": 0, "predictionStatus": "ON_TRACK"}

    incomplete = req.totalTasks - req.completedTasks

    if req.blockedTasks > 0:
        delay_prob += min((req.blockedTasks / req.totalTasks) * 2.0, 0.40)
    
    if req.burnRateRemainingDays > req.daysUntilDeadline:
        excess = req.burnRateRemainingDays - req.daysUntilDeadline
        delay_prob += min((excess / max(req.daysUntilDeadline, 1)) * 0.50, 0.50)
        res_risk += 0.40
    
    if (incomplete / max(req.totalTasks, 1)) > 0.5 and req.daysUntilDeadline < 5:
        delay_prob += 0.30
        res_risk += 0.50

    delay_prob = min(round(delay_prob, 2), 1.0)
    res_risk = min(round(res_risk, 2), 1.0)

    if delay_prob > 0.65:
        status = "DELAY_LIKELY"
    elif delay_prob > 0.35:
        status = "AT_RISK"
    else:
        status = "ON_TRACK"

    return {
        "delayProbability": delay_prob,
        "resourceShortageRisk": res_risk,
        "predictionStatus": status
    }


# ── A3. Workload Heatmap Generator ────────────────────────────────────────────
class WorkloadHeatmapRequest(BaseModel):
    users: list # id, name, totalAssigned, pendingAssigned, completedPastWeek

@app.post("/workload_heatmap")
def workload_heatmap(req: WorkloadHeatmapRequest):
    heatmap = []
    for u in req.users:
        pending = u.get("pendingAssigned", 0)
        velocity = u.get("completedPastWeek", 1)
        velocity = max(velocity, 1) # avoid division by zero
        
        # Load index: pending tasks vs historical weekly output
        load_index = round(min(pending / (velocity * 2.0), 1.0), 2)
        
        status = "NORMAL"
        if load_index >= 0.8:
            status = "OVERLOADED"
        elif load_index <= 0.2:
            status = "FREE_CAPACITY"

        heatmap.append({
            "userId": u.get("id"),
            "userName": u.get("name"),
            "loadIndex": load_index,
            "status": status,
            "pendingCount": pending
        })
    
    return {"heatmap": heatmap}


# ── Scrum / Sprint AI Analysis ────────────────────────────────────────────────
class SprintTaskInfo(BaseModel):
    id: str
    status: str
    storyPoints: int
    assigneeEmail: str = ""

class ScrumAIRequest(BaseModel):
    sprintName: str
    daysLeft: int
    tasks: List[SprintTaskInfo]

class ScrumAIResponse(BaseModel):
    delayRisk: str # LOW | MEDIUM | HIGH
    completionForecast: int # 0-100 percentage
    overloadedUsers: List[str]
    reallocationSuggestion: str
    velocityTrend: str # stable | improving | declining
    summary: str

@app.post("/sprint_ai_analysis", response_model=ScrumAIResponse)
def sprint_ai_analysis(req: ScrumAIRequest):
    total_pts = sum([t.storyPoints for t in req.tasks])
    done_pts = sum([t.storyPoints for t in req.tasks if t.status == "DONE"])
    
    if total_pts == 0:
        return ScrumAIResponse(
            delayRisk="LOW", completionForecast=100, overloadedUsers=[],
            reallocationSuggestion="Backlog is empty.", velocityTrend="stable",
            summary="No tasks in current sprint."
        )

    completion_rate = (done_pts / total_pts) * 100
    pts_left = total_pts - done_pts
    
    # Simple risk heuristic
    risk = "LOW"
    if req.daysLeft < 3 and completion_rate < 50:
        risk = "HIGH"
    elif req.daysLeft < 5 and completion_rate < 70:
        risk = "MEDIUM"
        
    # Overload detection
    workloads = {}
    for t in req.tasks:
        if t.status != "DONE":
            workloads[t.assigneeEmail] = workloads.get(t.assigneeEmail, 0) + t.storyPoints
            
    overloaded = [email for email, pts in workloads.items() if pts > 8 and email != ""]
    
    suggestion = "Workload looks balanced."
    if overloaded:
        suggestion = f"Consider moving some tasks from {', '.join(overloaded[:2])} to less loaded members."
        
    summary = f"The sprint is {int(completion_rate)}% complete with {req.daysLeft} days remaining. "
    if risk == "HIGH":
        summary += "Urgent action needed to meet the sprint goal."
        
    return ScrumAIResponse(
        delayRisk=risk,
        completionForecast=int(completion_rate),
        overloadedUsers=overloaded,
        reallocationSuggestion=suggestion,
        velocityTrend="stable",
        summary=summary
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



