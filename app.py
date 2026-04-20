"""
Data Leak Detection System - Flask Backend
Detects sensitive information like emails, phone numbers, credit cards, and passwords.
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory storage for scan history
scan_history = []
stats = {
    "total_scans": 0,
    "leaks_detected": 0,
    "credit_cards_found": 0,
    "passwords_found": 0,
    "ssn_found": 0,
    "ip_found": 0,
    "spam_found": 0
}

# ─── Detection Patterns ────────────────────────────────────────────────────────

PATTERNS = {
    "Email Address": {
        "regex": re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b'),
        "icon": "📧",
        "severity": "high",
        "description": "Email addresses can be used for phishing, spam, or identity theft."
    },
    "Phone Number": {
        "regex": re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'),
        "icon": "📱",
        "severity": "high",
        "description": "Phone numbers can be exploited for social engineering or spam."
    },
    "Credit Card": {
        "regex": re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b'),
        "icon": "💳",
        "severity": "critical",
        "description": "Credit card numbers are highly sensitive financial data."
    },
    "SSN (Social Security)": {
        "regex": re.compile(r'\b\d{3}[-]?\d{2}[-]?\d{4}\b'),
        "icon": "🆔",
        "severity": "critical",
        "description": "Social Security Numbers are critical personal identifiers."
    },
    "IP Address": {
        "regex": re.compile(r'\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b'),
        "icon": "🌐",
        "severity": "medium",
        "description": "IP addresses can reveal location and network information."
    },
    "Password Pattern": {
        "regex": re.compile(r'(?i)(?:password|passwd|pwd|pass)\s*[:=]\s*\S+'),
        "icon": "🔑",
        "severity": "critical",
        "description": "Exposed passwords are a severe security vulnerability."
    },
    "API Key / Token": {
        "regex": re.compile(r'(?i)(?:api[_-]?key|token|secret[_-]?key|access[_-]?token)\s*[:=]\s*[A-Za-z0-9_\-]{16,}'),
        "icon": "🗝️",
        "severity": "critical",
        "description": "API keys and tokens grant access to external services."
    },
    "Date of Birth": {
        "regex": re.compile(r'\b(?:0[1-9]|1[0-2])[/\-](?:0[1-9]|[12]\d|3[01])[/\-](?:19|20)\d{2}\b'),
        "icon": "📅",
        "severity": "medium",
        "description": "Date of birth is personal information used in identity verification."
    },
    "Spam / Phishing": {
        "regex": re.compile(r'(?i)\b(?:win|prize|winner|free|lottery|bonus|gift|urgent|action required|suspended|verify|locked|limited time|investment|profit|earn|cash)\b'),
        "icon": "🎣",
        "severity": "medium",
        "description": "Suspicious keywords commonly used in spam and phishing campaigns."
    }
}


def mask_data(text, data_type, match_text):
    """Generate masked version of sensitive data."""
    length = len(match_text)
    if data_type == "Email Address":
        parts = match_text.split("@")
        if len(parts) == 2:
            user = parts[0]
            domain = parts[1]
            masked_user = user[0] + "***" + (user[-1] if len(user) > 1 else "")
            return f"{masked_user}@{domain}"
    elif data_type == "Phone Number":
        digits = re.sub(r'\D', '', match_text)
        if len(digits) >= 4:
            return digits[:2] + "*" * (len(digits) - 4) + digits[-2:]
    elif data_type == "Credit Card":
        digits = re.sub(r'\D', '', match_text)
        return digits[:4] + " **** **** " + digits[-4:]
    elif data_type == "SSN (Social Security)":
        return "***-**-" + match_text[-4:]
    elif data_type == "Password Pattern":
        parts = re.split(r'[:=]\s*', match_text, maxsplit=1)
        if len(parts) == 2:
            return parts[0] + ": " + "*" * len(parts[1])
    elif data_type == "IP Address":
        octets = match_text.split(".")
        return f"{octets[0]}.***.***.{octets[-1]}"
    elif data_type == "API Key / Token":
        parts = re.split(r'[:=]\s*', match_text, maxsplit=1)
        if len(parts) == 2:
            token = parts[1]
            return parts[0] + ": " + token[:4] + "*" * (len(token) - 8) + token[-4:]

    # Default masking
    if length > 4:
        return match_text[:2] + "*" * (length - 4) + match_text[-2:]
    return "*" * length


def scan_text(text):
    """Scan text for sensitive data patterns."""
    findings = []

    for data_type, config in PATTERNS.items():
        matches = config["regex"].finditer(text)
        for match in matches:
            match_text = match.group()
            masked = mask_data(text, data_type, match_text)
            findings.append({
                "type": data_type,
                "icon": config["icon"],
                "severity": config["severity"],
                "description": config["description"],
                "original": match_text,
                "masked": masked,
                "start": match.start(),
                "end": match.end()
            })

    return findings


# ─── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/")
@app.route("/index.html")
def index():
    """Main scanning page."""
    return render_template("index.html")


@app.route("/dashboard")
@app.route("/dashboard.html")
def dashboard():
    """Dashboard with analytics."""
    return render_template("dashboard.html")


@app.route("/api/scan", methods=["POST"])
def api_scan():
    """API endpoint to scan text for sensitive data."""
    data = request.get_json()
    text = data.get("text", "")
    source = data.get("source", "manual")

    if not text.strip():
        return jsonify({"error": "No text provided"}), 400

    findings = scan_text(text)

    # Update stats
    stats["total_scans"] += 1
    if findings:
        stats["leaks_detected"] += 1

    for f in findings:
        dtype = f["type"]
        if "Email" in dtype:
            stats["emails_found"] += 1
        elif "Phone" in dtype:
            stats["phones_found"] += 1
        elif "Credit" in dtype:
            stats["credit_cards_found"] += 1
        elif "Password" in dtype or "API" in dtype:
            stats["passwords_found"] += 1
        elif "SSN" in dtype:
            stats["ssn_found"] += 1
        elif "IP" in dtype:
            stats["ip_found"] += 1
        elif "Spam" in dtype:
            stats["spam_found"] += 1

    # Save to history
    scan_record = {
        "id": len(scan_history) + 1,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source": source,
        "text_preview": text[:80] + "..." if len(text) > 80 else text,
        "findings_count": len(findings),
        "severity": max([f["severity"] for f in findings], key=lambda s: {"low": 0, "medium": 1, "high": 2, "critical": 3}[s]) if findings else "none",
        "findings": findings
    }
    scan_history.insert(0, scan_record)

    # Keep only last 50 records
    if len(scan_history) > 50:
        scan_history.pop()

    return jsonify({
        "success": True,
        "findings": findings,
        "total_found": len(findings),
        "scan_id": scan_record["id"]
    })


@app.route("/api/stats")
def api_stats():
    """Get scanning statistics."""
    return jsonify({
        "stats": stats,
        "recent_scans": scan_history[:10]
    })


@app.route("/api/mask", methods=["POST"])
def api_mask():
    """Mask all sensitive data in text."""
    data = request.get_json()
    text = data.get("text", "")

    if not text.strip():
        return jsonify({"error": "No text provided"}), 400

    findings = scan_text(text)
    masked_text = text

    # Sort findings by position (reverse) to avoid offset issues
    sorted_findings = sorted(findings, key=lambda f: f["start"], reverse=True)
    for f in sorted_findings:
        masked_text = masked_text[:f["start"]] + f["masked"] + masked_text[f["end"]:]

    return jsonify({
        "original": text,
        "masked": masked_text,
        "replacements": len(findings)
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
