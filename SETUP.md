# 🌟 Whisper Walls - Setup Instructions

Welcome to **Whisper Walls** - a location-based anonymous messaging app where you can leave emotional whispers at meaningful places for others to discover!

## 📱 What is Whisper Walls?

- **Leave anonymous messages** at specific locations (GPS coordinates)
- **Discover whispers** left by others when you're near those locations
- **Emotional categories**: Joy, Longing, Gratitude, Apology, Heartbreak
- **Proximity unlocking**: Walk close to whisper pins and wait to unlock messages
- **React with hugs** 🤗 to show support
- **Completely anonymous** - no accounts or personal info needed

---

## 🚀 Quick Setup for Friends

### **Option 1: Just Want to Use the App? (Easiest)**

1. **Install Expo Go** on your phone:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Get the app link** from your friend who set up the server
3. **Scan QR code** or open the expo link
4. **Done!** 🎉 Start discovering whispers!

### **Option 2: Full Development Setup**

Follow the steps below if you want to contribute to development or run your own instance.

---

## 💻 Full Development Setup

### **Prerequisites**
- **Node.js** 18+ ([Download here](https://nodejs.org/))
- **Git** ([Download here](https://git-scm.com/))
- **Phone with Expo Go app** installed
- **MongoDB Atlas account** (free) for shared database

### **Step 1: Clone the Repository**
```bash
git clone <your-github-repo-url>
cd whisper-walls-bolt
```

### **Step 2: Setup Frontend (React Native App)**
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your settings
# For local development, replace with your computer's IP:
# EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000/api
# Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

**To find your computer's IP:**
- **Windows**: Run `ipconfig` and look for "IPv4 Address"
- **Mac/Linux**: Run `ifconfig` and look for your network interface IP

### **Step 3: Setup Backend Server**
```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit server/.env file:
# For shared database, use MongoDB Atlas connection string
# PORT=3000
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whisper-walls
```

### **Step 4: Get MongoDB Atlas (Shared Database)**

1. **Go to** [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create free account** and cluster
3. **Create database user** with read/write permissions
4. **Get connection string** and put it in `server/.env`
5. **Whitelist your IP** (or use 0.0.0.0/0 for development)

### **Step 5: Start Everything**

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```
*Should show: "Whisper Walls backend running on port 3000"*

**Terminal 2 - Start Frontend:**
```bash
# From main project folder
npx expo start
```
*Should show QR code*

### **Step 6: Open on Your Phone**
1. **Scan QR code** with Expo Go app
2. **Allow location permissions** when prompted
3. **Go through onboarding** tutorial
4. **Start creating and discovering whispers!** 🎉

---

## 🌍 Using the App

### **Creating Whispers**
1. Tap the **"+"** button on map screen
2. Write your message (max 280 characters)
3. Choose emotional tone
4. Optionally add "why here?" context
5. Tap **Create** - whisper saves at your current location!

### **Discovering Whispers**
1. **Walk around** - pins appear on map near whisper locations
2. **Tap a pin** to see preview
3. **Walk close** to the pin (within 100 meters)
4. **Wait 60 seconds** near the location
5. **Whisper unlocks** - read the full message!
6. **React with hug** 🤗 to show support

### **Emotional Categories**
- 💛 **Joy** - Happy moments and celebrations
- 💙 **Longing** - Missing someone or something
- 💚 **Gratitude** - Thankful messages
- 🧡 **Apology** - Sorry messages and regrets
- ❤️ **Heartbreak** - Sad moments and losses

---

## 🔧 Development Tips

### **Useful Commands**
```bash
# Restart backend server manually
cd server
npm run dev
# Type 'rs' and press Enter to restart

# Clear React Native cache
npx expo start --clear

# Check backend health
curl http://localhost:3000/api/health
```

### **Common Issues & Solutions**

**"Using mock data" messages:**
- Backend server not running or wrong IP in `.env`
- Check your computer's IP address changed
- Update `EXPO_PUBLIC_API_URL` in `.env`

**Location permissions denied:**
- Enable location in phone settings
- Restart the app

**MongoDB connection error:**
- Check Atlas connection string in `server/.env`
- Verify IP whitelist in Atlas dashboard
- Ensure database user has correct permissions

**Expo Go app crashes:**
- Check terminal for error messages
- Clear cache: `npx expo start --clear`
- Restart Expo Go app

---

## 📂 Project Structure

```
whisper-walls-bolt/
├── app/                    # React Native screens
│   ├── (onboarding)/      # Welcome & permissions
│   └── (tabs)/            # Main app (map, create, profile)
├── components/            # Reusable UI components
├── services/              # API calls to backend
├── server/                # Node.js backend
│   ├── index.js          # Main server file
│   └── package.json      # Server dependencies
├── .env                   # Frontend environment variables
└── server/.env           # Backend environment variables
```

---

## 🎯 Next Steps

Once you have the app running:

1. **Create your first whisper** at a meaningful location
2. **Walk around** and discover whispers from others
3. **Share the app** with more friends for a richer experience
4. **Contribute** to development by adding features!

---

## 🆘 Need Help?

**Common Questions:**
- **Can't see other whispers?** Make sure you're using the same backend/database
- **App not connecting?** Check your IP address in `.env` file
- **Permissions issues?** Enable location access in phone settings

**For developers:**
- Check terminal outputs for error messages
- Verify environment variables are set correctly
- Test backend health endpoint: `http://your-ip:3000/api/health`

---

## 🌟 Features Overview

✅ **Anonymous messaging** - No accounts needed  
✅ **Location-based discovery** - GPS coordinates  
✅ **Proximity unlocking** - Physical presence required  
✅ **Emotional categories** - 5 different tones  
✅ **Reactions** - Hug system for support  
✅ **Offline capable** - Works without internet  
✅ **Cross-platform** - iOS, Android, Web  
✅ **Real-time updates** - Live map and notifications  

---

**Ready to start leaving whispers? Let's go! 🚀✨**
