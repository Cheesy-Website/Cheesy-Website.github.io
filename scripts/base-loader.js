function getBasePath() {
    const path = window.location.pathname;
    const parts = path.split("/");

    // Remove the last part if it is a file (contains a dot)
    if (parts[parts.length - 1].includes(".")) {
        parts.pop();
    }
    return parts.join("/") || "/";
}

function loadCSS(file) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = getBasePath() + "styles/" + file;
    document.head.appendChild(link);
}

function loadJS(file) {
    const script = document.createElement("script");
    script.src = getBasePath() + "scripts/" + file;
    document.head.appendChild(script);
}
