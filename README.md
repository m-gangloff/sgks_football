# SGKS Football Statistics

A web application for tracking football statistics for your handball club, specifically focusing on goalscorers. The application allows easy addition, modification, and deletion of match entries from a mobile phone (Android).

## Features

- **Player Management**: Add, edit, and delete players with birthdate information
- **Match Tracking**: Record matches with detailed goalscorer information
- **Statistics**: View player statistics including goals and own goals per match
- **Backup System**: Create and download database backups
- **Authentication**: Two-tier password protection for data security

## Authentication System

The application uses a two-tier authentication system:

1. **Global Password**: Required to access the app at all (shared with team members)
2. **Admin Password**: Required to enable editing features (only for administrators)

### Setting Up Passwords

The application requires environment variables for passwords. **No default passwords are provided for security reasons.**

1. **Copy the sample environment file**:
   ```bash
   cd backend
   cp .env.sample .env
   ```

2. **Edit the .env file** with your actual passwords:
   ```bash
   # Football Statistics App Environment Variables
   # Copy this file to .env and fill in your actual passwords
   
   # Global password for accessing the app (shared with team members)
   GLOBAL_PASSWORD=your_shared_password_here
   
   # Admin password for editing capabilities (keep private)
   ADMIN_PASSWORD=your_admin_password_here
   ```

**Important Security Notes**:
- The `.env` file is automatically ignored by Git
- Never commit your actual passwords to version control
- Use strong, unique passwords for both global and admin access
- Share the global password with team members, keep the admin password private

### Authentication Flow

1. **First Access**: Users must enter the global password to view data
2. **Admin Mode**: Administrators can enter the admin password to enable editing
3. **Session Persistence**: Authentication state is saved in the browser
4. **Individual Control**: Each user manages their own authentication state

## Setup

### Backend Setup

1. **Create Conda Environment**:
   ```bash
   conda create -n sgks_football python=3.11
   conda activate sgks_football
   ```

2. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Set Up Environment Variables**:
   ```bash
   cp .env.sample .env
   # Edit .env file with your actual passwords
   ```

4. **Run Backend**:
   ```bash
   uvicorn app.main:app --reload
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run Frontend**:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## Usage

### For Team Members (Global Access)
1. Open the web app
2. Enter the shared global password
3. View players, matches, and statistics
4. Access is read-only

### For Administrators (Admin Access)
1. Open the web app
2. Enter the shared global password
3. Click "Enable Admin Mode" and enter the admin password
4. Full access to add, edit, and delete data
5. Can create database backups

### Adding Players
- Navigate to the Players page
- Fill in name and birthdate
- Click "Add Player"

### Adding Matches
- Navigate to the Matches page
- Select date
- Add goalscorers with their goals and own goals
- Scores are automatically calculated
- Click "Add Match"

### Viewing Statistics
- Click on any player to see detailed statistics
- View goals per match with dates and scores
- Click on any match to see goalscorer breakdown

### Creating Backups
- Navigate to the Backups page
- Click "Create New Backup"
- Backup file will be automatically downloaded
- Backup list shows all available backups

## Database

The application uses SQLite for data storage. The database file is located at `backend/football.db`.

### Backup and Restore

**Creating Backups**:
- Use the web interface (admin access required)
- Backups are automatically downloaded to your device
- Backup files are stored in `backend/backups/`

**Restoring Backups**:
1. Stop the web application
2. Rename the backup file to `football.db`
3. Replace the existing `football.db` file in the backend directory
4. Restart the web application

## Testing

Run the backend tests:
```bash
cd backend
PYTHONPATH=. pytest
```

## File Structure

```
sgks_football/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── crud.py          # Database operations
│   │   └── database.py      # Database configuration
│   ├── requirements.txt     # Python dependencies
│   └── football.db          # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API functions
│   │   └── App.jsx         # Main app component
│   └── package.json        # Node.js dependencies
└── README.md
```

## Security Notes

- Change the default passwords immediately
- The global password should be shared only with team members
- The admin password should be kept private
- Authentication state is stored in browser localStorage
- Each user's authentication is independent
- Passwords are transmitted securely over HTTPS (in production)

## Future Enhancements

- User accounts with individual permissions
- More detailed statistics and analytics
- Export functionality for reports
- Mobile app version
- Real-time updates for multiple users
