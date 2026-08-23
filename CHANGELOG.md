# Changelog

All notable changes to the Promise-to-Pay Tracker platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.1.0] - 2026-08-23
### Added
- **Feature (`feature/login`)**: Added user authentication and session management service with demo multi-user profiles.
- **Feature (`feature/payment`)**: Added Razorpay webhook HMAC-SHA256 signature verification and automated payment reconciliation.
- **Feature (`feature/profile`)**: Added UserProfile schemas, customer settings, and organization workspace context.

### Fixed
- **Hotfix (`hotfix/v1.0.1`)**: Input sanitization and emergency validation security patch.

---

## [v1.0.1] - 2026-08-22
### Security Hotfix
- Sanitized input text fields against XSS and SQL injection patterns.
- Added strict numeric bounds validation for payment amounts.

---

## [v1.0.0] - 2026-08-21
### Initial Production Release
- SmartInvoice AI Recovery Dashboard with Promise-to-Pay tracking.
- Autonomous LLM email and WhatsApp reminder agent.
- In-memory SQLite / MySQL dual database fallback.
- Automated CI/CD pipeline and Heroku deployment manifests.
