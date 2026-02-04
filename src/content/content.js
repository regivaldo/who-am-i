// Who Am I - Content Script
// Applies visual indicators based on environment configuration

(async function () {
    // Check if we should apply indicators
    const applyIndicator = async () => {
        const currentUrl = window.location.href;

        // Load environments from storage
        const data = await chrome.storage.sync.get('environments');
        const environments = data.environments || [];

        let match = null;

        for (const env of environments) {
            try {
                if (env.urlPattern.startsWith('/') && env.urlPattern.endsWith('/')) {
                    const regex = new RegExp(env.urlPattern.slice(1, -1));
                    if (regex.test(currentUrl)) match = env;
                } else {
                    if (currentUrl.includes(env.urlPattern)) match = env;
                }
            } catch (e) {
                console.error("Who Am I: Invalid regex", env.urlPattern);
            }
            if (match) break;
        }

        if (match) {
            removeExistingIndicators();
            applyVisualIndicator(match);
        }
    };

    // Remove any existing indicators
    const removeExistingIndicators = () => {
        const existingBorder = document.getElementById('who-am-i-border');
        const existingTopBorder = document.getElementById('who-am-i-top-border');
        const existingBalloon = document.getElementById('who-am-i-balloon');
        const existingStyle = document.getElementById('who-am-i-styles');
        const existingBorderHover = document.getElementById('who-am-i-border-hover');
        const existingTopHover = document.getElementById('who-am-i-top-hover');
        const existingTooltip = document.getElementById('who-am-i-tooltip');

        if (existingBorder) existingBorder.remove();
        if (existingTopBorder) existingTopBorder.remove();
        if (existingBalloon) existingBalloon.remove();
        if (existingStyle) existingStyle.remove();
        if (existingBorderHover) existingBorderHover.remove();
        if (existingTopHover) existingTopHover.remove();
        if (existingTooltip) existingTooltip.remove();
    };

    // Apply visual indicator based on type
    const applyVisualIndicator = (env) => {
        const { indicationType, color, borderWidth, name } = env;
        const width = borderWidth || '5px';

        switch (indicationType) {
            case 'borda-completa':
                applyFullBorder(color, width, name);
                break;
            case 'somente-topo':
                applyTopBorder(color, width, name);
                break;
            case 'balao':
                applyBalloon(color, name);
                break;
            default:
                applyTopBorder(color, width, name);
        }
    };

    // Full border around the entire viewport
    const applyFullBorder = (color, width, name) => {
        const style = document.createElement('style');
        style.id = 'who-am-i-styles';
        style.textContent = `
      #who-am-i-border {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 2147483647;
        border: ${width} solid ${color};
        box-sizing: border-box;
      }
      
      #who-am-i-border-hover {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 2147483646;
      }
      
      #who-am-i-border-hover .hover-zone {
        position: absolute;
        pointer-events: auto;
      }
      
      #who-am-i-border-hover .hover-zone.top {
        top: 0;
        left: 0;
        right: 0;
        height: calc(${width} + 10px);
      }
      
      #who-am-i-border-hover .hover-zone.bottom {
        bottom: 0;
        left: 0;
        right: 0;
        height: calc(${width} + 10px);
      }
      
      #who-am-i-border-hover .hover-zone.left {
        top: 0;
        left: 0;
        bottom: 0;
        width: calc(${width} + 10px);
      }
      
      #who-am-i-border-hover .hover-zone.right {
        top: 0;
        right: 0;
        bottom: 0;
        width: calc(${width} + 10px);
      }
      
      #who-am-i-tooltip {
        position: fixed;
        padding: 6px 12px;
        background-color: ${color};
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        border-radius: 6px;
        z-index: 2147483647;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s;
        white-space: nowrap;
      }
      
      #who-am-i-tooltip.visible {
        opacity: 1;
      }
    `;
        document.head.appendChild(style);

        const borderDiv = document.createElement('div');
        borderDiv.id = 'who-am-i-border';
        document.body.appendChild(borderDiv);

        // Create hover zones and tooltip
        createHoverZonesAndTooltip(name, color);
    };

    // Top border only
    const applyTopBorder = (color, width, name) => {
        const style = document.createElement('style');
        style.id = 'who-am-i-styles';
        style.textContent = `
      #who-am-i-top-border {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: ${width};
        background-color: ${color};
        pointer-events: none;
        z-index: 2147483647;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      
      #who-am-i-top-hover {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: calc(${width} + 10px);
        z-index: 2147483646;
        cursor: default;
      }
      
      #who-am-i-tooltip {
        position: fixed;
        padding: 6px 12px;
        background-color: ${color};
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        border-radius: 6px;
        z-index: 2147483647;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s;
        white-space: nowrap;
      }
      
      #who-am-i-tooltip.visible {
        opacity: 1;
      }
    `;
        document.head.appendChild(style);

        const topBorderDiv = document.createElement('div');
        topBorderDiv.id = 'who-am-i-top-border';
        document.body.appendChild(topBorderDiv);

        // Create hover zone and tooltip
        const hoverZone = document.createElement('div');
        hoverZone.id = 'who-am-i-top-hover';
        document.body.appendChild(hoverZone);

        const tooltip = document.createElement('div');
        tooltip.id = 'who-am-i-tooltip';
        tooltip.textContent = name;
        document.body.appendChild(tooltip);

        hoverZone.addEventListener('mouseenter', () => {
            tooltip.classList.add('visible');
        });

        hoverZone.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });

        hoverZone.addEventListener('mousemove', (e) => {
            tooltip.style.left = e.clientX + 10 + 'px';
            tooltip.style.top = e.clientY + 15 + 'px';
        });
    };

    // Create hover zones for full border with tooltip
    const createHoverZonesAndTooltip = (name, color) => {
        const hoverContainer = document.createElement('div');
        hoverContainer.id = 'who-am-i-border-hover';

        // Create 4 hover zones (top, right, bottom, left)
        ['top', 'right', 'bottom', 'left'].forEach(position => {
            const zone = document.createElement('div');
            zone.className = `hover-zone ${position}`;
            hoverContainer.appendChild(zone);
        });

        document.body.appendChild(hoverContainer);

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'who-am-i-tooltip';
        tooltip.textContent = name;
        document.body.appendChild(tooltip);

        // Add hover events to all zones
        const zones = hoverContainer.querySelectorAll('.hover-zone');
        zones.forEach(zone => {
            zone.addEventListener('mouseenter', () => {
                tooltip.classList.add('visible');
            });

            zone.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });

            zone.addEventListener('mousemove', (e) => {
                tooltip.style.left = e.clientX + 10 + 'px';
                tooltip.style.top = e.clientY + 15 + 'px';
            });
        });
    };

    // Floating balloon with environment name
    const applyBalloon = (color, name) => {
        const style = document.createElement('style');
        style.id = 'who-am-i-styles';
        style.textContent = `
      #who-am-i-balloon {
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 8px 16px;
        background-color: ${color};
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        border-radius: 20px;
        z-index: 2147483647;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        cursor: move;
        user-select: none;
        opacity: 0.95;
        transition: opacity 0.2s, transform 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      #who-am-i-balloon:hover {
        opacity: 1;
        transform: scale(1.02);
      }
      
      #who-am-i-balloon::before {
        content: '';
        width: 8px;
        height: 8px;
        background: rgba(255,255,255,0.9);
        border-radius: 50%;
        animation: who-am-i-pulse 2s infinite;
      }
      
      @keyframes who-am-i-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      #who-am-i-balloon.minimized {
        padding: 6px 10px;
        font-size: 10px;
      }
    `;
        document.head.appendChild(style);

        const balloon = document.createElement('div');
        balloon.id = 'who-am-i-balloon';
        balloon.textContent = name;
        balloon.title = 'Arraste para mover | Duplo clique para minimizar';
        document.body.appendChild(balloon);

        // Make balloon draggable
        makeDraggable(balloon);

        // Double click to minimize
        balloon.addEventListener('dblclick', () => {
            balloon.classList.toggle('minimized');
            if (balloon.classList.contains('minimized')) {
                balloon.textContent = name.charAt(0).toUpperCase();
            } else {
                balloon.textContent = name;
            }
        });
    };

    // Make element draggable
    const makeDraggable = (element) => {
        let isDragging = false;
        let offsetX, offsetY;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            element.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;

            // Keep within viewport
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;

            element.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            element.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
            element.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            element.style.cursor = 'move';
        });
    };

    // Listen for storage changes to update indicators in real-time
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.environments) {
            applyIndicator();
        }
    });

    // Initial application
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyIndicator);
    } else {
        applyIndicator();
    }
})();
