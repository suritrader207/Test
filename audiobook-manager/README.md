# Audiobook Manager

This is a simple web application for managing your audiobooks, allowing you to upload, organize, and play your audio files.

## Deployment on Vercel

This project is configured for easy deployment with [Vercel](https://vercel.com/).

1.  **Sign up or Log in to Vercel:** If you don't have an account, sign up at [vercel.com](https://vercel.com/).
2.  **Import Your Project:**
    *   Go to your Vercel Dashboard.
    *   Click on "New Project".
    *   Select your Git repository (e.g., GitHub, GitLab, Bitbucket) where this project is hosted.
    *   Vercel will automatically detect that it's a Next.js project and configure the build settings.
3.  **Deploy:** Click "Deploy". Vercel will build and deploy your application.
4.  **Custom Domains (Optional):** After deployment, you can configure custom domains from your project settings in the Vercel Dashboard.

## Local Development

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd audiobook-manager
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

-   `src/app/`: Contains the Next.js application pages and API routes.
-   `public/`: Stores static assets like `books.json`, default cover images, and uploaded audio files.
-   `components/`: (If applicable) Reusable React components.

## Technologies Used

-   Next.js
-   React
-   Tailwind CSS
-   @dnd-kit (for drag and drop functionality)
-   Node.js (for API routes)