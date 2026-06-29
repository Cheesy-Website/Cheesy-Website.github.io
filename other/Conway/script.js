const canvas = document.getElementById('lifeCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.getElementById('canvasWrapper');
const workspace = document.getElementById('workspace');
const viewport = document.querySelector('.viewport');

viewport.addEventListener('mousedown', (e) => {
    if (e.button !== 1) return; // middle click only

    e.preventDefault();

    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    scrollStartX = viewport.scrollLeft;
    scrollStartY = viewport.scrollTop;
});

window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;

    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;

    viewport.scrollLeft = scrollStartX - dx;
    viewport.scrollTop = scrollStartY - dy;
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 1) isPanning = false;
});

// Core DOM Elements Setup
const startBtn = document.getElementById('startBtn');
const stepBtn = document.getElementById('stepBtn');
const clearBtn = document.getElementById('clearBtn');
const randomBtn = document.getElementById('randomBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const applySizeBtn = document.getElementById('applySizeBtn');

const colsInput = document.getElementById('colsInput');
const rowsInput = document.getElementById('rowsInput');
const bornInput = document.getElementById('bornInput');
const surviveInput = document.getElementById('surviveInput');
const themeSelect = document.getElementById('themeSelect');
const customPickers = document.getElementById('customPickers');
const aliveColorPicker = document.getElementById('aliveColorPicker');
const deadColorPicker = document.getElementById('deadColorPicker');

const genCountEl = document.getElementById('genCount');
const zoomPercentEl = document.getElementById('zoomPercent');

const speedSlider = document.getElementById('speedSlider');
const speedInput = document.getElementById('speedInput');

const stampData = document.getElementById('stampData');
const stampName = document.getElementById('stampName');
const importStampBtn = document.getElementById('importStampBtn');

const wrapEdgesToggle = document.getElementById('wrapEdgesToggle');
let wrapEdges = false;

wrapEdgesToggle.addEventListener('change', () => {
    wrapEdges = wrapEdgesToggle.checked;
});

// Get rid of the stupid ass middle click issue that I hate oh so very much
workspace.addEventListener("mousedown", (e) => {
    if (e.button === 1) {
        e.preventDefault();
    }
});
viewport.addEventListener("mousedown", (e) => {
    if (e.button === 1) e.preventDefault();
});
workspace.addEventListener("auxclick", (e) => {
    if (e.button === 1) {
        e.preventDefault();
    }
});

// Operating Parameters
const CELL_SIZE = 12; 
let COLS = parseInt(colsInput.value) || 80;
let ROWS = parseInt(rowsInput.value) || 50;

let isRunning = false;
let generation = 0;
let animationFrameId = null;
let isDrawing = false;
let scale = 1.0;

let bornRules = new Set();
let surviveRules = new Set();

let activeTool = 'draw';
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let scrollStartX = 0;
let scrollStartY = 0;
let mouseCol = -1;
let mouseRow = -1;

let generationsPerSecond = 14;

let automatonType = "life";

const automatonTypeSelect = document.getElementById('automatonType');

const elementaryControls = document.getElementById('elementaryControls');

automatonTypeSelect.addEventListener('change', () => {
    automatonType = automatonTypeSelect.value;

    if (automatonType === "elementary") {
        elementaryControls.style.display = "block";
        grid = createGrid();
        generation = 0;
    } else {
        elementaryControls.style.display = "none";
    }

    drawGrid();
});

let elementaryRule = 90;

const ruleNumberInput = document.getElementById('ruleNumber');

ruleNumberInput.addEventListener('input', () => {
    let val = parseInt(ruleNumberInput.value);

    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(255, val));

    elementaryRule = val;
    ruleNumberInput.value = val;

    if (automatonType === "elementary") {
        grid = createGrid();
        generation = 0;
        drawGrid();
    }
});

