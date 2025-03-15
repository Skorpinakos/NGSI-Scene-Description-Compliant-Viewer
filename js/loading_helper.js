export function hideViewerContainer() {
    const viewerContainer = document.getElementById('viewer-container');
    if (viewerContainer) {
      viewerContainer.style.display = 'none';
    }
  }
  
  export function showViewerContainer(displayStyle = 'flex') {
    const viewerContainer = document.getElementById('viewer-container');
    if (viewerContainer) {
      viewerContainer.style.display = displayStyle;
    }
  }
  
  export function removeWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.remove();
    }
  }
  
  export function setupPointerLock(containerId = 'viewer-container') {
    const container = document.getElementById(containerId);
    if (container) {
      container.addEventListener('click', () => {
        container.requestPointerLock();
      });
    }
  }
  
  export function createControlsOverlay() {
    const viewerContainer = document.getElementById('viewer-container');
    if (!viewerContainer) return;
    
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'controls-container';
    controlsContainer.innerHTML = `
      <label for="resolution-dropdown">Resolution:</label>
      <select id="resolution-dropdown">
        <option value="640x360">360p (BAD)</option>
        <option value="854x480">480p (SD)</option>
        <option value="1280x720">720p (HD)</option>
        <option value="1920x1080" selected>1080p (FHD)</option>
        <option value="2560x1440">1440p (2K)</option>
        <option value="3840x2160">2160p (4K)</option>
      </select>
      
      <label>
        <input type="checkbox" id="dynamic-res-checkbox" checked>
        Dynamic Resolution
      </label>
      
      <div id="movement-resolution-container">
        <label for="movement-resolution-slider">Movement Resolution (%):</label>
        <input type="range" id="movement-resolution-slider" min="0.1" max="1.0" step="0.05" value="0.5" />
      </div>
    `;
    viewerContainer.appendChild(controlsContainer);
  
    // Apply styling to the controls container
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.bottom = '0';
    controlsContainer.style.left = '0';
    controlsContainer.style.width = '100%';
    controlsContainer.style.padding = '10px';
    controlsContainer.style.boxSizing = 'border-box';
    controlsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    controlsContainer.style.textAlign = 'center';
    controlsContainer.style.color = 'white';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.justifyContent = 'center';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.gap = '1rem';
    controlsContainer.style.zIndex = '100';
  
    // Ensure the document body has no default margin
    document.body.style.margin = '0';
  }
  