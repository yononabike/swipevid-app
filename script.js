// API configuration
const API_CONFIG = {
    // Google API configuration
    GOOGLE: {
        CLIENT_ID: '1097960944949-899rom3rbn9cc556uaaka06ihqokts66.apps.googleusercontent.com', // Replace with your Google API Client ID
        API_KEY: 'AIzaSyBcj0RTlQ9J1m8HKkgxsmiADczfJoAdCxg',     // Replace with your Google API Key
        DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        SCOPES: 'https://www.googleapis.com/auth/drive.readonly'
    },
    // Recombee API configuration
    RECOMBEE: {
        DATABASE_ID: 'YOUR_RECOMBEE_DATABASE_ID', // Replace with your Recombee database ID
        PUBLIC_TOKEN: 'YOUR_RECOMBEE_PUBLIC_TOKEN' // Replace with your Recombee public token
    }
};

class SwipeVidApp {
    constructor() {
        // DOM elements
        this.authContainer = document.getElementById('auth-container');
        this.videoContainer = document.getElementById('video-container');
        this.videoWrapper = document.getElementById('video-wrapper');
        this.loadingElement = document.getElementById('loading');
        this.authorizeButton = document.getElementById('authorize-button');
        this.prevButton = document.getElementById('prev-button');
        this.nextButton = document.getElementById('next-button');
        
        // App state
        this.videos = [];
        this.originalVideos = []; // Store original video order
        this.currentIndex = 0;
        this.isLoading = false;
        this.isPlaying = false;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.isGoogleApiLoaded = false;
        this.videoStartTimes = {}; // Track when each video starts playing
        this.videoWatchDurations = {}; // Track how long each video is watched
        
        // Initialize Recombee
        this.recombeeApi = null;
        
        // Initialize the app
        this.init();
    }
    
    async init() {
        // Set up event listeners
        this.authorizeButton.addEventListener('click', () => this.handleAuthClick());
        this.prevButton.addEventListener('click', () => this.prevVideo());
        this.nextButton.addEventListener('click', () => this.nextVideo());
        
        // Load Google API
        this.loadGoogleApi();
        
        // Set up touch events for swiping
        this.setupTouchEvents();
    }
    
