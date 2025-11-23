# Valifi Fintech Platform

## Project Overview

This is a comprehensive standalone fintech application providing banking, investment, and financial services. It is a full-stack project with a React frontend, a Node.js backend, and a PostgreSQL database. The project is well-structured, with separate directories for the frontend, backend, and shared code.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with bcrypt
- **Blockchain**: ethers.js for Web3 interactions
- **Payment Processing**: Stripe, crypto payment processors
- **Real-time**: Socket.IO for WebSocket connections

## Building and Running

To run this project, you will need to have Node.js and PostgreSQL installed.

1.  **Clone the repository**
2.  **Install dependencies**: `npm install`
3.  **Set up environment variables**: Create a `.env` file in the `valifi` directory. You can use `valifi/.env.example` as a template.
4.  **Initialize the database**: `npm run db:push`
5.  **Start the development server**: `npm run dev`

The application will be available at `http://localhost:5000`.

## Development Conventions

The project uses TypeScript for both the frontend and backend. The database schema is defined in `shared/schema.ts` using Drizzle ORM, and Zod is used for validation. The frontend uses React with Vite, and the backend is a Node.js application with Express. The project is well-organized, with a clear separation of concerns between the frontend, backend, and shared code.