
BK-Google-Docs-Clone
Table of Contents
About The Project

Problem Solved

Key Features

Technologies Used

Getting Started

Prerequisites

Installation

File Structure

Running with Docker (Recommended)

Usage

Local Development (Without Docker)

Configuring Vite Proxy for Local Development

Environment Variables

Client-side (.env)

Server-side (.env)

Contributing

License

Contact

Acknowledgments

About The Project
BK-Google-Docs-Clone is a real-time collaborative document editor that emulates the core functionalities of Google Docs. This application empowers users to create, edit, and manage documents seamlessly, with the added benefit of real-time collaboration with friends or team members. Whether you're working on a school project, a professional document, or just sharing notes, this clone provides a robust and intuitive platform for your needs.

Problem Solved
In an increasingly connected world, the need for efficient real-time collaboration is paramount. This project addresses the challenge of enabling multiple users to work on the same document simultaneously, ensuring that changes are instantly synchronized across all participants. It eliminates the hassle of version control and endless email attachments, streamlining the collaborative workflow.

Key Features
Real-time Collaboration: Edit documents with friends or team members, seeing changes reflected instantly.

Real-time Access Toggle: Document owners can grant or revoke access to collaborators in real-time via email.

Easy Google OAuth for Authorization: Secure and convenient user authentication through Google.

Robust Text Editor: A feature-rich text editor (powered by Quill.js) for creating and formatting your documents.

Responsive UI: A user interface designed to work seamlessly across various devices and screen sizes.

CRUD Operations for Docs: Full control over your documents, including Create, Read, Update, and Delete functionalities.

Technologies Used
This project leverages a modern MERN (MongoDB, Express.js, React, Node.js) stack with additional powerful tools.

Backend Dependencies
@google/generative-ai: For integrating Google's AI capabilities (e.g., Gemini).

body-parser: Parse incoming request bodies.

cloudinary: Cloud-based image and video management.

cookie-parser: Parse Cookie header and populate req.cookies.

cors: Enable Cross-Origin Resource Sharing.

dotenv: Load environment variables from a .env file.

express: Fast, unopinionated, minimalist web framework for Node.js.

google-auth-library: Helper library for Google API authentication.

googleapis: The Google API Node.js Client.

jsonwebtoken: Implement JSON Web Tokens for secure authentication.

mongoose: MongoDB object modeling for Node.js.

multer: Middleware for handling multipart/form-data.

multer-storage-cloudinary: Cloudinary storage engine for Multer.

nodemailer: Send emails from Node.js applications.

rate-limiter-flexible: For implementing rate limiting.

sanitize-html: Sanitize untrusted HTML (to prevent XSS attacks).

socket.io: Real-time bidirectional event-based communication.

streamifier: Converts a string or buffer into a readable stream.

validator: A library of string validators and sanitizers.

Frontend Dependencies
@react-oauth/google: React components for Google OAuth.

axios: Promise-based HTTP client for the browser and Node.js.

jwt-decode: Decode JWTs in the browser and Node.js.

quill: A modern rich text editor built for compatibility and extensibility.

react: JavaScript library for building user interfaces.

react-dom: Entry point for rendering React to the DOM.

react-icons: Popular icon sets as React components.

react-loading-indicators: Provides various loading indicators.

react-router-dom: Declarative routing for React.

socket.io-client: Client-side library for Socket.IO.

uuid: For generating RFC-compliant UUIDs.

Getting Started
To get a local copy up and running, follow these simple steps.

Prerequisites
Ensure you have the following installed on your system:

Node.js (v18 or higher recommended)

npm (Node Package Manager)

Docker (Recommended for easy setup)

Docker Compose (Usually comes with Docker Desktop)

Installation
Clone the repository:

Bash

git clone https://github.com/KINGBK1/Google-Docs.git
cd Google-Docs
Set up environment variables:
Create a .env file in both the client and server directories and populate them as described in the Environment Variables section below.

File Structure
The project follows a monorepo-like structure, separating the client (frontend) and server (backend) code:

Google-Docs/
├── client/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── ErrorPage/
│   │   │   ├── RestrictedUserPage/
│   │   │   └── TextEditor/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── .dockerignore
│   ├── .env                 <-- Client-side environment variables
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
└── server/
    ├── config/
    ├── controllers/
    ├── middlewares/
    ├── models/
    ├── node_modules/
    ├── public/
    ├── routes/
    ├── utils/
    ├── .dockerignore
    ├── .env                 <-- Server-side environment variables
    ├── Dockerfile
    ├── package-lock.json
    ├── package.json
    ├── server.js
    └── .gitignore
└── docker-compose.yml
└── README.md              <-- This file
Running with Docker (Recommended)
This project is fully Dockerized for ease of setup and deployment.

Ensure Docker is running on your system.

Build and run the containers:
From the root of the Google-Docs directory, run:

Bash

docker-compose up --build
This command will:

Build the Docker images for both the client and server.

Install all Node.js dependencies within the containers.

Start both the frontend and backend services.

The frontend will typically be accessible at http://localhost:5173 and the backend API at http://localhost:5000.

