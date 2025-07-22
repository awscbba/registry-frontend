# People Register Frontend

A modern, responsive web application built with AstroJS, React, and Tailwind CSS for managing people registration.

## Features

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, professional interface with Tailwind CSS
- **Real-time Updates**: Dynamic form validation and error handling
- **Accessibility**: Built with accessibility best practices
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **AstroJS**: Static site generator with partial hydration
- **React**: Component library for interactive elements
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:4321](http://localhost:4321) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands

## Environment Variables

- `PUBLIC_API_URL` - The base URL of your People Register API

## Project Structure

```
src/
├── components/          # React components
│   ├── PeopleManager.tsx   # Main application component
│   ├── PersonForm.tsx      # Form for creating/editing people
│   └── PersonList.tsx      # List view of registered people
├── layouts/             # Astro layouts
│   └── Layout.astro        # Base page layout
├── pages/              # Astro pages (routes)
│   └── index.astro         # Home page
├── services/           # API services
│   └── api.ts             # API client for backend communication
├── types/              # TypeScript type definitions
│   └── person.ts          # Person-related types
└── env.d.ts           # Environment type definitions
```

## Deployment

This application is designed to be deployed as a static site to:

- **Amazon S3 + CloudFront**: Static hosting with CDN
- **AWS Amplify**: Full-stack deployment platform
- **Vercel/Netlify**: Alternative static hosting platforms

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## API Integration

The frontend communicates with the People Register API through the `src/services/api.ts` module. Make sure to:

1. Set the correct `PUBLIC_API_URL` in your environment
2. Ensure CORS is properly configured on your API
3. Handle API errors gracefully in the UI

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for new features
3. Test your changes thoroughly
4. Update documentation as needed
