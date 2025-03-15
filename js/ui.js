// ui.js: Handles UI controls and events
export function setupUI(adjustRendererSizeCallback) {
    const resolutionDropdown = document.getElementById('resolution-dropdown');
    const dynamicResCheckbox = document.getElementById('dynamic-res-checkbox');
    const movementResolutionSlider = document.getElementById('movement-resolution-slider');
    const movementResolutionContainer = document.getElementById('movement-resolution-container');
  
    // Default config values
    window.dynamicResolutionEnabled = dynamicResCheckbox.checked;
    window.movementResolutionScale = parseFloat(movementResolutionSlider.value);
    window.fullResolutionScale = 1.0;
  
    resolutionDropdown.addEventListener('change', (event) => {
      const [width, height] = event.target.value.split('x').map(val => parseInt(val));
      window.MAX_WIDTH = width;
      window.MAX_HEIGHT = height;
      adjustRendererSizeCallback();
    });
  
    dynamicResCheckbox.addEventListener('change', (event) => {
      window.dynamicResolutionEnabled = event.target.checked;
      movementResolutionContainer.classList.toggle('hidden', !window.dynamicResolutionEnabled);
      if (!window.dynamicResolutionEnabled) {
        // If turning off dynamic resolution, immediately set to full resolution
        window.effectiveResolutionScale = window.fullResolutionScale;
        adjustRendererSizeCallback();
      }
    });
  
    movementResolutionSlider.addEventListener('input', (event) => {
      window.movementResolutionScale = parseFloat(event.target.value);
      if (window.dynamicResolutionEnabled && window.effectiveResolutionScale !== window.fullResolutionScale) {
        window.effectiveResolutionScale = window.movementResolutionScale;
        adjustRendererSizeCallback();
      }
    });
  }
  
  export function getDynamicConfig() {
    return {
      dynamicResolutionEnabled: window.dynamicResolutionEnabled,
      movementResolutionScale: window.movementResolutionScale,
      fullResolutionScale: window.fullResolutionScale
    };
  }
  