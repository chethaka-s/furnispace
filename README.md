# Furnispace - Furniture Design Application

Furnispace is a web application that allows designers to create and visualize furniture designs in both 2D and 3D environments.



Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [MongoDB](https://www.mongodb.com/try/download/community) (version 5.0 or higher)

## Setup Instructions

1. **Clone the Repository**
   
   git clone [repository-url]
   
   

2. **Install Dependencies**
   
   npm install
   

3. **Environment Setup**
   - Create a `.env` file in the root directory
   - Add the following environment variables:
   
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   
   Replace `your_mongodb_connection_string` with your MongoDB connection URL
   Replace `your_jwt_secret_key` with a secure random string for JWT token generation



## Running the Application

1. **Development Mode**
   
   npm run dev
   
   This will start the development server with hot reloading at `http://localhost:3000`

2. **Production Build**
   ```bash
   npm run build
   npm start
   ```
   This will create an optimized production build and start the server

## Application Structure

- `/app` - Next.js application routes and API endpoints
- `/components` - Reusable React components
- `/lib` - Utility functions and database connection
- `/models` - MongoDB schema definitions
- `/public` - Static assets

## Features

- User Authentication (Login/Signup)
- 2D Furniture Design Interface
- 3D Furniture Visualization
- Design Save and Load Functionality
- Responsive UI for various screen sizes

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Designs
- `GET /api/designs` - Fetch user designs
- `POST /api/designs` - Save new design
- `PUT /api/designs/:id` - Update existing design
- `DELETE /api/designs/:id` - Delete design

## Common Issues and Solutions






## Support

For support, email [your-email] or open an issue in the repository.
