# ApexOA - Premium Technical Mock Assessment Workspace

ApexOA is a modern, state-of-the-art interactive technical assessment engine designed to help candidates prepare for real-world online assessments (OAs) and technical interviews. Powered by Google Gemini AI, it generates customized, role-specific assessments and provides detailed, objective evaluations.

## 🚀 Core Features

- **Flexible Assessment Configuration**: Tailor sessions based on domain target (Data Structures & Algorithms, System Design, CS Core Fundamentals, or Behavioral) and experience level (Intern, Junior, Mid-Level, Senior).
- **Multiple Assessment Mediums**:
  - **Code-Based IDE**: Write solutions in a rich, multi-language (JavaScript, Python, C++, Java) Monaco Editor with automatic boilerplate template generation.
  - **MCQ Quiz**: Answer theoretical core concepts with robust multiple-choice options.
  - **Text-Based Workspace**: Formulate high-level system architectures or behavioral STAR-method explanations.
- **Dynamic Proctored Session**: Uses webcam integration to simulate an authentic proctored exam workspace environment.
- **Genuine AI-Driven Feedback**: Returns constructive, objective assessments detailing a 1-10 score, ideal answers, and tailored study directions. MCQ answers are evaluated instantly and cleanly.
- **Interactive Dashboard & Progress Tracker**:
  - **Dynamic Streak Counter**: Computes consecutive calendar-days of attempted assessments to maintain study momentum.
  - **Skill Matrix Chart**: Visualizes strengths and focus areas using a radar chart representation.
  - **Autosave and Resume**: Live workspace progress is saved automatically, allowing users to exit and resume assessments safely from their dashboard.

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript
- **Database / ORM**: PostgreSQL via Prisma Client
- **AI Integration**: Google Generative AI SDK (Gemini 2.5 Flash)
- **Editor Integration**: Monaco Editor (@monaco-editor/react)
- **Authentication**: NextAuth.js
- **Styling**: Vanilla CSS, Tailwind CSS utilities
- **Visuals**: Recharts (Radar Chart), Material symbols

## 💻 Getting Started

### Prerequisites

Ensure you have Node.js and a PostgreSQL instance running (or Supabase URL configured).

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd ApexOA
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   GEMINI_API_KEY="AIzaSy..."
   NEXTAUTH_SECRET="your-auth-secret"
   ```

4. Run database migrations:
   ```bash
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to view the workspace.

## 📝 License

Made with love by Aryan Gautam. All rights reserved.
