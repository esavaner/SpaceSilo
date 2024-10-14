'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider, defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';
import { loggerLink, unstable_httpBatchStreamLink } from '@trpc/client';
import SuperJSON from 'superjson';
import { AppRouter } from '@repo/api';

type TRPCProviderProps = {
  children?: React.ReactNode;
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });

let clientQueryClientSingleton: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient());
};

export const api = createTRPCReact<AppRouter>();

export const TRPCProvider = ({ children }: TRPCProviderProps) => {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          // enabled: (op) => env.NODE_ENV === 'development' || (op.direction === 'down' && op.result instanceof Error),
          enabled: (op) => true,
        }),
        unstable_httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + '/api/trpc',
          headers() {
            const headers = new Headers();
            headers.set('x-trpc-source', 'nextjs-react');
            return headers;
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
};

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin;
  // if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`;
};
