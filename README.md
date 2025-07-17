# SwipeVid - TikTok-style Video Experience

A mobile-optimized web application that provides a TikTok-like swiping experience for videos stored in Google Drive.

## Features

- Connect to Google Drive to access your videos
- TikTok-style vertical swiping interface
- Mobile-optimized playback experience
- Smooth transitions between videos
- Play/pause functionality with tap
- Swipe up/down or use buttons to navigate videos

## Setup Instructions

### 1. Create Google API Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials (Web application type)
5. Add your domain to the authorized JavaScript origins
6. Note your Client ID and API Key

### 2. Configure the Application

1. Open `script.js`
2. Replace the placeholder values in the `API_CONFIG` object:
   ```javascript
   const API_CONFIG = {
       CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your Client ID
       API_KEY: 'YOUR_GOOGLE_API_KEY',     // Replace with your API Key
       DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
       SCOPES: 'https://www.googleapis.com/auth/drive.readonly'
   };
   ```

### 3. Deploy the Application

1. Host the files on a web server or use a local development server
2. Access the application through a web browser on your mobile device
3. Sign in with your Google account to access your videos

## Usage

1. Sign in with your Google account
2. The app will load videos from your Google Drive
3. Swipe up to see the next video
4. Swipe down to see the previous video
5. Tap on a video to play/pause

## Customization

- Modify `styles.css` to change the appearance
- Adjust the swipe threshold in `script.js` to make swiping more or less sensitive
- Add additional features like video descriptions, likes, or comments

## Browser Compatibility

- Chrome (recommended for best experience)
- Safari
- Firefox
- Edge

## Mobile Optimization

This application is specifically designed for mobile devices and provides the best experience on smartphones and tablets.

## Limitations

- Requires internet connection
- Videos are streamed from Google Drive, so playback quality depends on your connection speed
- Some mobile browsers may have autoplay restrictions

## License

MIT License