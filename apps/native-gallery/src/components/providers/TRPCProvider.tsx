import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';

import type { AppRouter } from '@repo/api';

export const api = createTRPCReact<AppRouter>();

export function TRPCProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) => true,
          // process.env.NODE_ENV === 'development' || (opts.direction === 'down' && opts.result instanceof Error),
          colorMode: 'ansi',
        }),
        httpBatchLink({
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            const headers = new Map<string, string>();
            headers.set('x-trpc-source', 'expo-react');
            // const token = getToken();
            // if (token) headers.set("Authorization", `Bearer ${token}`);
            return Object.fromEntries(headers);
          },
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
    </api.Provider>
  );
}

export const getBaseUrl = () => {
  /**
   * Gets the IP address of your host-machine. If it cannot automatically find it,
   * you'll have to manually set it. NOTE: Port 3000 should work for most but confirm
   * you don't have anything else running on it, or you'd have to change it.
   *
   * **NOTE**: This is only for development. In production, you'll want to set the
   * baseUrl to your production API URL.
   */
  // const debuggerHost = Constants.expoConfig?.hostUri;
  // const localhost = debuggerHost?.split(":")[0];

  // if (!localhost) {
  //   // return "https://turbo.t3.gg";
  //   throw new Error(
  //     "Failed to get localhost. Please point to your production server.",
  //   );
  // }
  // return `http://${localhost}:3000`;
  return `http://localhost:3000`;
};
