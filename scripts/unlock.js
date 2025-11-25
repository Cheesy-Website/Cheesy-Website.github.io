const SCHOOL_DOMAIN = "@cvcsd.stier.org"; // Your school domain
const CLIENT_ID = "1008774049092-p26lkkuca1qe970ls1qb0vaejms1cl52.apps.googleusercontent.com"; // Replace with your Google Client ID
const CODE = "12251997";

// Add modal overlay
function showUnlockModal() {
    const overlay = document.createElement('div');
    overlay.id = 'unlockOverlay';
    Object.assign(overlay.style, {
        position: 'fixed', top:0,left:0,width:'100%',height:'100%',
        backgroundColor:'rgba(0,0,0,0.6)', display:'flex',
        alignItems:'center', justifyContent:'center', zIndex:9999
    });

    const box = document.createElement('div');
    Object.assign(box.style, {
        backgroundColor:'white', padding:'20px', borderRadius:'8px', textAlign:'center'
    });

    box.innerHTML = `
        <h2>Enter the unlock code</h2>
        <p>Ask Alex for the code</p>
        <input type="password" id="codeInput" placeholder="Enter code" />
        <button id="unlockBtn">Unlock</button>
        <p id="msg" style="color:red;margin-top:10px;"></p>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('unlockBtn').onclick = () => verifyCode();
}

let userEmail = null;

// Verify code and school account
function verifyCode() {
    const code = document.getElementById('codeInput').value.trim();
    const msg = document.getElementById('msg');

    if (!userEmail || !userEmail.endsWith(SCHOOL_DOMAIN)) {
        msg.textContent = "You must be signed in with your school account.";
        return;
    }

    if (code === CODE) {
        document.cookie = "unlocked=true; path=/; max-age=3600"; // 1 hour
        document.getElementById('unlockOverlay').remove();
    } else {
        msg.textContent = "Incorrect code.";
    }
}

// Google Identity Services
function initGoogle() {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse
    });
    google.accounts.id.prompt();
}

function handleCredentialResponse(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    userEmail = payload.email;

    if (!document.cookie.includes("unlocked=true")) {
        showUnlockModal();
    }
}

// Load Google API
window.onload = () => {
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = initGoogle;
    document.head.appendChild(script);
};