const rawPatterns = {
    block: "11|11",
    glider: "010|001|111",
    lwss: "01111|10001|00001|10010",
    pulsar: "0011100011100|0000000000000|1000010100001|1000010100001|1000010100001|0011100011100|0000000000000|0011100011100|1000010100001|1000010100001|1000010100001|0000000000000|0011100011100",
    gosper: "000000000000000000000000100000000000|000000000000000000000010100000000000|000000000000110000001100000000000011|000000000001000100001100000000000011|110000000010000010001100000000000000|110000000010001011000010100000000000|000000000010000010000000100000000000|000000000001000100000000000000000000|000000000000110000000000000000000000"
};

const structures = {};
for (const [name, str] of Object.entries(rawPatterns)) {
    structures[name] = str.split('|').map(row => row.split('').map(Number));
}

const savedStructures = localStorage.getItem("lifeStructures");

if (savedStructures) {
    const parsed = JSON.parse(savedStructures);

    for (const key in parsed) {
        structures[key] = parsed[key];
    }
}

for (const name of Object.keys(structures)) {

    if (rawPatterns[name]) continue; // skip built-ins

    const button = document.createElement("button");
    button.className = "stamp-btn";
    button.dataset.type = name;
    button.textContent = name;

    button.addEventListener("click", () => {
        document.querySelectorAll(".stamp-btn").forEach(b => b.classList.remove("active"));
        button.classList.add("active");
        activeTool = name;
    });

    document.querySelector(".stamp-grid").appendChild(button);
}

const themes = {
    cyberpunk: { alive: '#38bdf8', dead: '#0f172a', line: '#1e293b' },
    classic: { alive: '#22c55e', dead: '#052e16', line: '#14532d' },
    monochrome: { alive: '#ffffff', dead: '#000000', line: '#262626' },
    sunset: { alive: '#f43f5e', dead: '#1c1917', line: '#292524' }
};
let currentThemeColors = { ...themes.cyberpunk };

let grid = createGrid();

function createGrid() {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

function initCanvas() {
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;

    canvasWrapper.style.transform = `scale(${scale})`;

    drawGrid();

    centerCanvas();
}

function centerCanvas() {
    requestAnimationFrame(() => {
        viewport.scrollLeft =
            (canvasWrapper.offsetWidth * scale - viewport.clientWidth) / 2;

        viewport.scrollTop =
            (canvasWrapper.offsetHeight * scale - viewport.clientHeight) / 2;
    });
}

function parseRules() {
    bornRules.clear();
    surviveRules.clear();
    bornInput.value.replace(/\s+/g, '').split('').forEach(d => { if(d >= '0' && d <= '8') bornRules.add(parseInt(d)) });
    surviveInput.value.replace(/\s+/g, '').split('').forEach(d => { if(d >= '0' && d <= '8') surviveRules.add(parseInt(d)) });
}
function drawGrid() {
    ctx.fillStyle = currentThemeColors.dead;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] === 1) {
                ctx.fillStyle = currentThemeColors.alive;
                ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
            } else {
                ctx.fillStyle = currentThemeColors.line;
                ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.fillStyle = currentThemeColors.dead;
                ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
            }
        }
    }

    if (activeTool !== 'draw' && mouseCol >= 0 && mouseRow >= 0) {
        const pattern = structures[activeTool];
        if (pattern) {
            ctx.fillStyle = currentThemeColors.alive;
            ctx.globalAlpha = 0.4;
            for (let r = 0; r < pattern.length; r++) {
                for (let c = 0; c < pattern[r].length; c++) {
                    if (pattern[r][c] === 1) {
                        const targetR = mouseRow + r;
                        const targetC = mouseCol + c;
                        if (targetR >= 0 && targetR < ROWS && targetC >= 0 && targetC < COLS) {
                            ctx.fillRect(targetC * CELL_SIZE, targetR * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
                        }
                    }
                }
            }
            ctx.globalAlpha = 1.0;
        }
    }
if (automatonType === "life") {
    genCountEl.textContent = generation;
} else {
    genCountEl.textContent = `R${elementaryRule}`;
}
}

function computeNextGeneration() {
    if (automatonType === "life") {
        computeLife();
    } else {
        computeElementary();
    }
}

