// Google API configuration
const API_CONFIG = {
    CLIENT_ID: '1097960944949-899rom3rbn9cc556uaaka06ihqokts66.apps.googleusercontent.com',
    API_KEY: 'AIzaSyDyy7TTzsIKVoowjRLlTWhBJvrdVHQV4hg',
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    SCOPES: 'https://www.googleapis.com/auth/drive.readonly'
};

class SwipeVidApp {
    constructor() {
        this.authContainer = document.getElementById('auth-container');
        this.videoContainer = document.getElementById('video-container');
        this.videoWrapper = document.getElementById('video-wrapper');
        this.loadingElement = document.getElementById('loading');
        this.authorizeButton = document.getElementById('authorize-button');
        this.prevButton = document.getElementById('prev-button');
        this.nextButton = document.getElementById('next-button');
        
        this.videos = [];
        this.currentIndex = 0;
        this.isLoading = false;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.isGoogleApiLoaded = false;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing SwipeVid App...');
        
        this.authorizeButton.addEventListener('click', () => this.handleAuthClick());
        this.prevButton.addEventListener('click', () => this.prevVideo());
        this.nextButton.addEventListener('click', () => this.nextVideo());
        
        this.loadGoogleApi();
        this.setupTouchEvents();
    }
    
    loadGoogleApi() {
        console.log('📡 Loading Google API...');
        
        if (typeof gapi === 'undefined') {
            console.error('❌ Google API library not loaded');
            this.showError('Google API library failed to load. Please check your internet connection.');
            return;
        }
        
        gapi.load('client:auth2', () => {
            console.log('✅ Google API client loaded');
            
            gapi.client.init({
                apiKey: API_CONFIG.API_KEY,
                clientId: API_CONFIG.CLIENT_ID,
                discoveryDocs: API_CONFIG.DISCOVERY_DOCS,
                scope: API_CONFIG.SCOPES
            }).then(() => {
                console.log('✅ Google API client initialized');
                this.isGoogleApiLoaded = true;
                
                const authInstance = gapi.auth2.getAuthInstance();
                authInstance.isSignedIn.listen(this.updateSigninStatus.bind(this));
                this.updateSigninStatus(authInstance.isSignedIn.get());
                
                this.authorizeButton.textContent = 'Sign In with Google';
                this.authorizeButton.disabled = false;
                
            }).catch(error => {
                console.error('❌ Error initializing Google API client:', error);
                this.showError(`Failed to initialize Google API: ${error.details || error.message}`);
            });
        });
    }
    
    updateSigninStatus(isSignedIn) {
        console.log('🔐 Sign-in status changed:', isSignedIn);
        
        if (isSignedIn) {
            this.authContainer.style.display = 'none';
            this.showLoading();
            this.loadVideosFromDrive();
        } else {
            this.authContainer.style.display = 'block';
            this.videoContainer.style.display = 'none';
        }
    }
    
    handleAuthClick() {
        console.log('🔑 Auth button clicked');
        
        if (!this.isGoogleApiLoaded) {
            this.showError('Google API is not loaded yet. Please wait a moment and try again.');
            return;
        }
        
        const authInstance = gapi.auth2.getAuthInstance();
        if (authInstance) {
            console.log('🔄 Attempting to sign in...');
            authInstance.signIn().catch(error => {
                console.error('❌ Sign-in error:', error);
                this.showError(`Sign-in failed: ${error.error || error.message}`);
            });
        } else {
            this.showError('Google Auth not properly initialized');
        }
    }
    
    async loadVideosFromDrive() {
        console.log('📹 Loading videos from Google Drive...');
        
        try {
            const response = await gapi.client.drive.files.list({
                q: "mimeType contains 'video/' and trashed=false",
                fields: 'files(id, name, mimeType, thumbnailLink, size)',
                orderBy: 'modifiedTime desc',
                pageSize: 20
            });
            
            const files = response.result.files;
            console.log(`📁 Found ${files.length} video files`);
            
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
                this.showError('No video files found in your Google Drive. Please upload some videos and try again.');
            }
        } catch (error) {
            console.error('❌ Error loading videos from Drive:', error);
            this.hideLoading();
            this.showError(`Failed to load videos: ${error.result?.error?.message || error.message}`);
        }
    }
    
    setupVideoElements() {
        console.log('🎬 Setting up video elements...');
        
        this.videoWrapper.innerHTML = '';
        
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
            videoElement.muted = true;
            
            const videoInfo = document.createElement('div');
            videoInfo.className = 'video-info';
            videoInfo.innerHTML = `
                <h3>${video.title}</h3>
                <p>Video ${index + 1} of ${this.videos.length}</p>
            `;
            
            const playOverlay = document.createElement('div');
            playOverlay.className = 'play-overlay';
            playOverlay.innerHTML = '<span class="play-icon">▶</span>';
            
            const swipeArea = document.createElement('div');
            swipeArea.className = 'swipe-area';
            
            swipeArea.addEventListener('click', () => this.togglePlayPause(videoElement, playOverlay));
            
            videoItem.appendChild(videoElement);
            videoItem.appendChild(videoInfo);
            videoItem.appendChild(playOverlay);
            videoItem.appendChild(swipeArea);
            
            this.videoWrapper.appendChild(videoItem);
        });
        
        if (this.videos.length > 0) {
            const firstVideo = this.videoWrapper.querySelector('.video-item:first-child video');
            this.playVideo(firstVideo);
        }
    }
    
    setupTouchEvents() {
        this.videoContainer.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        this.videoContainer.addEventListener('touchend', (e) => {
            this.touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe();
        }, { passive: true });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') this.prevVideo();
            if (e.key === 'ArrowDown') this.nextVideo();
        });
    }
    
    handleSwipe() {
        const swipeDistance = this.touchStartY - this.touchEndY;
        const threshold = 100;
        
        if (Math.abs(swipeDistance) > threshold) {
            if (swipeDistance > 0) {
                this.nextVideo();
            } else {
                this.prevVideo();
            }
        }
    }
    
    nextVideo() {
        if (this.isLoading || this.currentIndex >= this.videos.length - 1) return;
        
        const currentVideo = this.videoWrapper.children[this.currentIndex].querySelector('video');
        currentVideo.pause();
        
        this.currentIndex++;
        this.updateVideoPositions();
        
        const nextVideo = this.videoWrapper.children[this.currentIndex].querySelector('video');
        this.playVideo(nextVideo);
    }
    
    prevVideo() {
        if (this.isLoading || this.currentIndex <= 0) return;
        
        const currentVideo = this.videoWrapper.children[this.currentIndex].querySelector('video');
        currentVideo.pause();
        
        this.currentIndex--;
        this.updateVideoPositions();
        
        const prevVideo = this.videoWrapper.children[this.currentIndex].querySelector('video');
        this.playVideo(prevVideo);
    }
    
    updateVideoPositions() {
        const videoItems = this.videoWrapper.querySelectorAll('.video-item');
        
        videoItems.forEach((item, index) => {
            item.style.transform = `translateY(${(index - this.currentIndex) * 100}%)`;
            item.style.transition = 'transform 0.3s ease-out';
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
            console.error('❌ Error playing video:', error);
            const playOverlay = videoElement.parentElement.querySelector('.play-overlay');
            if (playOverlay) {
                playOverlay.classList.add('visible');
            }
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
        console.error('❌ Error:', message);
        alert(`Error: ${message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, starting SwipeVid App...');
    new SwipeVidApp();
});
