const API_CONFIG = {
    CLIENT_ID: '1097960944949-899rom3rbn9cc556uaaka06ihqokts66.apps.googleusercontent.com',
    API_KEY: 'AIzaSyDyy7TTzsIKVoowjRLlTWhBJvrdVHQV4hg',
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    SCOPES: 'https://www.googleapis.com/auth/drive.readonly'
};

class SimpleSwipeVid {
    constructor() {
        this.authorizeButton = document.getElementById('authorize-button');
        this.isGoogleApiLoaded = false;
        
        console.log('🚀 Starting Simple SwipeVid...');
        this.init();
    }
    
    init() {
        this.waitForGoogleAPI();
        
        if (this.authorizeButton) {
            this.authorizeButton.addEventListener('click', () => this.handleAuthClick());
        }
    }
    
    waitForGoogleAPI() {
        const checkAPI = () => {
            if (typeof gapi !== 'undefined') {
                console.log('✅ Google API found, initializing...');
                this.loadGoogleApi();
            } else {
                console.log('⏳ Google API not ready, retrying...');
                setTimeout(checkAPI, 500);
            }
        };
        
        checkAPI();
    }
    
    loadGoogleApi() {
        try {
            gapi.load('client:auth2', () => {
                gapi.client.init({
                    apiKey: API_CONFIG.API_KEY,
                    clientId: API_CONFIG.CLIENT_ID,
                    discoveryDocs: API_CONFIG.DISCOVERY_DOCS,
                    scope: API_CONFIG.SCOPES
                }).then(() => {
                    console.log('✅ Google API initialized successfully');
                    this.isGoogleApiLoaded = true;
                    
                    if (this.authorizeButton) {
                        this.authorizeButton.textContent = 'Sign In with Google';
                        this.authorizeButton.disabled = false;
                    }
                    
                    const statusDiv = document.getElementById('api-status');
                    if (statusDiv) {
                        statusDiv.innerHTML += '<br>✅ Google API fully initialized!';
                    }
                    
                }).catch(error => {
                    console.error('❌ Error initializing Google API:', error);
                    alert(`Failed to initialize Google API: ${error.details || error.message}`);
                });
            });
        } catch (error) {
            console.error('❌ Error loading Google API:', error);
            alert(`Failed to load Google API: ${error.message}`);
        }
    }
    
    handleAuthClick() {
        if (!this.isGoogleApiLoaded) {
            alert('Google API is not loaded yet. Please wait and try again.');
            return;
        }
        
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            if (authInstance) {
                authInstance.signIn().then(() => {
                    alert('Sign-in successful! Google API is working.');
                }).catch(error => {
                    alert(`Sign-in failed: ${error.error || error.message}`);
                });
            }
        } catch (error) {
            alert(`Authentication error: ${error.message}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SimpleSwipeVid();
});
