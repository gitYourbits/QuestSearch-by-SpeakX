# QuestSearch

**QuestSearch** is a powerful search functionality designed to provide fast, accurate, and scalable search capabilities for a large collection of questions. It leverages MongoDB Atlas Full-Text Search for efficient querying and gRPC as the service that serves the search functionality. Express.js acts as a proxy between the gRPC service and the frontend due to the need for managing cross-origin requests, API routing, and ensuring a smooth communication flow between the frontend and backend. The frontend is built using Vite + React for a seamless user experience.

## Features

- **Full-Text Search**: Utilize MongoDB Atlas Full-Text Search to search through question titles with high performance and flexibility.
- **Pagination**: Results are paginated to ensure smooth user experience and faster query responses.
- **Type-based Filtering**: Ability to filter questions based on type (e.g., Multiple Choice, Anagram, Read Along, etc).
- **Responsive Design**: The frontend is built to be fully responsive, ensuring accessibility on both mobile and desktop devices.
- **Dynamic API**: Utilizes a high-performance gRPC-based API for handling search requests, with Express.js serving as a proxy to facilitate seamless communication between the gRPC service and the frontend, ensuring optimized data routing and handling cross-origin requests.
- **Scalability**: Designed to handle large datasets and optimize search performance with MongoDB's search index.

## Technologies Used

### Backend:
- **Node.js**: Server-side runtime environment for building scalable applications.
- **Express.js**: Web framework for building APIs and handling HTTP requests.
- **MongoDB Atlas**: Cloud-based NoSQL database with built-in full-text search capabilities.
- **gRPC**: High-performance RPC framework used for efficient and low-latency communication between microservices.
- **dotenv**: For managing environment variables like MongoDB URI, ports, etc.
- **CORS**: Middleware to handle cross-origin requests, ensuring frontend-backend interaction across different domains.

### Frontend:
- **React**: JavaScript library for building user interfaces, focusing on component-based architecture.
- **Vite**: Next-generation build tool optimized for fast development and production builds.
- **Tailwind CSS (with custom styling)**: Used to create a fully responsive UI.
- **Shadcn/ui (for UI components)**: An open-source project that provides beautifully designed, reusable components for building user interfaces. These components are built with Tailwind CSS

### Search Algorithm:
- **MongoDB Atlas Full-Text Search**: QuestSearch uses MongoDB's full-text search capabilities to index question titles. Full-Text Search provides powerful features such as:
  - **Text Indexing**: Efficient search of textual data in MongoDB collections.
  - **Text Match Query**: Uses tokens and stemming to provide relevant search results.
  - **Pagination**: Search results are limited and paginated to improve performance.
  - **Filtering**: Filters questions based on types, ensuring better targeting of search results.

Why MongoDB Atlas Full-Text Search?
- **Scalability**: MongoDB Atlas is designed to scale horizontally, making it an ideal choice for handling large amounts of data while maintaining fast search performance.
- **Ease of Use**: MongoDB provides simple integration with the full-text search index, making it easy to query and get relevant results.
- **Real-time Performance**: As the database and search engine are integrated, there is minimal overhead in managing separate indexing services like Elasticsearch.

## Project Setup Guide

### Prerequisites:
1. **Node.js** (v14.x or higher)
2. **MongoDB Atlas account** (for database setup)
3. **Vercel/Render account** (for frontend/backend deployment)
4. **Basic understanding of JavaScript, Node.js, Express, React, and MongoDB**

### Backend Setup
1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/questsearch.git
    cd questsearch/questsearch-backend
    ```

2. Install the backend dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file at the root of the backend directory and add the following environment variables:
    ```env
    MONGO_URI=your-mongodb-atlas-connection-string
    GRPC_PORT=50051  # Optional: set a custom port for gRPC if needed
    PORT=3000        # Optional: set a custom port for Express server
    ```

4. Run the backend locally:
    ```bash
    node server.js
    ```

### Frontend Setup
1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/questsearch.git
    cd questsearch/questsearch-frontend/quest-search
    ```

2. Install the frontend dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root of the frontend directory:
    ```env
    VITE_API_BASE_URL=https://your-backend-url.onrender.com
    ```

4. Run the frontend locally:
    ```bash
    npm run dev
    ```

### Additional Configuration (for Deployment):
For Backend (**Render**):
- Set the necessary environment variables (e.g., `MONGO_URI`, `PORT`).
- Set the build and start commands in Render settings.

For Frontend (**Vercel**):
- Set the environment variable `VITE_API_BASE_URL` to the Render backend URL.
- Add the build command `npm run build or vite build` and the output directory as `dist`.

## API Endpoints

### `/api/search` (POST)
- **Request Body**:
    ```json
    {
      "query": "search term",
      "page": 1,
      "pageSize": 10,
      "type": "multiple-choice"  // Optional filter
    }
    ```
- **Response**:
    ```json
    {
      "questions": [
        {
          "id": "question_id",
          "title": "Question title",
          "type": "multiple-choice",
        }
      ]
    }
    ```

### gRPC API: `QuestSearch.searchQuestions`
- **Request**:
    ```json
    {
      "query": "search term",
      "page": 1,
      "pageSize": 10,
      "type": "multiple-choice"
    }
    ```
- **Response**:
    ```json
    {
      "questions": [
        {
          "id": "question_id",
          "title": "Question title",
          "type": "multiple-choice",
          // Other question metadata
        }
      ]
    }
    ```

## Contributing

To contribute:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request for review

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
