document.body.style.overflow = 'hidden'; // Prevent scrolling when locked

// Show overlay asking for unlock code
function showUnlockPrompt() {
    const overlay = document.createElement('div');
    overlay.id = 'unlockOverlay';
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
    
    const unlockBox = document.createElement('div');
    unlockBox.style.backgroundColor = 'white';
    unlockBox.style.padding = '20px';
    unlockBox.style.borderRadius = '8px';
    unlockBox.style.textAlign = 'center';
    unlockBox.innerHTML = `
        <h2>Enter the unlock code</h2>
        <p>Ask Alex for the code</p>
        <input type="text" id="unlockCode" placeholder="Enter code" />
        <button onclick="verifyCode()">Unlock</button>
        <p id="errorMessage" style="color: red;"></p>
    `;
    
    overlay.appendChild(unlockBox);
    document.body.appendChild(overlay);
}

// Check if the user is logged in with the school account (no Google OAuth)
function checkForSchoolAccount() {
    const emailDomain = "school.edu"; // Replace with your school's domain
    
    // Try checking cookies for any session info or validate via document properties
    // This is a simpler way to validate that the user is on a school account
    // This part will depend on how your school configures the Chromebooks (user session info)
    
    // Here we will mock a simple check (you can customize this logic)
    const userEmail = localStorage.getItem('userEmail'); // Check localStorage for any email
    
    if (userEmail && userEmail.endsWith(emailDomain)) {
        return true;
    }

    return false;
}

function verifyCode() {
    const enteredCode = document.getElementById('unlockCode').value.trim();
    const correctCode = '12251997'; // Set the correct unlock code

    // Check if the code is correct
    if (enteredCode === correctCode) {
        // Set a cookie to indicate the page is unlocked
        document.cookie = "unlocked=true; path=/; max-age=3600"; // Cookie expires after 1 hour
        
        // Allow access and reload
        location.reload(); // Reload to "unlock" the content
    } else {
        document.getElementById('errorMessage').innerText = 'Incorrect code. Please try again.';
    }
}

// Ensure that only users with a school account can unlock
window.onload = () => {
    if (!checkForSchoolAccount()) {
        document.body.innerHTML = "<h1>Access Denied: This feature is only available to users with a school account.</h1>";
    } else {
        showUnlockPrompt();
    }
};
