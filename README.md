# 💼 Job Portal - Backend

REST API server for the Job Portal web application. Built with Node.js, Express, and MongoDB.

🔗 **Live API:** [job-portal-server-mauve-kappa.vercel.app](https://job-portal-server-mauve-kappa.vercel.app)  
🔗 **Frontend Repo:** [job-portal-client](https://github.com/lizafh/job-portal-client)  
🔗 **Live Site:** [job-portal-da77d.web.app](https://job-portal-da77d.web.app)

---

## 🛠️ Tech Stack
- Node.js
- Express.js
- MongoDB Atlas
- JSON Web Token (JWT)
- Cookie Parser
- CORS

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/jwt` | Generate JWT token |
| POST | `/logout` | Clear JWT cookie |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jobs` | Get all jobs |
| GET | `/jobs?email=hr@email.com` | Get jobs by recruiter |
| GET | `/jobs/:id` | Get single job |
| POST | `/jobs` | Post a new job |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/job-application?email=user@email.com` | Get applications by user (protected) |
| GET | `/job-applications/jobs/:job_id` | Get applications for a job |
| POST | `/job-applications` | Submit a job application |
| PATCH | `/job-applications/:id` | Update application status |

---

## 🔐 Security
- JWT stored in httpOnly cookies
- Token verification middleware on protected routes
- CORS configured for specific origins only
- Environment variables for all credentials

---

## 🚀 Run Locally

```bash
git clone https://github.com/lizafh/job-portal-backend
cd job-portal-backend
npm install
nodemon index.js
```

Create `.env` file:
```env
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
ACCESS_TOKEN_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

---

## 🌐 Deployment
Deployed on **Vercel** with automatic redeployment on every GitHub push.

---

## 👩‍💻 Developer

**Sharmin Akter Liza**  
Full Stack Web Developer  
🔗 [GitHub](https://github.com/lizafh) | [Fiverr](https://www.fiverr.com/devbyliza)
