# ChatEHR: Conversational EHR Assistant

**ChatEHR** is an advanced, context-aware chat application designed for healthcare professionals. It serves as an intelligent assistant that integrates directly with Electronic Health Record (EHR) systems using the SMART on FHIR protocol. The application allows practitioners to conversationally query patient data, and it leverages a Retrieval-Augmented Generation (RAG) system powered by a vector database to answer questions based on a custom, user-uploaded knowledge base.

## Demo

[![ChatEHR Demo Video](https://img.youtube.com/vi/5j-MGm0cysg/maxresdefault.jpg)](https://youtu.be/5j-MGm0cysg)

## Features

- **Conversational EHR Interaction:** Talk to your EHR system in natural language (e.g., "What are the active conditions for this patient?").
- **RAG-Powered Knowledge Base:** Upload documents (PDF, TXT, JSON, CSV) to create a personalized knowledge base that the AI can use to answer questions.
- **Dynamic FHIR Tools:** Connects to a FHIR Multi-Capability-Server (MCP) to dynamically load tools that can interact with live EHR data in real-time.
- **Secure Authentication:** Uses the industry-standard SMART on FHIR launch framework for secure, OAuth2-based authentication.
- **Persistent Chat History:** All conversations are saved to a TiDB Serverless database. Chats can be searched, pinned, and deleted.
- **Powered by TiDB Vector Search:** The RAG functionality is built on TiDB Serverless, utilizing its vector search capabilities (`VEC_COSINE_DISTANCE`).
- **Modern Tech Stack:** Built with Next.js, React, Tailwind CSS, Drizzle ORM, and the Vercel AI SDK.

## Data Flow and Integrations

1.  **Authentication:** A healthcare practitioner initiates a SMART on FHIR launch. After a successful OAuth2 login, a session is created with an encrypted JWT cookie.
2.  **Knowledge Base Creation (RAG):**
    - The practitioner uploads documents (PDF, TXT, etc.) via the `/collections` page.
    - The backend uses LangChain to parse the content, generates vector embeddings using Google's `gemini-embedding-001` model, and stores the chunks and embeddings in a **TiDB Serverless** database.
3.  **Chat Interaction & AI Processing:**
    - When a message is sent, the `/api/chat` endpoint performs a vector similarity search in TiDB to find relevant document chunks (RAG).
    - It also fetches dynamic tools from a FHIR MCP to interact with the live EHR.
    - The context from RAG, the FHIR tools, and chat history are passed to the **Moonshot AI** model.
4.  **Response Generation:** The AI processes the request, using either the knowledge base or the live FHIR tools to generate a comprehensive answer.
5.  **State Management:** All chat messages and tool calls are stored in the TiDB database for persistence.

## Getting Started

### Prerequisites

- Node.js
- pnpm (package manager)
- Access to a TiDB Cloud Serverless cluster.

### Installation and Setup

1.  **Clone the repository:**

    ```bash
    git clone "https://github.com/0bese/chatehr.git"
    cd chatehr
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project and add the following variables:

    ```env
    # TiDB Connection String
    TIDB_URL="mysql://user:password@host/database?ssl={"rejectUnauthorized":true}"

    # These are parsed from the TIDB_URL but might be needed for other scripts
    HOST="your-tidb-host"
    USER="your-tidb-user"
    PASSWORD="your-tidb-password"
    DATABASE="your-tidb-database"

    # Secret for encrypting session cookies
    SESSION_SECRET="a-secure-random-string-of-at-least-32-characters"

    # API Key for the LLM provider (Moonshot AI)
    KIMIK2="your-moonshot-ai-api-key"
    ```

4.  **Run Database Migrations:**
    The project uses Drizzle ORM. To apply schema changes, first generate the migration files, then push the changes to your database.

    ```bash
    # To generate migration files based on schema changes
    pnpm db:generate

    # To apply the generated migrations to the database
    pnpm db:push
    ```

5.  **Run the development server:**

    ```bash
    pnpm dev
    ```

6.  **Open the application:**
    Access `http://localhost:3000` in your browser. You will be redirected to the FHIR launch page to begin the authentication process.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
