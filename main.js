/* ─── Main Page JS ────────────────────────────────────────────────────────────── */

const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : '';
let currentSource = 'email';

// ─── Toast System ────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ─── Source Selection ────────────────────────────────────────────────────────
function setSource(source) {
    currentSource = source;
    document.querySelectorAll('.source-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.source === source);
    });
    const textarea = document.getElementById('scan-input');
    const placeholders = {
        email: 'Paste email content here...\n\nExample:\nHi John, my phone is 9876543210 and email is john@company.com\nHere is my credit card: 4532015112830366\nPassword: MyS3cretP@ss!',
        chat: 'Paste chat/text message here...\n\nExample:\nHey! My number is 8001234567.\nCan you send money to my card 5425233430109903?',
        document: 'Paste document or text content here...\n\nExample:\nEmployee Record\nSSN: 123-45-6789\nIP: 192.168.1.100\napi_key: sk_live_abcdefghij1234567890',
        spam: 'Paste suspicious message here...\n\nExample:\nURGENT: Your account is suspended. Click to claim your FREE PRIZE and WIN cash today! Verify your identity at spam-link.com'
    };
    textarea.placeholder = placeholders[source] || placeholders.email;
}

// ─── Sample Data ─────────────────────────────────────────────────────────────
function loadSampleData() {
    const samples = {
        email: `Subject: Account Details

Hi Team,

Please find the employee details below:
- Name: Rahul Sharma
- Email: rahul.sharma@company.com
- Phone: 9876543210
- Credit Card: 4532015112830366
- Password: admin@2024!
- Backup password: MySecret_123
- SSN: 123-45-6789

Also, the server at 192.168.1.100 has the api_key=sk_live_abcdefghijklmnop1234

Thanks,
HR Department`,
        chat: `[10:30 AM] Priya: Hey, can you send me your card number?
[10:31 AM] Amit: Sure, it's 5425233430109903
[10:31 AM] Amit: My phone is 8001234567
[10:32 AM] Priya: Got it! My email is priya.k@gmail.com
[10:33 AM] Amit: password=MyP@ssw0rd123
[10:34 AM] Priya: Don't share passwords in chat!`,
        document: `=== Employee Database Export ===
ID: EMP-001
Name: Navneet Kaur
Contact: navneet@university.edu
Mobile: 7856341290
DOB: 03/15/1998
SSN: 456-78-9012
Office IP: 10.0.0.55
Access Token: token=ghp_abc123def456ghi789jkl012mno345
Credit Card on File: 6011514433546201
Emergency Contact: 9988776655`,
        spam: `URGENT ACTION REQUIRED
        
Dear User,
Your account has been suspended due to suspicious activity. We need to verify your information immediately. 
Please click the link below to win a free gift and claim your lottery prize! You will earn a massive bonus profit!

Contact us at 800-555-0199 or support@verify-now-win.com

Credit Card required: 4111222233334444
Password: mypassword123`
    };
    document.getElementById('scan-input').value = samples[currentSource] || samples.email;
    showToast('Sample data loaded — ready to scan!', 'info');
}

