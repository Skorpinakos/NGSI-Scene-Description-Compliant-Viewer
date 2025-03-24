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

export async function loadScenesList() {
  try {
    const response = await fetch('./js/scenes.json');
    if (!response.ok) {
      throw new Error('Failed to load scenes.json');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading scenes:', error);
    return { scenes: [] };
  }
}

export async function createControlsOverlay(onSceneChange) {
  const viewerContainer = document.getElementById('viewer-container');
  if (!viewerContainer) return;
  
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'controls-container';
  
  // Create the basic controls
  controlsContainer.innerHTML = `
    <div class="control-group">
      <label for="scene-dropdown">Scene:</label>
      <select id="scene-dropdown">
        <option value="">Loading scenes...</option>
      </select>
    </div>
    
    <div class="control-group">
      <label for="resolution-dropdown">Resolution:</label>
      <select id="resolution-dropdown">
        <option value="640x360">360p (BAD)</option>
        <option value="854x480">480p (SD)</option>
        <option value="1280x720">720p (HD)</option>
        <option value="1920x1080" selected>1080p (FHD)</option>
        <option value="2560x1440">1440p (2K)</option>
        <option value="3840x2160">2160p (4K)</option>
      </select>
    </div>
    
    <div class="control-group">
      <label>
        <input type="checkbox" id="dynamic-res-checkbox">
        Dynamic Resolution
      </label>
    </div>
    
    <div class="control-group" id="movement-resolution-container">
      <label for="movement-resolution-slider">Movement Resolution (%):</label>
      <input type="range" id="movement-resolution-slider" min="0.1" max="1.0" step="0.05" value="0.5" />
    </div>
  `;
  viewerContainer.appendChild(controlsContainer);

  // Load scenes from scenes.json and populate the dropdown
  try {
    const { scenes } = await loadScenesList();
    const sceneDropdown = document.getElementById('scene-dropdown');
    
    // Clear loading option
    sceneDropdown.innerHTML = '';
    
    // Add scenes to dropdown
    scenes.forEach(scene => {
      const option = document.createElement('option');
      option.value = scene.id;
      option.textContent = scene.name;
      sceneDropdown.appendChild(option);
    });
    
    // Set up scene change handler
    if (typeof onSceneChange === 'function') {
      sceneDropdown.addEventListener('change', (e) => {
        const selectedSceneId = e.target.value;
        const selectedScene = scenes.find(scene => scene.id === selectedSceneId);
        if (selectedScene) {
          onSceneChange(selectedScene);
        }
      });
    }
  } catch (error) {
    console.error('Error setting up scene dropdown:', error);
  }

  // Apply styling to the controls container
  controlsContainer.style.position = 'absolute';
  controlsContainer.style.bottom = '0';
  controlsContainer.style.left = '0';
  controlsContainer.style.width = '100%';
  controlsContainer.style.padding = '10px';
  controlsContainer.style.boxSizing = 'border-box';
  controlsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  controlsContainer.style.color = 'white';
  controlsContainer.style.display = 'flex';
  controlsContainer.style.justifyContent = 'center';
  controlsContainer.style.alignItems = 'center';
  controlsContainer.style.gap = '1rem';
  controlsContainer.style.zIndex = '100';
  
  // Add styles for control groups
  const controlGroups = controlsContainer.querySelectorAll('.control-group');
  controlGroups.forEach(group => {
    group.style.display = 'flex';
    group.style.alignItems = 'center';
    group.style.gap = '0.5rem';
  });

  // Ensure the document body has no default margin
  document.body.style.margin = '0';
}