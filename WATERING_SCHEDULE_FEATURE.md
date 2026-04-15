# Watering Schedule & Email Notification Feature

## Overview
The AR Analysis workspace now has a **split three-step analysis flow** with progressive button availability and email notifications.

## Flow Steps

### Step 1️⃣: Sunlight Analysis Button
- **Title:** "1. Run Sunlight Analysis"
- **Color:** Emerald (green)
- **What it does:**
  - Analyzes sunlight compatibility at the selected location
  - Checks if the plant's sun requirements match the local conditions
  - Returns: Compatibility score (0-100), label, and summary
- **Data collected:** Temperature, humidity, precipitation, cloud coverage

### Step 2️⃣: Survival Analysis Button
- **Appears after:** Sunlight Analysis is complete ✓
- **Title:** "2. Run Survival Analysis"
- **Color:** Emerald (green)
- **What it does:**
  - Calculates plant survival percentage at this location
  - Considers multiple environmental factors
  - Returns: Survival percentage and contributing factors
- **UI Update:** Shows completed badge for Sunlight Analysis

### Step 3️⃣: Watering Schedule Button
- **Appears after:** Survival Analysis is complete ✓
- **Title:** "3. Create Watering Schedule & Send Email"
- **Color:** Blue (different from analysis buttons)
- **What it does:**
  - Generates personalized watering schedule based on:
    - Plant's water frequency requirements
    - Current and forecasted weather
    - Rain adjustments
  - **Sends email** to user with schedule details (if Gmail is configured)
  - Saves schedule to user's care plans
  - Returns: Next watering date and care notes
- **UI Update:** Shows completed badges for all previous steps

## Result Display

After each step, relevant analysis data appears below the buttons:
- **Weather Data:** Temperature, humidity, rain, cloud cover
- **Sunlight Match:** Only shown after sunlight analysis
- **Survival Estimate:** Only shown after survival analysis
- **Watering Schedule:** Only shown after schedule is created

## Email Notification

When the third button is clicked, an email is sent to the user containing:
- Plant name
- Location coordinates
- Next suggested watering date
- Weather-based recommendations
- Formatted HTML email with GreenScape branding

## Environment Setup

### For Local Development
```bash
# Add to .env.local
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-specific-password
```

### Getting Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Enable 2FA on your Google account (if not already enabled)
3. Select "Mail" and "Windows Computer" from dropdowns
4. Google will generate a 16-character password
5. Copy this password (not your regular Gmail password!)
6. Use it for `GMAIL_PASSWORD` in `.env`

### For Production (Vercel)
Add both `GMAIL_USER` and `GMAIL_PASSWORD` to Vercel Environment Variables:
- Go to Project Settings → Environment Variables
- Add the two variables
- Redeploy the project

## API Endpoints

### New/Updated Endpoint
**POST** `/api/care/watering`

Request body:
```json
{
  "plantId": "string",
  "lat": 23.8103,
  "lng": 90.4125,
  "plantName": "Monstera",
  "wateringSchedule": {
    "nextSuggestedWater": "2024-04-20T10:00:00Z",
    "adjustedForRain": true,
    "notes": ["Water thoroughly", "Check soil moisture"]
  }
}
```

Response:
```json
{
  "ok": true,
  "carePlans": [...],
  "message": "Watering schedule created and email notification sent!"
}
```

## Backend Files Modified

1. **src/app/ar/[plantId]/ArClient.tsx**
   - Split single analysis button into 3 sequential buttons
   - Added state tracking for each analysis step
   - Conditional rendering based on completion status

2. **src/app/api/care/watering/route.ts**
   - Updated to handle email sending
   - Added location coordinates to care plan
   - Integrated email utility

3. **src/lib/email.ts** (NEW)
   - Email utility with nodemailer integration
   - Two functions: `sendWateringScheduleEmail()` and `sendWateringReminderEmail()`
   - Formatted HTML email templates

4. **package.json**
   - Added `nodemailer` dependency

5. **.env.example**
   - Added `GMAIL_USER` and `GMAIL_PASSWORD` documentation

6. **README.md**
   - Added watering schedule feature documentation

7. **DEPLOYMENT_READINESS.md**
   - Added Gmail setup instructions
   - Updated environment variables table

## Testing Checklist

- [ ] Navigate to an AR workspace (/ar/[plantId])
- [ ] Set location on map
- [ ] Click "1. Run Sunlight Analysis" button
- [ ] Verify sunlight data appears
- [ ] Verify "2. Run Survival Analysis" button appears
- [ ] Click survival analysis button
- [ ] Verify survival data appears
- [ ] Verify "3. Create Watering Schedule" button appears
- [ ] Click watering schedule button (with Gmail configured)
- [ ] Verify email is received
- [ ] Verify care plan is saved to user account
- [ ] Test without Gmail credentials (should create schedule but skip email)

## Error Handling

- Missing Gmail credentials: Schedule created, email skipped (logged as warning)
- Invalid plant ID: Returns 404 error
- Unauthorized user: Returns 401 error
- Invalid request payload: Returns 400 error

## Future Enhancements

- [ ] Scheduled email reminders before watering date
- [ ] SMS notifications as alternative to email
- [ ] Push notifications in mobile app
- [ ] Watering history tracking
- [ ] Notification frequency customization
- [ ] Multi-language email templates
