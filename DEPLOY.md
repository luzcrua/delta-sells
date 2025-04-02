
# Deploy to Netlify

This project is configured for easy deployment to Netlify.

## Deployment Steps

1. Push your code to GitHub.
2. Log in to [Netlify](https://www.netlify.com/).
3. Click on "New site from Git".
4. Select GitHub as your Git provider.
5. Authorize Netlify to access your GitHub repositories.
6. Select the repository you want to deploy.
7. The build settings should be automatically configured:
   - Build command: `npm run build`
   - Publish directory: `dist`
8. Click "Deploy site".

## Environment Variables

If your project uses environment variables, you'll need to set them in Netlify:
1. Go to Site settings > Build & deploy > Environment
2. Add the environment variables needed for your project

## Custom Domain

To set up a custom domain:
1. Go to Domain settings
2. Click on "Add custom domain"
3. Follow the instructions to configure your DNS settings

## Troubleshooting

If you encounter issues with client-side routing:
- The project already includes a redirect rule in netlify.toml
- This ensures all routes are directed to index.html, allowing React Router to handle the routing

For more information, visit [Netlify's documentation](https://docs.netlify.com/).
