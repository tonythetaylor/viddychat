
# ViddyChat

ViddyChat is a video chat application built with a modern frontend and backend stack. It provides seamless real-time communication using WebSockets and supports features like video conferencing and secure API integration.

---

## Features

- **Real-Time Communication:** Video chat powered by WebRTC and WebSockets.
- **Responsive Frontend:** A React-based Single Page Application (SPA) optimized for performance.
- **Secure Backend:** HTTPS and CORS-enabled backend with API and WebSocket support.
- **Scalable Architecture:** Containerized with Docker for easy deployment.

---

## Tech Stack

- **Frontend:** React, JavaScript/TypeScript, NGINX for static file serving
- **Backend:** Node.js, Express, Socket.IO
- **WebSocket:** Real-time communication support for video conferencing
- **Database (Optional):** PostgreSQL or MongoDB (if applicable)
- **Containerization:** Docker
- **Web Server:** NGINX for frontend and reverse proxy

---

## Installation and Setup

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- SSL Certificates (if deploying with HTTPS)

---

### Clone the Repository

```bash
git clone https://github.com/tonythetaylor/viddychat.git
cd viddychat
```

---

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the application:
   ```bash
   npm run build
   ```
4. (Optional) Start a development server:
   ```bash
   npm start
   ```

---

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run start
   ```
4. The backend runs on `https://localhost:5005`.

---

### Docker Setup

1. Build and start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```
2. Access the application:
   - Frontend: `https://localhost/`
   - API: `https://localhost/api/`
   - WebSocket: `wss://localhost/ws`

---

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Backend
PORT=5005
NODE_ENV=development
DEV_ORIGINS=http://localhost:3000
PROD_ORIGINS=https://your-production-domain.com
```

---

## NGINX Configuration

The `nginx.conf` is configured to:

- Serve static files from the React build.
- Proxy API requests to the backend at `/api/`.
- Proxy WebSocket connections to `/ws/`.

---

## File Structure

```
viddychat/
├── backend/             # Backend server code
├── frontend/            # React frontend application
├── nginx/               # NGINX configuration files
├── docker-compose.yml   # Docker Compose setup
└── README.md            # Application documentation
```

---

## Running Tests

- **Frontend Tests:**
  ```bash
  cd frontend
  npm run test
  ```
- **Backend Tests:**
  ```bash
  cd backend
  npm run test
  ```

---

## Deployment

1. Ensure the `docker-compose.yml` file is correctly configured for production.
2. Build and deploy:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```
3. Set up DNS and SSL certificates for the production domain.

---

## Troubleshooting

### Common Issues

- **CORS Errors:** Check the allowed origins in your `.env` file.
- **SSL Errors:** Ensure your SSL certificates are correctly configured in `nginx.conf`.
- **WebSocket Connection Issues:** Verify WebSocket proxying is set up in `nginx.conf`.

---

## License

This project is licensed under the MIT License.

---

## Contributors

- **Your Name** - Developer
- Contributions are welcome! Feel free to submit a pull request.
