# How to Add Team Member Photos

## Quick Guide

All social media icons have been removed. The page is now ready for actual team photos!

## Where to Place Images

### Option 1: Public Folder (Recommended)
1. Create folder structure: `frontend/public/images/team/`
2. Add your images there:
   - `aryan.jpg` - Aryan Nayak
   - `swati.jpg` - Swati Smita Sahu
   - `manaswinee.jpg` - Manaswinee Tripathy
   - `swayam.jpg` - Swayam Pujari

### Option 2: Src Assets Folder
1. Create folder: `frontend/src/assets/team/`
2. Add images
3. Import them at the top of `AboutUs.jsx`

## Update the Code

### Using Public Folder

In `AboutUs.jsx`, change the `image` values from `null` to:

```javascript
const teamMembers = [
    {
        name: 'Aryan Nayak',
        role: 'Team Leader',
        image: '/images/team/aryan.jpg'  // ← Add image path here
    },
    {
        name: 'Swati Smita Sahu',
        role: 'Team Member',
        image: '/images/team/swati.jpg'  // ← Add image path here
    },
    {
        name: 'Manaswinee Tripathy',
        role: 'Team Member',
        image: '/images/team/manaswinee.jpg'  // ← Add image path here
    },
    {
        name: 'Swayam Pujari',
        role: 'Team Member',
        image: '/images/team/swayam.jpg'  // ← Add image path here
    }
];
```

### Using Src Assets (with imports)

```javascript
// At top of file
import aryanImg from '../assets/team/aryan.jpg';
import swatiImg from '../assets/team/swati.jpg';
import manaswineeImg from '../assets/team/manaswinee.jpg';
import swayamImg from '../assets/team/swayam.jpg';

// Then use in teamMembers array
const teamMembers = [
    {
        name: 'Aryan Nayak',
        role: 'Team Leader',
        image: aryanImg
    },
    // ... etc
];
```

## Image Recommendations

For best results:
- **Format**: JPG or PNG
- **Size**: 800x800px (square) or similar aspect ratio
- **File size**: Under 500KB each (compress if needed)
- **Style**: Professional headshots with consistent lighting/background

## What Changed

✅ **Removed:**
- All LinkedIn icons and links
- All GitHub icons and links  
- All Email icons and links
- Social media placeholders

✅ **Added:**
- Image display logic
- Conditional rendering: shows image if available, gradient placeholder if not
- Centered text layout
- Proper image scaling and hover effects

## Example File Structure

```
frontend/
├── public/
│   └── images/
│       └── team/
│           ├── aryan.jpg
│           ├── swati.jpg
│           ├── manaswinee.jpg
│           └── swayam.jpg
└── src/
    └── pages/
        └── AboutUs.jsx
```

## Test It

After adding images:
1. Refresh the page
2. Images should appear in the team member cards
3. Hover over cards to see the zoom effect
4. If images don't load, check the browser console for path errors

That's it! Your About Us page is now ready for professional team photos. 📸
