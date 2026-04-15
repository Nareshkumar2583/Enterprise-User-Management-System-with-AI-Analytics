# 🚀 Enterprise User Management System with AI Analytics

## 📌 Project Overview
The Enterprise User Management System with AI Analytics is a full-stack web application designed to manage users, tasks, and support tickets within an organization. It integrates Artificial Intelligence to provide smart insights such as risk detection, anomaly detection, burnout analysis, and predictive project insights.

This system helps organizations improve productivity, automate workflows, and enhance decision-making.

---

## 🎯 Problem Statement
In many organizations, managing users, assigning tasks, and handling support requests is difficult and time-consuming. Traditional systems lack intelligent insights, which leads to delays, poor workload distribution, and reduced efficiency.

---

## 🚀 Solution
This system provides a centralized platform where:
- Admins manage users and tasks  
- Users track work and raise issues  
- AI automates decisions and provides insights  

---

## 🌟 Key Features

### 👤 User Features
- Secure login and authentication (JWT)
- Personal dashboard with task overview
- Kanban board (To Do → In Progress → Done)
- Time tracking (stopwatch)
- Raise and track support tickets
- Notifications and progress updates
- Performance insights

---

### 🧑‍💼 Admin Features
- User management (Add, Update, Delete)
- Role-based access control
- Task assignment and monitoring
- Smart ticket management system
- Organization analytics dashboard
- Audit logs tracking
- Alerts for suspicious activity

---

### 🤖 AI Features
- AI-based ticket classification and routing
- Risk prediction based on user behavior
- Anomaly detection for security
- Burnout detection using workload analysis
- Predictive project insights (delay prediction)
- AI assistant for quick system queries

---

## 🧱 Tech Stack

### Frontend
- React.js
- HTML, CSS, JavaScript

### Backend
- Node.js / Spring Boot
- REST APIs

### AI/ML
- FastAPI
- scikit-learn
- River (online learning)

### Database
- MongoDB

### Authentication
- JWT (JSON Web Token)

---


## 📂 Project Structure
```
frontend/
backend/
ml-service/
```

---

# ▶️ How to Run the Project

## 🔹 1. Clone Repository
```bash
git clone https://github.com/Nareshkumar2583/Enterprise-User-Management-System-with-AI-Analytics.git
cd Enterprise-User-Management-System-with-AI-Analytics
```
⚙️ 2. Run Backend
```
cd backend
npm install
npm start
```
👉 Backend runs at: http://localhost:5000

🤖 3. Run ML Service
```
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload
```

👉 ML service runs at: http://localhost:8000

🎨 4. Run Frontend
```
cd frontend
npm install
npm start
```

👉 Frontend runs at: http://localhost:3000

---

![Admin Dashboard](./Image/AdminDashboard.png)
![User Dashboard](./Image/UserDashboard.png)

🧑‍💻**Author**
Naresh Kumar S
Full Stack Developer | Java | React | AI-Driven Applications
