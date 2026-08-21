# Promise-to-Pay Tracker

AI Revenue Recovery agent for B2B collections — Razorpay AI Buildathon, Track 03.

> Setup, architecture diagram, and bug log to be filled in as each phase lands.
> See docs/requirements.md for full functional/non-functional requirements
> and docs/architecture.md for the system design.

## Quick start (backend)

    cd backend
    python -m venv venv && source venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env
    python scripts/seed_invoices.py
    uvicorn app.main:app --reload

## Quick start (frontend)

    cd frontend
    npm install
    npm run dev

## Project structure

See `docs/architecture.md` for the full system diagram.
