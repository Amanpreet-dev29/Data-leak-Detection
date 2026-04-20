/* ─── Dashboard JS ────────────────────────────────────────────────────────────── */

const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : '';

// ─── Load Stats ──────────────────────────────────────────────────────────────
async function loadDashboard() {
    try {
        const response = await fetch(API_BASE + '/api/stats');
        const data = await response.json();
        updateStats(data.stats);
        updateHistory(data.recent_scans);
        drawChart(data.stats);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// ─── Update Stat Cards ──────────────────────────────────────────────────────
function updateStats(stats) {
    animateCounter('stat-total-scans', stats.total_scans);
    animateCounter('stat-leaks-detected', stats.leaks_detected);
    animateCounter('stat-emails', stats.emails_found);
    animateCounter('stat-phones', stats.phones_found);
    animateCounter('stat-cards', stats.credit_cards_found);
    animateCounter('stat-passwords', stats.passwords_found);
}

function animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 1000;
    const start = parseInt(el.textContent) || 0;
    const diff = target - start;
    if (diff === 0) { el.textContent = target; return; }
    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(start + diff * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ─── Update History Table ────────────────────────────────────────────────────
function updateHistory(scans) {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;

    if (scans.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <h3>No scans yet</h3>
                        <p>Go to the scanner page and run your first scan.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = scans.map(scan => {
        const severityClass = scan.severity === 'none' ? '' : `severity-${scan.severity}`;
        return `
            <tr>
                <td class="mono">#${scan.id}</td>
                <td class="mono">${scan.timestamp}</td>
                <td>${scan.source}</td>
                <td>
                    <span class="severity-badge ${severityClass}">
                        ${scan.findings_count} finding${scan.findings_count !== 1 ? 's' : ''}
                    </span>
                </td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHtml(scan.text_preview)}
                </td>
            </tr>
        `;
    }).join('');
}

// ─── Draw Donut Chart (Canvas) ───────────────────────────────────────────────
function drawChart(stats) {
    const canvas = document.getElementById('type-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 200;
    canvas.width = size * 2; // for retina
    canvas.height = size * 2;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(2, 2);

    const data = [
        { label: 'Emails', value: stats.emails_found, color: '#00d4ff' },
        { label: 'Phones', value: stats.phones_found, color: '#b388ff' },
        { label: 'Cards', value: stats.credit_cards_found, color: '#ff4757' },
        { label: 'Passwords', value: stats.passwords_found, color: '#ffa726' },
        { label: 'SSN', value: stats.ssn_found, color: '#00e676' },
        { label: 'IP Addr', value: stats.ip_found, color: '#40c4ff' },
        { label: 'Spam', value: stats.spam_found !== undefined ? stats.spam_found : 0, color: '#ffea00' }
    ];

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 80;
    const innerR = 50;

    if (total === 0) {
        // Draw empty state
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(74, 90, 184, 0.15)';
        ctx.fill();

        ctx.fillStyle = '#4a5ab8';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data yet', cx, cy);
        return;
    }

    let startAngle = -Math.PI / 2;

    data.forEach(d => {
        if (d.value === 0) return;
        const sliceAngle = (d.value / total) * Math.PI * 2;

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
        ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = d.color;
        ctx.fill();

        startAngle += sliceAngle;
    });

    // Center label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 8);
    ctx.fillStyle = '#7b8ad4';
    ctx.font = '500 10px Inter, sans-serif';
    ctx.fillText('TOTAL', cx, cy + 10);

    // Update legend
    const legend = document.getElementById('chart-legend');
    if (legend) {
        legend.innerHTML = data.map(d => `
            <div class="legend-item">
                <span class="legend-dot" style="background: ${d.color}"></span>
                ${d.label}: ${d.value}
            </div>
        `).join('');
    }
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ─── Auto Refresh ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    setInterval(loadDashboard, 3000); // refresh every 3s for real-time feel
});
