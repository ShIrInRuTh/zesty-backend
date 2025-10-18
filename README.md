# zesty-backend

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- npm

### 🔧 Installation

1. Clone the repository:

   ```bash
   git clone [clone-url]
   cd backend
   ```

2. Install dependencies:

```bash
npm install
```

3. Create a .env file for environment variables (see example below).

### ▶️ Running the App

To start the server in development mode using nodemon:

```bash
npm run dev
```

Once started, the server will run at:

```bash
http://localhost:8000/
```

If you want to check if the backend works, just put the link in the browser and you shld see this

![Server status screenshot](./image.png)

### 📁 File Structure

```bash
sanitas-backend/
├── controller/           # Handles route logic
│   └── authController.js
├── model/                # Business logic or data simulation
│   └── healthModel.js
├── routes/               # Route definitions
│   └── routers.js
├── public/               # Static files served by Express
├── server.js             # Main entry point
├── package.json
└── .env                  # (Optional) Environment variables
```

🌐 API Endpoints
Health Check
GET /api/healthcheck

Returns:

```bash
{
  "message": "App is working well"
}
```

### 4. ✅ Commit Message Format

Please refer to the COMMIT_MESSAGES.md file in the root directory for the standard commit message format used in this project.

### 5. 🧪 Example .env File

```bash
# Required to run the app
# Fill up later
SERVER_BASE_URL='http://localhost:8000'
CLIENT_BASE_URL='http://localhost:3000'
SUPABASE_URL='https://eogovjmmjyzzzlkuyohc.supabase.co'
SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZ292am1tanl6enpsa3V5b2hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDAzOTcsImV4cCI6MjA3MjMxNjM5N30.pxauv2cbD4xoQ52aezJ_aDjsKDanLco4FcvAcPA1tz4'
DB_PASSWORD='weW1nn1ngTh15Guy5!'
PORT=8000

# Later below API keys will be added
```

This will be updated accordingly as we go forward coding!