Usage
Local Development (Without Docker)
If you prefer to run the client and server separately without Docker:

Install client-side dependencies:

Bash

cd client
npm install
Install server-side dependencies:

Bash

cd ../server
npm install
Start the frontend:
Navigate to the client directory and run:

Bash

cd client
npm run dev
This will typically start the React development server on http://localhost:5173 (or another port as configured by Vite).

Start the backend:
Open a new terminal, navigate to the server directory, and run:

Bash

cd server
node server.js
This will start the Node.js Express server, usually on http://localhost:5000 (or the port defined in your .env).

You can now access the application in your web browser at http://localhost:5173 (or the URL provided by Vite). You can also deploy the application by changing the environment variables accordingly.

Configuring Vite Proxy for Local Development
When running the client and server locally without Docker, you might encounter CORS issues as they run on different ports. To avoid this, it's highly recommended to configure a proxy in your client/vite.config.js.

Example client/vite.config.js with proxy:

JavaScript

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to your backend server
      '/api': { // Or whatever your backend API base path is (e.g., '/auth', '/documents')
        target: 'http://localhost:5000', // Your backend server URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix if your backend doesn't use it
      },
      // Proxy Socket.IO websocket connections
      '/socket.io': {
        target: 'ws://localhost:5000', // Your backend server URL (websocket)
        ws: true,
      },
    },
  },
})
Note: Adjust /api and /socket.io paths according to your actual backend routes if they differ. The target should point to your backend's local address.

Environment Variables
You need to create two .env files, one in the client directory and one in the server directory.

Client-side (.env)
Create client/.env with the following variables:

Code snippet

VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_FOR_FRONTEND"
VITE_API_BASE_URL="YOUR_BACKEND_API_BASE_URL_FOR_FRONTEND_REQUESTS"
VITE_GOOGLE_CLIENT_ID: Your Google OAuth client ID for the client-side (frontend).

VITE_API_BASE_URL: The URL where your backend server is hosted (e.g., https://google-docs-clone-backend.render.com or http://localhost:5000 for local development if not using a proxy).

Server-side (.env)
Create server/.env with the following variables:

Code snippet

GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_FOR_BACKEND"
MONGO_URI="YOUR_MONGODB_CONNECTION_STRING"
PORT=5000
JWT_SECRET="YOUR_STRONG_RANDOM_JWT_SECRET"
CLOUDINARY_API_SECRET="YOUR_CLOUDINARY_API_SECRET"
CLOUDINARY_API_KEY="YOUR_CLOUDINARY_API_KEY"
CLOUD_NAME="YOUR_CLOUDINARY_CLOUD_NAME"
CLOUDINARY_UPLOAD_PRESET="YOUR_CLOUDINARY_UPLOAD_PRESET"
EMAIL_USER="YOUR_EMAIL_FOR_NODEMAILER"
APP_PASSWORD="YOUR_EMAIL_APP_PASSWORD"
FRONTEND_URL="YOUR_FRONTEND_HOSTED_URL"
BACKEND_URL="YOUR_BACKEND_HOSTED_URL"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
NODE_ENV = "development" # or "production"
GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET"
REDIRECT_URI = "YOUR_GOOGLE_OAUTH_REDIRECT_URI"
GOOGLE_CLIENT_ID: Your Google OAuth client ID for the server-side (must match the one registered with Google for your backend).

MONGO_URI: Your MongoDB connection string (e.g., from MongoDB Atlas).

PORT: The port on which the server will run (e.g., 5000).

JWT_SECRET: A strong, random string used to sign and verify JWTs. Generate a long, complex string.

CLOUDINARY_API_SECRET, CLOUDINARY_API_KEY, CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET: Credentials for your Cloudinary account, used for image storage.

EMAIL_USER, APP_PASSWORD: Credentials for the email account used by Nodemailer (e.g., a Gmail account and its app password).

FRONTEND_URL: The deployed URL of your frontend application.

BACKEND_URL: The deployed URL of your backend API.

GEMINI_API_KEY: Your API key for the Google Gemini API, if you're using it for any AI-powered features.

NODE_ENV: Set to production for production deployments, or development for local.

GOOGLE_CLIENT_SECRET: Your Google OAuth client secret.

REDIRECT_URI: The authorized redirect URI for your Google OAuth setup (e.g., http://localhost:5000/auth/google/callback or your deployed backend redirect).

Important: Never share your .env files or commit them to public repositories!

Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

There are a few known bugs yet to be addressed, particularly within the project's error handling sections. If you discover a remedy or have suggestions for improvements, please feel free to:

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

Please ensure your code adheres to the project's existing style and include clear commit messages.

License
Distributed under the MIT License. See LICENSE in the root of the repository for more information.

Contact
Bishal Kanti Bhowmik - Your LinkedIn Profile (Replace with your actual LinkedIn or GitHub profile link)
Project Link: https://github.com/KINGBK1/Google-Docs.git

Acknowledgments
Quill.js for the rich text editor.

Socket.IO for real-time communication.

MongoDB Atlas for database hosting.

Render (if used for deployment examples)
