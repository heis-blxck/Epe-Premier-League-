import serverless from 'serverless-http';
import { createApp } from '../../server/app';

const app = createApp();
const serverlessHandler = serverless(app);

/**
 * Netlify rewrites /api/* to /.netlify/functions/api/:splat, so the Express
 * app would otherwise see the internal function prefix instead of /api/*.
 * Normalise the path before handing the event to serverless-http.
 */
const FUNCTION_PREFIX = '/.netlify/functions/api';

function toApiPath(originalPath: string): string {
  if (originalPath.startsWith(FUNCTION_PREFIX)) {
    return `/api${originalPath.slice(FUNCTION_PREFIX.length)}`;
  }
  if (originalPath.startsWith('/api')) {
    return originalPath;
  }
  return `/api${originalPath.startsWith('/') ? originalPath : `/${originalPath}`}`;
}

export const handler = async (event: any, context: any) => {
  event.path = toApiPath(String(event.path || '/'));

  if (typeof event.rawUrl === 'string') {
    try {
      const url = new URL(event.rawUrl);
      url.pathname = toApiPath(url.pathname);
      event.rawUrl = url.toString();
    } catch {
      // Ignore malformed rawUrl values; event.path is the main source.
    }
  }

  return serverlessHandler(event, context);
};
