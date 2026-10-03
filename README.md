# Kukkiwon Cup Championship Platform

Official tournament registration, digital accreditation, and electronic scoring platform sanctioned by **Kukkiwon India North Branch** in partnership with **Kyorix Sports Technology**.

---

## Overview

The Kukkiwon Cup Championship platform is a high-performance Next.js application designed to manage martial arts championship lifecycles:
- **Participant Registration**: Athletes, coaches, and academy delegations with division & Dan/Poom validation.
- **Accreditation & Badging**: Cryptographic QR credential cards for ringside verification.
- **Tournament Administration**: CMS management for categories, divisions, dates, and live status.
- **Kyorix Scoring Integration**: Real-time integration boundary for electronic PSS body protectors and mat management.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL via Prisma ORM
- **Identity & Security**: Role-Based Access Control (RBAC), PBKDF2 cryptography, JWT session management
- **Deployment**: Vercel

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Sameer0535/kukkiwon-cup-championship.git
   cd kukkiwon-cup-championship
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Generate Prisma Client and push database schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the local development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Production Deployment

This project is deployed to Vercel and configured for automatic continuous deployment upon pushing to `master`:
- **Live URL**: [https://kukkiwon-cup-championship.vercel.app](https://kukkiwon-cup-championship.vercel.app)

---

## License & Ownership

© 2026 Kyorix Sports Technology Private Limited. All rights reserved.
Sanctioned by Kukkiwon India North Branch.
