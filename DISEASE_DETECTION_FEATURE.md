# Plant Disease Detection Feature

## Overview

The plant disease detection system uses **AI-powered image analysis** to identify plants and detect diseases from leaf images. It supports both live detection via Plant.id API and mock data for development/testing.

## Features

### Live Disease Detection (with API Key)
- 🌱 **Plant Identification** - Identifies the plant species from leaf image
- 🔍 **Disease Detection** - Detects multiple diseases and health issues
- 📊 **Confidence Scores** - Probability percentages for each detection
- 💊 **Treatment Recommendations** - Detailed care instructions
- 🎯 **Similar Images** - Shows related reference images

### Mock Mode (without API Key)
- Useful for UI testing and development
- Realistic sample data with common plant diseases
- No external API calls required
- Disabled by default but can be enabled during development

## Setup

### Option 1: Without Plant.id API (Mock Mode)
By default, the disease detection page displays mock data suitable for UI testing. No setup required!

Visit: `http://localhost:3000/disease`

### Option 2: With Plant.id API (Live Detection) ⭐ Recommended

#### Step 1: Create Plant.id Account
1. Go to https://plant.id/
2. Click "Sign up" and create your account
3. Verify your email

#### Step 2: Get API Key
1. Log in to your Plant.id account
2. Go to **Account Settings** or **Dashboard**
3. Find **API Keys** section
4. Copy your API key

#### Step 3: Add to Environment
For **local development** (`.env.local`):
```env
PLANT_ID_API_KEY=your-api-key-here
```

For **production** (Vercel):
- Go to Project Settings → Environment Variables
- Add key: `PLANT_ID_API_KEY`
- Paste your API key as value
- Redeploy

#### Step 4: Test
1. Restart your dev server
2. Visit `http://localhost:3000/disease`
3. Upload a leaf image
4. Should see live detection with confidence scores

## API Response Format

### Live Response (Plant.id API)
```json
{
  "source": "plant.id-live",
  "plant": {
    "name": "Monstera Deliciosa",
    "probability": 0.95,
    "similar_images": 5
  },
  "health": {
    "status": "Issues detected",
    "diseases": [
      {
        "name": "Leaf Spot",
        "probability": 0.72,
        "treatment": "Remove affected leaves, improve air circulation...",
        "severity": "Moderate"
      }
    ]
  }
}
```

### Mock Response (Development)
```json
{
  "source": "mock",
  "plant": {
    "name": "Monstera Deliciosa (Mock)",
    "probability": 0.95,
    "similar_images": 3
  },
  "health": {
    "status": "Issues detected",
    "diseases": [
      {
        "name": "Interveinal chlorosis",
        "probability": 0.65,
        "treatment": "Check soil pH and micronutrients...",
        "severity": "Moderate"
      }
    ]
  },
  "note": "This is a mock response..."
}
```

## Endpoints

### POST `/api/disease`

**Request:**
- Multipart form with image file
- Field name: `image`
- Formats: JPG, PNG, WebP

```bash
curl -X POST http://localhost:3000/api/disease \
  -F "image=@/path/to/leaf.jpg"
```

**Response:**
- Live detection data (if API key set)
- Mock data (if API key not set)
- Error details (if upload fails)

## Frontend Usage

### Leaf Health Scan Page (`/disease`)

**Features:**
- 📸 Image upload with preview
- 🎨 Card-based disease display
- 🏷️ Severity badges (High/Moderate/Low)
- 📊 Confidence percentage display
- 📝 Treatment recommendations
- 🌿 How-to guide

**Flow:**
1. User selects image file
2. Image preview shows on left
3. API processes image
4. Results display on right
5. Plant info, health status, and diseases shown

## Severity Classification

| Severity | Probability | Color | Action |
|----------|-------------|-------|--------|
| High | > 70% | Red | Immediate treatment required |
| Moderate | 40-70% | Yellow | Monitor and treat soon |
| Low | < 40% | Blue | Monitor for changes |

## Backend Files

### Files Modified/Created

1. **src/app/api/disease/route.ts**
   - `/api/disease` endpoint
   - Handles Plant.id API calls
   - Returns formatted disease data
   - Includes mock data generator

2. **src/app/disease/page.tsx**
   - Disease detection UI
   - Image upload and preview
   - Results display with formatting
   - Responsive design

3. **src/types/nodemailer.d.ts** (NEW)
   - TypeScript declarations for nodemailer

## Usage Tips

### For Best Results:
- ✅ Clear, well-lit photos
- ✅ Leaf fills most of frame
- ✅ Sharp focus on affected area
- ✅ Both healthy and diseased parts visible
- ✅ JPG or PNG format

### What to Avoid:
- ❌ Blurry or out-of-focus images
- ❌ Poor lighting
- ❌ Leaf too small in frame
- ❌ Hand or other objects covering leaf
- ❌ Entire plant image (leaf close-up needed)

## Pricing

### Plant.id API
- **Free tier:** ~100 API calls/month
- **Starter:** $1.99/month for 400 calls
- **Pro:** $9.99/month for 5,000 calls
- **Enterprise:** Custom pricing

Perfect for development and small to medium deployments.

## Error Handling

### Common Errors

**API Key Not Set**
- Returns mock data (not an error)
- Check `.env.local` for `PLANT_ID_API_KEY`

**Image Upload Failed**
- Check file format (JPG/PNG/WebP)
- Verify file size < 10MB
- Ensure multipart request

**Plant.id API Error**
- Network timeout
- Invalid API key
- Rate limit exceeded
- Check Plant.id account status

## Testing Checklist

- [ ] Mock mode works without API key (`/disease` page loads)
- [ ] Can upload image file
- [ ] Image preview shows selected file
- [ ] Mock response displays correctly
- [ ] Add Plant.id API key to `.env.local`
- [ ] Restart dev server
- [ ] Live API detection works
- [ ] Plant name shows correctly
- [ ] Disease names display
- [ ] Confidence scores show
- [ ] Treatment recommendations visible
- [ ] Severity badges show correct colors
- [ ] Error handling on bad image

## Future Enhancements

- [ ] Multiple image submissions for comparison
- [ ] Disease history tracking
- [ ] Treatment progress photos
- [ ] Watering recommendations based on disease
- [ ] Community plant health forum
- [ ] Automated reminders for treatment follow-up
- [ ] Video submission support
- [ ] Batch API processing for multiple images
