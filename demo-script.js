// Demo version with sample videos (no Google API required)
class SwipeVidDemo {
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
        this.currentIndex = 0;
        this.isLoading = false;
        this.touchStartY = 0;
        this.touchEndY = 0;
        
        // Initialize the app
        this.init();
    }
    
    async init() {
        // Hide auth container and show demo message
        this.authContainer.innerHTML = `
            <h1>SwipeVid Demo</h1>
            <p>Loading demo videos...</p>
            <button id="demo-button" class="auth-button">Start Demo</button>
        `;
        
        document.getElementById('demo-button').addEventListener('click', () => this.startDemo());
        
        // Set up controls
        this.prevButton.addEventListener('click', () => this.prevVideo());
        this.nextButton.addEventListener('click', () => this.nextVideo());
        
        // Set up touch events for swiping
        this.setupTouchEvents();
    }
    
    startDemo() {
        this.authContainer.style.display = 'none';
        this.showLoading();
        this.loadDemoVideos();
    }
    
    loadDemoVideos() {
        // Demo videos (using sample video URLs)
        this.videos = [
            {
                id: 'demo1',
                title: 'Sample Video 1',
                url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
            },
            {
                id: 'demo2',
                title: 'Sample Video 2',
                url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
            },
            {
                id: 'demo3',
                title: 'Big Buck Bunny',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            },
            {
                id: 'demo4',
                title: 'Elephant Dream',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
            }
        ];
        
        setTimeout(() => {
            this.setupVideoElements();
            this.hideLoading();
            this.videoContainer.style.display = 'block';
        }, 1000);
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
            videoElement.muted = true; // Muted for autoplay
            
            // Add video info overlay
            const videoInfo = document.createElement('div');
            videoInfo.className = 'video-info';
            videoInfo.innerHTML = `
                <h3>${video.title}</h3>
                <p>Video ${index + 1} of ${this.videos.length}</p>
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
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') this.prevVideo();
            if (e.key === 'ArrowDown') this.nextVideo();
        });
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
            console.error('Error playing video:', error);
            // Show play button if autoplay is prevented
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
}

// Initialize the demo app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SwipeVidDemo();
});