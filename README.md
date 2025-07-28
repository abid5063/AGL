# AgroLink
An AI-Powered animal disease detection app

## CI/CD Pipeline
This project uses GitHub Actions for automated Docker builds and deployment to Docker Hub.
# AGL Livestock Management App

## Overview
AGL is a cross-platform livestock management application designed for farmers and veterinarians. It provides tools for animal record keeping, health management, messaging, veterinary location search, and AI-powered assistance. The app is built with React Native (Expo), Node.js backend, and supports web, mobile, and desktop platforms.

## Features
- Farmer and Veterinarian authentication and profile management
- Add, edit, and view animal records
- Task and appointment management
- Disease detection and health check (AI-powered)
- Messaging system for farmers and vets
- Veterinary clinic location search (with AI integration)
- Vaccine management and reminders
- Market analysis and food suggestions
- Multi-language support (English/Bangla)

## Tech Stack
- **Frontend:** React Native (Expo), Expo Router
- **Backend:** Node.js, Express, MongoDB
- **Mobile:** Expo, React Native
- **Web:** React
- **AI Integration:** Google Gemini API
- **Cloud:** Docker, Cloudinary (for image uploads)
- **Testing:** Jest, Playwright

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- MongoDB (local or cloud)
- Docker (optional, for containerization)

### Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/abid5063/AGL.git
   cd AGL
   ```
2. **Install dependencies:**
   - Backend:
     ```sh
     cd backend
     npm install
     ```
   - Frontend (Web):
     ```sh
     cd ../frontend
     npm install
     ```
   - Mobile:
     ```sh
     cd ../mobile
     npm install
     ```

### Running the App
- **Backend:**
  ```sh
  cd backend
  npm start
  ```
- **Frontend (Web):**
  ```sh
  cd frontend
  npm start
  ```
- **Mobile (Expo):**
  ```sh
  cd mobile
  expo start
  ```

### Docker
- To run backend and frontend in Docker containers:
  ```sh
  docker-compose up --build
  ```

## Configuration
- API endpoints and keys are managed in `mobile/utils/apiConfig.js` and `backend/src/lib/cloudinary.js`.
- Update `API_BASE_URL` in `apiConfig.js` to match your backend server.
- For AI features, set your Google Gemini API key in `vetLocation.jsx`.

## Testing
- **Backend:**
  ```sh
  cd backend
  npm test
  ```
- **Mobile:**
  ```sh
  cd mobile
  npm test
  ```
- **End-to-End:**
  ```sh
  cd tests
  npm test
  ```

## Folder Structure
```
AGL/
├── backend/
├── frontend/
├── mobile/
├── tests/
├── tests-examples/
├── utils/
├── docker-compose.yml
├── README.md
└── ...
```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.

## Contact
- Author: abid5063
- Email: [your-email@example.com]
- GitHub: https://github.com/abid5063/AGL

---
For more details, see the documentation in each folder and the in-app help/tutorial section.