// ─── Scan Text ───────────────────────────────────────────────────────────────
async function scanText() {
    const text = document.getElementById('scan-input').value.trim();
    if (!text) {
        showToast('Please enter some text to scan.', 'warning');
        return;
    }

    const btn = document.getElementById('scan-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const response = await fetch(API_BASE + '/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, source: currentSource })
        });
        const data = await response.json();

        if (data.success) {
            displayResults(data);
            if (data.total_found > 0) {
                showToast(`⚠️ ${data.total_found} sensitive item(s) detected!`, 'warning');
            } else {
                showToast('✅ No sensitive data detected.', 'success');
            }
        } else {
            showToast(data.error || 'Scan failed.', 'error');
        }
    } catch (error) {
        showToast('Connection error. Is the server running?', 'error');
        console.error(error);
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ─── Display Results ─────────────────────────────────────────────────────────
function displayResults(data) {
    const section = document.getElementById('results-section');
    const findingsContainer = document.getElementById('findings-list');
    const summaryContainer = document.getElementById('results-summary');

    section.classList.add('visible');

    // Summary
    const severityCounts = { critical: 0, high: 0, medium: 0 };
    data.findings.forEach(f => {
        if (severityCounts[f.severity] !== undefined) severityCounts[f.severity]++;
    });

    summaryContainer.innerHTML = `
        <div class="summary-item">
            <div class="count">${data.total_found}</div>
            <div class="label">Total Found</div>
        </div>
        <div class="summary-item">
            <div class="count" style="color: var(--severity-critical)">${severityCounts.critical}</div>
            <div class="label">Critical</div>
        </div>
        <div class="summary-item">
            <div class="count" style="color: var(--severity-high)">${severityCounts.high}</div>
            <div class="label">High</div>
        </div>
        <div class="summary-item">
            <div class="count" style="color: var(--severity-medium)">${severityCounts.medium}</div>
            <div class="label">Medium</div>
        </div>
    `;

    // Findings
    if (data.findings.length === 0) {
        findingsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛡️</div>
                <h3>All Clear!</h3>
                <p>No sensitive data was detected in your input.</p>
            </div>
        `;
    } else {
        findingsContainer.innerHTML = data.findings.map((f, i) => `
            <div class="finding-card" style="animation-delay: ${i * 0.08}s">
                <div class="finding-icon">${f.icon}</div>
                <div class="finding-info">
                    <h3>${f.type}</h3>
                    <p class="description">${f.description}</p>
                    <div class="finding-data">
                        <span class="data-tag tag-original" title="Original">${escapeHtml(f.original)}</span>
                        <span style="color: var(--navy-400)">→</span>
                        <span class="data-tag tag-masked" title="Masked">${escapeHtml(f.masked)}</span>
                    </div>
                </div>
                <div class="finding-severity">
                    <span class="severity-badge severity-${f.severity}">
                        ● ${f.severity}
                    </span>
                </div>
            </div>
        `).join('');
    }

    // Scroll to results
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Mask All Data ───────────────────────────────────────────────────────────
async function maskAllData() {
    const text = document.getElementById('scan-input').value.trim();
    if (!text) {
        showToast('Please enter some text first.', 'warning');
        return;
    }

    try {
        const response = await fetch(API_BASE + '/api/mask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();

        const maskedSection = document.getElementById('masked-output');
        maskedSection.classList.add('visible');
        document.getElementById('masked-text').textContent = data.masked;
        showToast(`🔒 ${data.replacements} item(s) masked successfully.`, 'success');
        maskedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        showToast('Failed to mask data.', 'error');
    }
}

// ─── Copy Masked Text ────────────────────────────────────────────────────────
function copyMaskedText() {
    const text = document.getElementById('masked-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    });
}

// ─── Clear ───────────────────────────────────────────────────────────────────
function clearAll() {
    document.getElementById('scan-input').value = '';
    document.getElementById('results-section').classList.remove('visible');
    document.getElementById('masked-output').classList.remove('visible');
    showToast('Cleared.', 'info');
}

// ─── Image Optimization ───────────────────────────────────────────────────────
function optimizeImageForOCR(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            
            // Limit width to 1200px (sweet spot for OCR speed vs accuracy)
            const MAX_WIDTH = 1200;
            if (img.width <= MAX_WIDTH) {
                return resolve(file);
            }
            
            const canvas = document.createElement('canvas');
            const scale = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                resolve(blob ? new File([blob], file.name, { type: file.type }) : file);
            }, file.type, 0.9);
        };
        
        img.onerror = () => resolve(file); // Fallback to original if load fails
        img.src = url;
    });
}

// ─── File Upload ─────────────────────────────────────────────────────────────
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type && file.type.startsWith('image/')) {
        const scanInput = document.getElementById('scan-input');
        scanInput.value = "Starting up OCR Engine... (Preparing to scan)";
        showToast('Running OCR on image. This may take a moment...', 'info');
        
        try {
            // Visualize selection
            document.querySelector('.upload-text h3').innerHTML = `🖼️ Uploaded: <span style="color: var(--accent-cyan);">${file.name}</span>`;

            // Compress large images so processing takes 1-2 seconds instead of 10-20 seconds
            const optimizedFile = await optimizeImageForOCR(file);
            
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const percent = Math.round(m.progress * 100);
                        scanInput.value = `Analyzing Image...\n\nExtracting Text: ${percent}%`;
                    } else {
                        scanInput.value = `Analyzing Image...\n\nStatus: ${m.status}...`;
                    }
                }
            });
            const { data: { text } } = await worker.recognize(optimizedFile);
            await worker.terminate();
            
            document.getElementById('scan-input').value = text;
            updateCounts();
            showToast('Image scanned successfully!', 'success');
            
            // Auto trigger scan
            scanText();
        } catch (error) {
            console.error(error);
            showToast('Failed to read text from image.', 'error');
            document.getElementById('scan-input').value = "";
        }
        return;
    }

    // Check by extension primarily as mime types can be unreliable on Windows
    const validExtensions = ['.txt', '.csv', '.log', '.json', '.md', '.html', '.conf'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid && file.type && !file.type.startsWith('text/') && file.type !== 'application/json') {
        showToast('Unsupported file type. Please use text-based files (.txt, .csv, .json, etc.)', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('scan-input').value = e.target.result;
        updateCounts();
        showToast(`File "${file.name}" loaded successfully.`, 'success');
    };
    reader.readAsText(file);
}

// ─── Drag & Drop ─────────────────────────────────────────────────────────────
function setupDragDrop() {
    const zone = document.getElementById('file-upload-zone');
    if (!zone) return;

    ['dragenter', 'dragover'].forEach(evt => {
        zone.addEventListener(evt, (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        zone.addEventListener(evt, (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
        });
    });

    zone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('scan-input').value = ev.target.result;
                updateCounts();
                document.querySelector('.upload-text h3').innerHTML = `📄 Uploaded: <span style="color: var(--accent-cyan);">${file.name}</span>`;
                showToast(`File "${file.name}" loaded.`, 'success');
            };
            reader.readAsText(file);
        }
    });
}

// ─── Real-time Scanning ──────────────────────────────────────────────────────
let debounceTimer;
function setupRealtimeScan() {
    const textarea = document.getElementById('scan-input');
    const indicator = document.getElementById('realtime-indicator');

    textarea.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        
        if (textarea.value.trim().length > 5) {
            indicator.style.display = 'inline-flex';
            indicator.querySelector('span').textContent = 'Analyzing...';
            debounceTimer = setTimeout(async () => {
                // Update counts inside debounce so it doesn't block typing
                updateCounts();

                // Quick pattern check without API call for real-time feedback
                const text = textarea.value;
                const quickPatterns = [
                    { pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/, label: 'Email' },
                    { pattern: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, label: 'Phone' },
                    { pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/, label: 'Card' },
                    { pattern: /(?:password|passwd|pwd)\s*[:=]\s*\S+/i, label: 'Password' }
                ];

                const detected = quickPatterns.filter(p => p.pattern.test(text)).map(p => p.label);
                if (detected.length > 0) {
                    indicator.style.display = 'inline-flex';
                    indicator.querySelector('span').textContent = `Detected: ${detected.join(', ')}`;
                } else {
                    indicator.querySelector('span').textContent = 'Secure Mode Active';
                }
            }, 250); // Faster response: 250ms debounce
        } else {
            indicator.style.display = 'none';
            // Also update counts when text is cleared or very short
            updateCounts();
        }
    });
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ─── Update Counts ──────────────────────────────────────────────────────────
function updateCounts() {
    const text = document.getElementById('scan-input').value;
    const charCount = text.length;
    // Faster word count using regex match instead of split, to prevent UI freezing on large pasting
    const wordCount = text.trim() ? (text.match(/\S+/g) || []).length : 0;
    
    document.getElementById('char-count').textContent = `${charCount.toLocaleString()} characters`;
    document.getElementById('word-count').textContent = `${wordCount.toLocaleString()} words`;
}

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setSource('email');
    setupDragDrop();
    setupRealtimeScan();
});
