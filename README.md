# Scholars Hub 📚 — Student Social Media Platform

A modern social media platform for students to share study materials including PDFs, images, YouTube videos, and playlists.

## Tech Stack
- **Frontend:** React.js + Tailwind CSS (Vite)
- **Backend:** Node.js + Express.js (Vercel Serverless Functions)
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Google Drive / Supabase Storage
- **Auth:** Supabase Auth

---

## Prerequisites

1. **Node.js** (v18+): Download from https://nodejs.org/
2. **Supabase Project**: Create at https://supabase.com/ (free tier)
3. **Google Drive API** (optional): For file storage

---

## Local Development

### 1. Clone / Navigate to project
```bash
cd Scholars Hub
```

### 2. Install all dependencies
```bash
npm run install:all
```

### 3. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with your credentials:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_DRIVE_CLIENT_EMAIL=your_client_email
GOOGLE_DRIVE_PRIVATE_KEY=your_private_key
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
```

Start the backend:
```bash
npm run dev     # development with auto-reload
# or
npm start       # production
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` with:
```env
VITE_API_URL=/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

---

## Deploy to Vercel

### 1. Push your code to a GitHub repository

### 2. Import the project in [Vercel](https://vercel.com)
- Select the repository
- Vercel auto-detects the `vercel.json` config
- Framework preset: **Other** (the config handles everything)

### 3. Set Environment Variables in Vercel Dashboard
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_URL=/api
GOOGLE_DRIVE_CLIENT_EMAIL
GOOGLE_DRIVE_PRIVATE_KEY
GOOGLE_DRIVE_FOLDER_ID
```

### 4. Deploy
Vercel will:
- Install frontend & backend dependencies
- Build the Vite frontend to `frontend/dist`
- Serve static frontend files
- Route `/api/*` requests to the Express serverless function

---

## Project Structure

```
Scholars Hub/
├── backend/
│   ├── config/
│   │   └── cloudinary.js       # Cloudinary + Multer config
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js             # Register, login, me
│   │   ├── posts.js            # CRUD, like, comment, report
│   │   ├── users.js            # Profile, follow, bookmark
│   │   └── notifications.js    # Get & mark read
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx      # Sidebar + bottom nav
│   │   │   ├── PostCard.jsx    # Post display component
│   │   │   └── PostSkeleton.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── Feed.jsx
│   │   │   ├── Explore.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── PostDetail.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Bookmarks.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── api.js              # Axios API client
│   │   ├── utils.js            # Helpers, subjects, colors
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind + custom styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## Features

### Authentication
- Registration with name, email, password, school, subjects
- JWT-based login with token stored in localStorage
- Protected routes

### 4 Post Types
- **PDF Upload** — Upload PDF files with download button
- **Image Upload** — Single or multiple images
- **YouTube Video** — Paste URL, auto-embed player
- **YouTube Playlist** — Paste playlist URL, auto-embed

### Social Features
- Like / Unlike posts
- Comment on posts
- Bookmark / Save posts
- Follow / Unfollow students
- Notifications (new follower, like, comment)

### Feed & Explore
- Feed shows posts from followed users + trending
- Explore page with subject filters and search
- Infinite scroll pagination

### Design
- Dark / Light mode toggle
- Responsive: sidebar on desktop, bottom nav on mobile
- Color scheme: Navy blue + Yellow accent
- Fonts: Space Grotesk (headings) + Inter (body)
- Loading skeletons
- Subject-colored badges

---

## API Endpoints

| Method | Route                      | Description          |
|--------|----------------------------|----------------------|
| POST   | /api/auth/register         | Register new user    |
| POST   | /api/auth/login            | Login                |
| GET    | /api/auth/me               | Get current user     |
| GET    | /api/posts                 | Feed (paginated)     |
| POST   | /api/posts                 | Create post          |
| GET    | /api/posts/explore         | Explore with filters |
| GET    | /api/posts/:id             | Single post          |
| POST   | /api/posts/:id/like        | Like/unlike          |
| POST   | /api/posts/:id/comment     | Add comment          |
| POST   | /api/posts/:id/report      | Report post          |
| DELETE | /api/posts/:id             | Delete post          |
| GET    | /api/users/:id             | User profile + posts |
| PUT    | /api/users/:id             | Edit profile         |
| POST   | /api/users/:id/follow      | Follow/unfollow      |
| POST   | /api/users/bookmark/:id    | Bookmark/unbookmark  |
| GET    | /api/users/:id/bookmarks   | Get bookmarked posts |
| GET    | /api/notifications         | Get notifications    |
| PUT    | /api/notifications/read    | Mark all read        |