    loadGoogleApi() {
        // Load the Google API client library
        gapi.load('client:auth2', () => {
            gapi.client.init({
                apiKey: API_CONFIG.API_KEY,
                clientId: API_CONFIG.CLIENT_ID,
                discoveryDocs: API_CONFIG.DISCOVERY_DOCS,
                scope: API_CONFIG.SCOPES
            }).then(() => {
                this.isGoogleApiLoaded = true;
                
                // Listen for sign-in state changes
                gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus.bind(this));
                
                // Handle the initial sign-in state
                this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            }).catch(error => {
                console.error('Error initializing Google API client:', error);
                this.showError('Failed to load Google API. Please check your internet connection and try again.');
            });
        });
    }
    
    updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
            // User is signed in, hide auth container and load videos
            this.authContainer.style.display = 'none';
            this.showLoading();
            this.loadVideosFromDrive();
        } else {
            // User is not signed in, show auth container
            this.authContainer.style.display = 'block';
            this.videoContainer.style.display = 'none';
        }
    }
    
    handleAuthClick() {
        if (this.isGoogleApiLoaded) {
            gapi.auth2.getAuthInstance().signIn();
        } else {
            this.showError('Google API is not loaded yet. Please try again in a moment.');
        }
    }
    
    async loadVideosFromDrive() {
        try {
            // Search for video files in Google Drive
            const response = await gapi.client.drive.files.list({
                q: "mimeType contains 'video/'",
                fields: 'files(id, name, mimeType, thumbnailLink)',
                orderBy: 'modifiedTime desc'
            });
            
            const files = response.result.files;
            
            if (files && files.length > 0) {
                this.videos = files.map(file => ({
                    id: file.id,
                    title: file.name,
                    thumbnail: file.thumbnailLink,
                    url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_CONFIG.API_KEY}`
                }));
                
                this.setupVideoElements();
                this.hideLoading();
                this.videoContainer.style.display = 'block';
            } else {
                this.hideLoading();
                this.showError('No video files found in your Google Drive.');
            }
        } catch (error) {
            console.error('Error loading videos from Drive:', error);
            this.hideLoading();
            this.showError('Failed to load videos from Google Drive.');
        }
    }
    
    setupVideoElements() {
        // Clear existing videos
        this.videoWrapper.innerHTML = '';
        
        // Create video elements for each video
        this.videos.forEach((video, index) => {
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.style.transform = `translateY(${(index - this.currentIndex) * 100}%)`;
            
            const videoElement = document.createElement('video');
            videoElement.src = video.url;
            videoElement.controls = false;
            videoElement.playsInline = true;
            videoElement.preload = 'metadata';
            videoElement.loop = true;
            
            // Add video info overlay
            const videoInfo = document.createElement('div');
            videoInfo.className = 'video-info';
            videoInfo.innerHTML = `
                <h3>${video.title}</h3>
            `;
            
            // Add play/pause overlay
            const playOverlay = document.createElement('div');
            playOverlay.className = 'play-overlay';
            playOverlay.innerHTML = '<span class="play-icon">▶</span>';
            
            // Add swipe area
            const swipeArea = document.createElement('div');
            swipeArea.className = 'swipe-area';
            
            // Add click event to toggle play/pause
            swipeArea.addEventListener('click', () => this.togglePlayPause(videoElement, playOverlay));
            
            videoItem.appendChild(videoElement);
            videoItem.appendChild(videoInfo);
            videoItem.appendChild(playOverlay);
            videoItem.appendChild(swipeArea);
            
            this.videoWrapper.appendChild(videoItem);
        });
        
        // Play the first video
        if (this.videos.length > 0) {
            const firstVideo = this.videoWrapper.querySelector('.video-item:first-child video');
            this.playVideo(firstVideo);
        }
    }
    
    setupTouchEvents() {
        // Touch events for swiping
        this.videoContainer.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        this.videoContainer.addEventListener('touchend', (e) => {
            this.touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe();
        }, { passive: true });
    }
    
    handleSwipe() {
        const swipeDistance = this.touchStartY - this.touchEndY;
        const threshold = 100; // Minimum distance to trigger swipe
        
        if (Math.abs(swipeDistance) > threshold) {
            if (swipeDistance > 0) {
                // Swipe up - next video
                this.nextVideo();
            } else {
                // Swipe down - previous video
                this.prevVideo();
            }
        }
    }
    
    nextVideo() {
        if (this.isLoading || this.currentIndex >= this.videos.length - 1) return;
        
        // Pause current video
        const currentVideo = this.videoWrapper.children[this.currentIndex].querySelector('video');
        currentVideo.pause();
        
        // Update index
        this.currentIndex++;
        
        // Update video positions
        this.updateVideoPositions();
        
        // Play next video
        const nextVideo = this.videoWrapper.children[this.currentIndex].querySelector('video');
        this.playVideo(nextVideo);
    }
    
    prevVideo() {
        if (this.isLoading || this.currentIndex <= 0) return;
        
        // Pause current video
        const currentVideo = this.videoWrapper.children[this.currentIndex].querySelector('video');
        currentVideo.pause();
        
        // Update index
        this.currentIndex--;
        
        // Update video positions
        this.updateVideoPositions();
        
        // Play previous video
        const prevVideo = this.videoWrapper.children[this.currentIndex].querySelector('video');
        this.playVideo(prevVideo);
    }
    
    updateVideoPositions() {
        // Update the position of all videos based on current index
        const videoItems = this.videoWrapper.querySelectorAll('.video-item');
        
        videoItems.forEach((item, index) => {
            item.style.transform = `translateY(${(index - this.currentIndex) * 100}%)`;
        });
    }
    
    togglePlayPause(videoElement, playOverlay) {
        if (videoElement.paused) {
            this.playVideo(videoElement);
            playOverlay.classList.remove('visible');
        } else {
            videoElement.pause();
            playOverlay.classList.add('visible');
            playOverlay.querySelector('.play-icon').textContent = '▶';
        }
    }
    
    playVideo(videoElement) {
        videoElement.play().catch(error => {
            console.error('Error playing video:', error);
            // Show play button if autoplay is prevented
            const playOverlay = videoElement.parentElement.querySelector('.play-overlay');
            playOverlay.classList.add('visible');
        });
    }
    
    showLoading() {
        this.isLoading = true;
        this.loadingElement.style.display = 'flex';
    }
    
    hideLoading() {
        this.isLoading = false;
        this.loadingElement.style.display = 'none';
    }
    
    showError(message) {
        alert(message);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SwipeVidApp();
});