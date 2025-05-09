# Furnispace - Furniture Design Application

Furnispace is a web application that allows designers to create and visualize furniture designs in both 2D and 3D environments.


Asset Credits

This project utilizes various assets to enhance the 2D and 3D furniture design experience. We are grateful to the creators and platforms that provided these resources. Please find the credits for the assets used below:

3D Models

The following 3D models are sourced from CGTrader and are used in the 3D design functionality of this application:





Chair: Wood Chair (https://www.cgtrader.com/free-3d-models/furniture/chair/wood-chair-1481036a-9a90-4d4d-8c86-4c997818a4b4) by CGTrader

Bookshelf: Bookshelf (https://www.cgtrader.com/free-3d-models/interior/living-room/bookshelf-bc8b5550-19eb-49e8-b423-b6406258de35) by CGTrader

Dining Table: Mio Chatham Dining Table (https://www.cgtrader.com/free-3d-models/furniture/table/mio-chatham-dining-table) by CGTrader

Sofa: Sofa Baker Cabochon (https://www.cgtrader.com/free-3d-models/furniture/sofa/sofa-baker-cabochon) by CGTrader

Coffee Table: Square Coffee Table Large by Gommaire (https://www.cgtrader.com/free-3d-models/furniture/table/square-coffee-table-large-by-gommaire) by CGTrader

Bed: Asian Bedroom Sets (https://www.cgtrader.com/free-3d-models/furniture/bed/asian-bedroom-sets) by CGTrader

Wardrobe: Modern Wardrobe (https://www.cgtrader.com/free-3d-models/interior/bedroom/modern-wardrobe-0f5c6a04-b5dc-4655-83e0-517e1baa268d) by CGTrader

Bean Bag: Bean Bag Chair (https://www.cgtrader.com/free-3d-models/furniture/chair/bean-bag-chair-967a9a42-ecd1-472d-8bbf-9f59b82b3e25) by CGTrader

TV Stand: TV Stand (https://www.cgtrader.com/free-3d-models/furniture/furniture-set/tv-stand-1-7047207e-887f-4766-94b5-f797470ba95c) by CGTrader

Dressing Table: Dressing Table (https://www.cgtrader.com/free-3d-models/household/household-tools/dressing-table-7e688391-530f-442d-86b1-b2077a77b8da) by CGTrader


Textures

The following textures are sourced from PNGTree and are used to enhance the visual quality of the 3D models:
Texture 1 by PNGTree
Texture 2 by PNGTree

Images

All images used in this project are sourced from Unsplash under their license, which allows for free use in both personal and commercial projects.

We sincerely thank CGTrader, PNGTree, and Unsplash for providing these high-quality assets, which significantly contribute to the functionality and aesthetics of our furniture design web application.


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
   --.env file has already being pushed with the files if doesnt work please follow below steps--
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
