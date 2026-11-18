import type { ApiError } from './client';

// Todo erro que chega do TanStack Query vem de api/client.ts, então já nasce como ApiError (com .status e .code).
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
