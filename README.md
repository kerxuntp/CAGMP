# CAGMP

Major Project: Changi Experience Studio Game Management Platform

## Overview

This project is a full-stack web application for managing interactive games and experiences at Changi Airport. It features a React + Vite frontend and an Express/MongoDB backend. Admins can customise the landing page, manage collections, questions, usernames, and more.

## Features

- Customisable landing page (background, button styles, text)
- Manage collections and questions
- Prohibited username management
- Admin dashboard and roles
- Leaderboard and game settings

## Tech Stack

- Frontend: React 19, Vite
- Backend: Express, MongoDB (Mongoose)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/<your-org-or-username>/CAGMP.git
cd CAGMP/MP_Code
```

### 2. Install dependencies

#### Frontend

```bash
cd client
npm install
```

#### Backend

```bash
cd ../server
npm install
```

### 3. Environment Variables

#### Frontend (`client/.env`)

```
REACT_APP_API_BASE_URL=https://api-cesmp.onrender.com
```

#### Backend (`server/.env`)

```
APP_SECRET=your_secret
DB_CONNECT=your_mongodb_connection_string
PORT=5000
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:5173
```

> **Note:** `.env` files are ignored by git for security. Set these up locally or in your deployment platform.

### 4. Running Locally

#### Backend

```bash
cd server
npm start
```

#### Frontend

```bash
cd client
npm run dev
```

### 5. Deployment

- Frontend can be hosted on GitHub Pages, Vercel, Netlify, etc.
- Backend can be hosted on Render, Heroku, or similar platforms.
- Update your frontend `.env` to point to your backend’s public URL.

## Useful Links

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)

---

For questions or contributions, open an issue or pull request!
