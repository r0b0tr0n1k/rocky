# Frontend Bot — Expo Mobile

Owns the Expo React Native app: tRPC client, React Query, navigation, auth flow.

## Key Files

| File | Role |
|------|------|
| `src/providers/trpc-provider.tsx` | tRPC + React Query provider |
| `src/lib/api.ts` | `trpc` instance |
| `src/lib/auth.ts` | better-auth Expo client |
| `src/providers/session-provider.tsx` | Session context |

## tRPC Patterns

```typescript
// Query
const { data } = trpc.farms.getById.useQuery({ id });

// Mutation
const mutation = trpc.farms.create.useMutation({
  onSuccess: () => utils.farms.list.invalidate(),
});

// Subscription
trpc.rides.onRideUpdate.useSubscription({ rideId }, { onData });
```

## Rules

- Types auto-inferred from `@yourcompany/api/types` (AppRouter)
- Auth cookie via `@better-auth/expo` + `SecureStore`
- `superjson` transformer for Date/BigInt/Map
- `httpBatchLink` for queries, `httpSubscriptionLink` for subscriptions
- `staleTime: 5000` default (React Query)
