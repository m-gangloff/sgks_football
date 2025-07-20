# SGKS Football Stats Web App

A web application to track and analyze football statistics for SGKS, with a focus on goalscorers, match results, and player stats. Built with FastAPI (Python) for the backend and React (Vite, Material UI) for the frontend.

## Features
- Add, edit, and delete players
- Add, edit, and delete matches
- Track goals and own goals per player and match
- View player stats and match details
- Bulk actions: add default players, delete all players/matches
- Mobile-friendly, modern UI

## Project Structure
```
sgks_football/
  backend/    # FastAPI backend (Python, SQLite)
  frontend/   # React frontend (Vite, Material UI)
```

## Setup Instructions

### Backend (FastAPI)
1. **Create and activate a conda environment:**
   ```sh
   conda create -n sgks_football python=3.11 -y
   conda activate sgks_football
   ```
2. **Install dependencies:**
   ```sh
   pip install -r backend/requirements.txt
   ```
3. **Run the backend server:**
   ```sh
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
4. **API docs available at:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend (React)
1. **Install dependencies:**
   ```sh
   cd frontend
   npm install
   ```
2. **Run the frontend dev server:**
   ```sh
   npm run dev
   ```
3. **App available at:** [http://localhost:5173](http://localhost:5173)

## Usage
- **Players:** Add, edit, delete, and view player stats. Add default players with one click.
- **Matches:** Add matches with date, goalscorers, and own goals. Scores are computed from goalscorers. View, sort, and delete matches.
- **Bulk Actions:** Delete all players or matches with one click.

## Notes
- The backend uses SQLite for easy local development.
- CORS is enabled for local frontend-backend communication.
- All player and match data is editable and deletable from the UI.
