# Setup Instructions for Macro Tracker MVP

Follow these steps to get the application running:

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ and npm installed
- Terminal/Command Prompt access

## Step 1: Set Up the Backend

1. Open a terminal and navigate to the backend directory:
```bash
cd C:\Users\User\Desktop\macro-tracker\backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:
```bash
python main.py
```

You should see output indicating the server is running on `http://0.0.0.0:8000`

**Keep this terminal window open!**

## Step 2: Set Up the Frontend

1. Open a **NEW** terminal window and navigate to the frontend directory:
```bash
cd C:\Users\User\Desktop\macro-tracker\frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the Next.js development server:
```bash
npm run dev
```

You should see output indicating the app is running on `http://localhost:3000`

**Keep this terminal window open too!**

## Step 3: Use the Application

1. Open your web browser and go to: `http://localhost:3000`

2. Fill out the onboarding form with your profile information:
   - Age, height, weight, gender
   - Select your travel intensity (Low, Moderate, or High)
   - Choose your goal (Lose, Maintain, or Gain weight)

3. Click "Calculate My Macros" to see your personalized macro targets!

4. The dashboard will show:
   - Circular progress bars for Calories, Protein, Carbs, and Fat
   - Remaining macros for the day
   - LLM-ready JSON output for AI coach integration

## API Documentation

To explore the API endpoints interactively:
- Visit `http://localhost:8000/docs` while the backend is running

## Troubleshooting

### Backend won't start
- Make sure Python is installed: `python --version`
- Check if port 8000 is already in use
- Verify all dependencies installed correctly

### Frontend won't start
- Make sure Node.js is installed: `node --version`
- Delete `node_modules` and run `npm install` again
- Check if port 3000 is already in use

### Connection Error in Browser
- Ensure the backend is running on `http://localhost:8000`
- Check browser console for CORS errors
- Verify both servers are running simultaneously

## Next Steps

- Test the `/log-food` endpoint to track consumed macros
- Integrate with an AI nutrition coach using the LLM-ready JSON output
- Deploy to production (Vercel for frontend, Railway/Render for backend)

Enjoy tracking your macros on the go! 🎯