function computeElementary() {
    const ruleBits = elementaryRule
        .toString(2)
        .padStart(8, "0")
        .split("")
        .reverse();

    // if first step, seed middle row
    if (generation === 0) {
        const mid = Math.floor(COLS / 2);
        grid[0][mid] = 1;
    }

    const r = generation;
    if (r >= ROWS - 1) return;

    for (let c = 1; c < COLS - 1; c++) {

        const left = grid[r][c - 1];
        const center = grid[r][c];
        const right = grid[r][c + 1];

        const idx = (left << 2) | (center << 1) | right;

        grid[r + 1][c] = parseInt(ruleBits[idx]);
    }

    generation++;
}

function computeLife() {
    const nextGrid = createGrid();
    parseRules();

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const neighbors = countNeighbors(r, c);
            const currentState = grid[r][c];

            if (currentState === 1) {
                if (surviveRules.has(neighbors)) nextGrid[r][c] = 1;
            } else {
                if (bornRules.has(neighbors)) nextGrid[r][c] = 1;
            }
        }
    }
    grid = nextGrid;
    generation++;
}

speedSlider.addEventListener('input', () => {
    generationsPerSecond = Number(speedSlider.value);
    speedInput.value = generationsPerSecond;
});

speedInput.addEventListener('input', () => {
    let value = Math.max(1, Number(speedInput.value) || 1);

    generationsPerSecond = value;

    // Keep the slider at its max if the input exceeds it.
    speedSlider.value = Math.min(value, Number(speedSlider.max));
});

function countNeighbors(row, col) {
    let count = 0;

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;

            let newRow = row + i;
            let newCol = col + j;

            if (wrapEdges) {
                newRow = (newRow + ROWS) % ROWS;
                newCol = (newCol + COLS) % COLS;
                count += grid[newRow][newCol];
            } else {
                if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                    count += grid[newRow][newCol];
                }
            }
        }
    }

    return count;
}

function updateLoop() {
    if (!isRunning) return;
    computeNextGeneration();
    drawGrid();
setTimeout(() => {
    animationFrameId = requestAnimationFrame(updateLoop);
}, 1000 / generationsPerSecond);
}

function handleGridInteraction(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    const c = Math.floor(x / CELL_SIZE);
    const r = Math.floor(y / CELL_SIZE);

    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        if (e.type === 'mousedown') {
            if (activeTool === 'draw') {
                grid[r][c] = grid[r][c] === 1 ? 0 : 1;
            } else {
                const pattern = structures[activeTool];
                if (pattern) {
                    for (let pr = 0; pr < pattern.length; pr++) {
                        for (let pc = 0; pc < pattern[pr].length; pc++) {
                            if (pattern[pr][pc] === 1) {
                                const targetR = r + pr;
                                const targetC = c + pc;
                                if (targetR >= 0 && targetR < ROWS && targetC >= 0 && targetC < COLS) {
                                    grid[targetR][targetC] = 1;
                                }
                            }
                        }
                    }
                }
            }
        } else if (e.type === 'mousemove' && isDrawing && activeTool === 'draw') {
            grid[r][c] = 1;
        }
        mouseCol = c;
        mouseRow = r;
    }
}

canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // left click only
    isDrawing = true;
    handleGridInteraction(e);
});

canvas.addEventListener('mousemove', (e) => {
    handleGridInteraction(e);

    // always update preview when using structure tools
    if (activeTool !== 'draw' || isDrawing) {
        drawGrid();
    }
});

canvas.addEventListener('mouseleave', () => {
    mouseCol = -1;
    mouseRow = -1;
    drawGrid();
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) isDrawing = false;
});

document.querySelectorAll('.stamp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.stamp-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTool = btn.getAttribute('data-type');
    });
});

document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
        bornInput.value = card.getAttribute('data-born');
        surviveInput.value = card.getAttribute('data-survive');
        parseRules();
    });
});

