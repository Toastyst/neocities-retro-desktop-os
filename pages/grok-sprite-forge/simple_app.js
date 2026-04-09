// Simple version: Generate a single 32x32 pixel sprite

let apiKey = localStorage.getItem('simpleGrokApiKey') || '';

const apiKeyInput = document.getElementById('apiKey');
const generateForm = document.getElementById('generateForm');
const generateBtn = document.getElementById('generateBtn');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const spriteCanvas = document.getElementById('spriteCanvas');
const downloadBtn = document.getElementById('downloadBtn');

// Initialize
apiKeyInput.value = apiKey;

// Event listeners
apiKeyInput.addEventListener('input', saveApiKey);
generateForm.addEventListener('submit', handleGenerate);
downloadBtn.addEventListener('click', downloadSprite);

function saveApiKey() {
    apiKey = apiKeyInput.value;
    localStorage.setItem('simpleGrokApiKey', apiKey);
}

async function handleGenerate(e) {
    e.preventDefault();
    if (!apiKey) {
        alert('Please enter your API key');
        return;
    }

    const description = document.getElementById('description').value.trim();
    if (!description) {
        alert('Please enter a character description');
        return;
    }

    generateBtn.disabled = true;
    progress.classList.remove('hidden');
    updateProgress(20, 'Generating sprite...');

    try {
        const prompt = `Create a single 32×32 pixel art sprite of ${description}. Strict pixel art, 16-color max, transparent background.`;
        const response = await callGrokAPI(prompt);
        updateProgress(60, 'Processing...');
        await displaySprite(response);
        updateProgress(100, 'Done!');
        downloadBtn.disabled = false;
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        generateBtn.disabled = false;
        setTimeout(() => progress.classList.add('hidden'), 2000);
    }
}

async function callGrokAPI(prompt) {
    const response = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'grok-imagine-image',
            prompt: prompt,
            n: 1,
            response_format: 'b64_json',
            aspect_ratio: "1:1"
        })
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

async function displaySprite(data) {
    const img = new Image();
    img.src = `data:image/png;base64,${data.data[0].b64_json}`;
    await new Promise(resolve => img.onload = resolve);

    const ctx = spriteCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 32, 32);
    ctx.drawImage(img, 0, 0, 32, 32);
}

function downloadSprite() {
    const link = document.createElement('a');
    link.download = 'sprite.png';
    link.href = spriteCanvas.toDataURL('image/png');
    link.click();
}

function updateProgress(percent, text) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = text;
}