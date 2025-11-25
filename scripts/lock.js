const SCHOOL_DOMAIN = "@cvcsd.stier.org"; // Your school domain
const CLIENT_ID = "1008774049092-p26lkkuca1qe970ls1qb0vaejms1cl52.apps.googleusercontent.com"; // Replace with your Client ID

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function lockPage() {
    const overlay = document.createElement('div');
    overlay.id = 'lockOverlay';
    Object.assign(overlay.style, {
        position:'fixed', top:0,left:0,width:'100%',height:'100%',
        backgroundColor:'rgba(0,0,0,0.6)', zIndex:9999,
        display:'flex', alignItems:'center', justifyContent:'center',
        pointerEvents:'all', userSelect:'none'
    });
    overlay.innerHTML = '<h1 style="color:white;text-align:center;">Locked: Go to homepage to unlock</h1>';
    document.body.appendChild(overlay);
    document.body.style.filter = 'blur(8px)';
    document.body.style.pointerEvents = 'none';
}

function unlockPage() {
    const overlay = document.getElementById('lockOverlay');
    if (overlay) overlay.remove();
    document.body.style.filter = '';
    document.body.style.pointerEvents = '';
}

function initGoogleLock() {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential
    });
    google.accounts.id.prompt();
}

function handleCredential(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const email = payload.email;

    if (!email.endsWith(SCHOOL_DOMAIN)) {
        document.body.innerHTML = "<h1>Access denied: School account required.</h1>";
        return;
    }

    if (getCookie("unlocked=true")) {
        unlockPage();
    } else {
        lockPage();
    }
}

window.onload = () => {
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = initGoogleLock;
    document.head.appendChild(script);
};