workspace.addEventListener("wheel", (e) => {
    e.preventDefault();

    const zoomSpeed = 0.08;
    const oldScale = scale;

    if (e.deltaY < 0) {
        scale = Math.min(scale + zoomSpeed, 4);
    } else {
        scale = Math.max(scale - zoomSpeed, 0.25);
    }

    if (oldScale === scale) return;

    const rect = viewport.getBoundingClientRect();

    const mouseX = e.clientX - rect.left + viewport.scrollLeft;
    const mouseY = e.clientY - rect.top + viewport.scrollTop;

    const worldX = mouseX / oldScale;
    const worldY = mouseY / oldScale;

    canvasWrapper.style.transform = `scale(${scale})`;

    requestAnimationFrame(() => {
        viewport.scrollLeft = worldX * scale - (e.clientX - rect.left);
        viewport.scrollTop = worldY * scale - (e.clientY - rect.top);
    });

    zoomPercentEl.textContent = `${Math.round(scale * 100)}%`;
}, { passive: false });

startBtn.addEventListener('click', () => {
    isRunning = !isRunning;
    if (isRunning) {
        startBtn.textContent = 'Pause';
        startBtn.classList.add('active');
        updateLoop();
    } else {
        startBtn.textContent = 'Start';
        startBtn.classList.remove('active');
        cancelAnimationFrame(animationFrameId);
    }
});

stepBtn.addEventListener('click', () => {
    if (isRunning) return;
    computeNextGeneration();
    drawGrid();
});

clearBtn.addEventListener('click', () => {
    grid = createGrid();
    generation = 0;
    drawGrid();
});

randomBtn.addEventListener('click', () => {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            grid[r][c] = Math.random() > 0.75 ? 1 : 0;
        }
    }
    generation = 0;
    drawGrid();
});

applySizeBtn.addEventListener('click', () => {
    let nextCols = parseInt(colsInput.value);
    let nextRows = parseInt(rowsInput.value);
    if(isNaN(nextCols) || nextCols < 10) nextCols = 10;
    if(isNaN(nextRows) || nextRows < 10) nextRows = 10;
    COLS = nextCols;
    ROWS = nextRows;
    grid = createGrid();
    generation = 0;
    initCanvas();
});

function applyTheme() {
    const mode = themeSelect.value;
    if (mode === 'custom') {
        customPickers.style.display = 'grid';
        currentThemeColors.alive = aliveColorPicker.value;
        currentThemeColors.dead = deadColorPicker.value;
        currentThemeColors.line = '#475569';
    } else {
        customPickers.style.display = 'none';
        currentThemeColors = { ...themes[mode] };
    }
    drawGrid();
}

themeSelect.addEventListener('change', applyTheme);
aliveColorPicker.addEventListener('input', applyTheme);
deadColorPicker.addEventListener('input', applyTheme);

importStampBtn.addEventListener('click', () => {

    const name = stampName.value.trim();

    if (!name) {
        alert("Please enter a name.");
        return;
    }

    const pattern = stampData.value
        .trim()
        .replace(/\r/g, "")
        .replace(/\n/g, "|");

    const rows = pattern.split("|");

    // Verify only 0s and 1s
    for (const row of rows) {
        if (!/^[01]+$/.test(row)) {
            alert("Only 0 and 1 are allowed.");
            return;
        }
    }

    structures[name] = rows.map(r => r.split("").map(Number));
	
	localStorage.setItem("lifeStructures", JSON.stringify(structures));

    rawPatterns[name] = pattern;

    // Create button
    const button = document.createElement("button");
    button.className = "stamp-btn";
    button.dataset.type = name;
    button.textContent = name;

    button.addEventListener("click", () => {

        document.querySelectorAll(".stamp-btn").forEach(b => {
            b.classList.remove("active");
        });

        button.classList.add("active");
        activeTool = name;

    });

    document.querySelector(".stamp-grid").appendChild(button);

    stampName.value = "";
    stampData.value = "";

});

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        workspace.requestFullscreen().catch(err => {
            alert(`Error entering fullscreen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

parseRules();
initCanvas();
centerCanvas();
