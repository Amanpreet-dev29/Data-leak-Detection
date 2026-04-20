Project Description: DataShield 
DataShield is a real-time Data Leak Detection and Prevention (DLP) system designed to identify, flag, and mask sensitive information within digital communications. It serves as a security layer to prevent the accidental exposure of Personally Identifiable Information (PII) in emails, chats, and documents.

 Key Features
Real-Time Monitoring: Automatically scans text as you type, providing instant feedback on potential data leaks without needing to refresh the page.
Advanced Pattern Detection: Uses high-performance regex engines to detect critical data types including:
Financial: Credit Card numbers (Visa, Mastercard, etc.)
Personal: Email addresses, Phone numbers, Social Security Numbers (SSN), and Dates of Birth.
Technical: IP addresses, API Keys, and Access Tokens.
Deceptive: Common phishing and spam keywords (e.g., "Win prize", "Verify account").
Image OCR Scanning: Integrated with Tesseract.js to extract and scan text directly from uploaded photos and screenshots.
Automated Data Masking: Features a one-click "Shield" mode that intelligently replaces sensitive data with secure placeholders (e.g., **** ****) while maintaining the original context.
Interactive Analytics Dashboard: A specialized interface that visualizes scan statistics, identifies severity trends (Critical vs. High), and maintains a recent history of scanning activity.
 Technical Stack
Backend: Python 3.x with Flask for API routing and internal logic.
Frontend: Professional SaaS-inspired UI built with Semantic HTML5 and Vanilla CSS (featuring a modern Glassmorphism theme).
OCR Engine: Tesseract.js for browser-side Optical Character Recognition.
Asynchronous Logic: Vanilla JavaScript with Fetch API for low-latency communication with the Flask backend.
Security Philosophy
DataShield is built on the principle of browser-side privacy. While the logic is processed via a local Flask server, the OCR and UI interactions happen locally, ensuring that sensitive text and images are handled securely within the user's controlled environment.

This project is ideal for organizations or individuals looking to audit their internal communications for security compliance (GDPR, HIPAA, etc.) before sending or storing data.
