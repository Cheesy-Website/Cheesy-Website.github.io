// Check for the "unlocked" cookie and block access if not set
function checkUnlockStatus() {
    if (!getCookie("unlocked")) {
        showLockedScreen();
    } else {
        // Unlock the page
        removeLockedScreen();
    }
}

// Helper function to get the cookie by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Show locked screen overlay
function showLockedScreen() {
    const overlay = document.createElement('div');
    overlay.id = 'lockOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 9999;
    overlay.innerHTML = '<h1 style="color: white;">This content is locked. Please enter the code to unlock.</h1>';
    document.body.appendChild(overlay);
}

// Remove the lock screen once unlocked
function removeLockedScreen() {
    const overlay = document.getElementById('lockOverlay');
    if (overlay) {
        overlay.remove();
    }
}

window.onload = checkUnlockStatus;
