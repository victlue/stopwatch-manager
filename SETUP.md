# Deployment Setup for Vercel

## Setting up Vercel KV for Recipe Storage

To enable persistent recipe storage that works for all users, you need to set up Vercel KV (Redis) when deploying to Vercel.

### Steps:

1. **Deploy to Vercel**
   - Push your code to GitHub
   - Import the project to Vercel

2. **Enable Vercel KV**
   - In your Vercel project dashboard, go to the "Storage" tab
   - Click "Create Database"
   - Select "KV" (Redis)
   - Choose a name for your database (e.g., "stopwatch-recipes")
   - Select your preferred region
   - Click "Create"

3. **Connect KV to Your Project**
   - Once created, Vercel will automatically add the required environment variables to your project:
     - `KV_URL`
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`

4. **Redeploy**
   - After connecting KV, redeploy your application
   - Vercel will automatically use the environment variables

### Local Development

For local development with Vercel KV:

1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Pull environment variables: `vercel env pull .env.development.local`
4. Start the development server: `npm run dev`

### Important Notes

- Recipes are stored globally for all users
- Any user can add, edit, or delete recipes
- Changes are instant and permanent
- Consider adding authentication if you want to restrict recipe management

### Alternative Storage Options

If you prefer a different storage solution:

1. **Vercel Postgres**: For more complex data relationships
2. **Supabase**: For a full backend with authentication
3. **PlanetScale**: For a serverless MySQL database

To use an alternative, you'll need to modify the API routes in `/app/api/recipes/route.ts` to use the appropriate database client.