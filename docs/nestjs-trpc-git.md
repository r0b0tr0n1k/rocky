### Run Next.js Example (Client-Side)

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Starts the Next.js example application in development mode, focusing on client-side execution.

```bash
cd examples/nextjs-trpc && bun run dev
```

--------------------------------

### Run NestJS Fastify Example

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Starts the example application using NestJS with the Fastify driver in development mode.

```bash
cd examples/nestjs-fastify && bun run start:dev
```

--------------------------------

### Run NestJS Express Example

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Starts the example application using NestJS with the Express driver in development mode.

```bash
cd examples/nestjs-express && bun run start:dev
```

--------------------------------

### Install trpc-ui Package

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/integrations.mdx

Install the trpc-ui package using your preferred package manager.

```bash
npm install trpc-ui
```

```bash
pnpm add trpc-ui
```

```bash
yarn add trpc-ui
```

```bash
bun install trpc-ui
```

--------------------------------

### Install NestJS tRPC with bun

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/index.mdx

Use this command to install the nestjs-trpc package using bun.

```bash
bun install nestjs-trpc
```

--------------------------------

### Install NestJS CLI

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/nestjs.mdx

Install the NestJS command-line interface globally to manage NestJS projects.

```bash
npm i -g @nestjs/cli
```

--------------------------------

### Run NestJS Application

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/nestjs.mdx

Navigate to your project directory and start the NestJS application using npm.

```bash
cd project-name
npm run start
```

--------------------------------

### Client Creation in v10 (Before Migration)

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/v10-to-v11.md

This example shows the client creation using `createTRPCProxyClient` in tRPC v10.

```typescript
import { createTRPCProxyClient } from '@trpc/client';
const client = createTRPCProxyClient<AppRouter>({ ... });
```

--------------------------------

### UserRouter Example

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/routers.mdx

A complete example of a NestJS tRPC router demonstrating dependency injection, input validation with Zod, middleware usage, and error handling.

```APIDOC
## Example: UserRouter

This example showcases a `UserRouter` with a `getUserById` query, utilizing dependency injection, input validation, middleware, and error handling.

```typescript filename="user.router.ts" copy
import { Inject } from '@nestjs/common';
import { Router, Query, UseMiddlewares, Input } from 'nestjs-trpc';
import { UserService } from './user.service';
import { ProtectedMiddleware } from './protected.middleware';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const userSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
});

type User = z.infer<typeof userSchema>;

@Router({ alias: 'users' })
export class UserRouter {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Query({
    input: z.object({ userId: z.string() }),
    output: userSchema,
  })
  @UseMiddlewares(ProtectedMiddleware)
  async getUserById(@Input('userId') userId: string): Promise<User> {
    const user = await this.userService.getUser(userId);

    if (user == null) {
      throw new TRPCError({
        message: 'Could not find user.',
        code: 'NOT_FOUND',
      });
    }

    return user;
  }
}
```

### Dependency Injection
Routers support dependency injection through their constructors, allowing injection of providers available within the same module.
```

--------------------------------

### tRPC Subscription Example

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/subscriptions.mdx

Implement a subscription handler directly within the tRPC router configuration. This example demonstrates the equivalent subscription logic using tRPC's core API.

```typescript
import { publicProcedure, router } from './trpc';
import { z } from 'zod';
import { eventService } from './event.service';

const appRouter = router({
  events: {
    onMessage: publicProcedure
      .input(z.object({ channelId: z.string() }))
      .subscription(async function* (opts) {
        for await (const event of eventService.listen(
          opts.input.channelId,
          opts.signal,
        )) {
          yield event;
        }
      }),
  },
});
```

--------------------------------

### Define Simple AppContext

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/context.mdx

A minimal example of an AppContext class that returns a simple boolean indicating if the context is applied. This is useful for basic context setup.

```typescript
import { Injectable } from '@nestjs/common';
import { ContextOptions, TRPCContext } from 'nestjs-trpc';

@Injectable()
export class AppContext implements TRPCContext {
  create(opts: ContextOptions): Record<string, unknown> {
    return {
      isContextApplied: true,
    };
  }
}
```

--------------------------------

### Install NestJS tRPC with yarn

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/index.mdx

Use this command to install the nestjs-trpc package using yarn.

```bash
yarn add nestjs-trpc
```

--------------------------------

### Install NestJS tRPC with npm

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/index.mdx

Use this command to install the nestjs-trpc package using npm.

```bash
npm install nestjs-trpc
```

--------------------------------

### Build Command Example

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Command to build the NestJS tRPC library packages using TypeScript project references.

```bash
tsc -b -v packages
```

--------------------------------

### Install NestJS tRPC with pnpm

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/index.mdx

Use this command to install the nestjs-trpc package using pnpm.

```bash
pnpm add nestjs-trpc
```

--------------------------------

### NestJS Adapter Subscription Example

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/subscriptions.mdx

Implement a subscription handler using the `@Subscription()` decorator in a NestJS router. This example shows how to listen for events on a specific channel and yield them to the client.

```typescript
import { Router, Subscription, Input, Options } from 'nestjs-trpc';
import { Inject } from '@nestjs/common';
import { z } from 'zod';
import { EventService } from './event.service';

@Router({ alias: 'events' })
export class EventRouter {
  constructor(@Inject(EventService) private eventService: EventService) {}

  @Subscription({
    input: z.object({ channelId: z.string() }),
  })
  async *onMessage(
    @Input('channelId') channelId: string,
    @Options() opts: { signal?: AbortSignal },
  ) {
    for await (const event of this.eventService.listen(channelId, opts.signal)) {
      yield event;
    }
  }
}
```

--------------------------------

### Test CLI binary generation

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/RELEASE_CHECKLIST.md

Test the generated CLI binary by running the generation command in an example project. This ensures the CLI can be used to generate server code.

```bash
cd examples/nestjs-express
npx nestjs-trpc generate --input ./src --output ./src/@generated/server.ts
```

--------------------------------

### Git Pre-commit Hook for Generation

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Example of a Git pre-commit hook that runs the generation command and stages the output file.

```bash
# .husky/pre-commit
npx nestjs-trpc generate
git add src/@generated/server.ts
```

--------------------------------

### Good Comment Example: 'Why'

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Demonstrates a 'why' comment, explaining a non-obvious decision or constraint.

```typescript
// ✅ GOOD - "why" comment
// Using setTimeout instead of setImmediate because Node.js
// event loop phases cause race conditions with DB connections
setTimeout(checkConnection, 0);
```

--------------------------------

### Install NestJS tRPC and Dependencies

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/README.md

Install the nestjs-trpc package along with zod and @trpc/server using your preferred package manager.

```shell
# bun
bun add nestjs-trpc zod @trpc/server

# npm
npm install nestjs-trpc zod @trpc/server

# pnpm
pnpm add nestjs-trpc zod @trpc/server

# yarn
yarn add nestjs-trpc zod @trpc/server
```

--------------------------------

### Good Comment Example: Self-Documenting Code

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Shows examples of self-documenting code where comments are not needed due to clear naming and structure.

```typescript
// ✅ GOOD - no comment needed, self-documenting
function getUserById(id: string) { ... }
function validateAndTransformUser(rawData: unknown): User { ... }
```

--------------------------------

### Removed Node.js Generation API Example

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Illustrates the removed Node.js API for schema generation. Use the CLI instead.

```typescript
// This no longer exists
import { TRPCGenerator } from 'nestjs-trpc';
generator.generateSchemaFile();
```

--------------------------------

### Run Generation with Watch Mode

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Start the CLI in watch mode to automatically regenerate code on file changes.

```bash
npx nestjs-trpc watch
```

--------------------------------

### Install NestJS tRPC Dependencies

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/packages/nestjs-trpc/README.md

Install the necessary packages for NestJS tRPC using your preferred package manager.

```shell
# bun
bun add trpc-nestjs zod @trpc/server

# npm
npm install trpc-nestjs zod @trpc/server

# pnpm
pnpm add trpc-nestjs zod @trpc/server

# yarn
yarn add trpc-nestjs zod @trpc/server
```

--------------------------------

### tRPC Router Example

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/routers.mdx

Defines a tRPC router using native tRPC syntax, including a query with an output schema. This approach is compared to the NestJS adapter.

```typescript
import { db } from './db';
import { publicProcedure, router } from './trpc';
import { z } from 'zod';

const dogsSchema = z.object({
  name: z.string(),
  breed: z.enum(["Labrador", "Corgi", "Beagle", "Golden Retriver"])
});

const appRouter = router({
  dogsRouter : {
    findAll: publicProcedure
      .output(z.array(dogsSchema))
      .query(async () => {
        const dogs = await db.dogs.findMany();
        return dogs;
      }
    ),
  }
});
```

--------------------------------

### Define TRPCModule Options

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/index.mdx

Import TRPCModuleOptions to safely assert types for TRPCModule options. This example shows how to configure the basePath.

```typescript
import { TRPCModule, TRPCModuleOptions } from 'nestjs-trpc';
const trpcOptions: TRPCModuleOptions = {
  basePath: '/trpc',
};
```

--------------------------------

### Update nestjs-trpc to v2.0.0

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Install the latest version of nestjs-trpc to enable the Rust CLI.

```bash
bun add nestjs-trpc@^2.0.0
```

--------------------------------

### Check nestjs-trpc Version

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Verify that nestjs-trpc is installed at version v2.0.0 or higher.

```bash
npm list nestjs-trpc
```

--------------------------------

### Implement Subscriptions with Middlewares

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/subscriptions.mdx

Implement subscription endpoints using the `@Subscription` decorator. Middlewares can be applied using `@UseMiddlewares` to run logic before the subscription generator starts.

```typescript
@UseMiddlewares(AuthMiddleware)
@Subscription({
  input: z.object({ channelId: z.string() }),
})
async *onMessage(@Input('channelId') channelId: string) {
  // Only authenticated users reach this point
}
```

--------------------------------

### Define User Router with Query and Middleware

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/routers.mdx

Example of a UserRouter defining a `getUserById` query that uses a ProtectedMiddleware and input validation with Zod. It demonstrates dependency injection for UserService and error handling for 'NOT_FOUND' TRPC errors.

```typescript
import { Inject } from '@nestjs/common';
import { Router, Query, UseMiddlewares, Input } from 'nestjs-trpc';
import { UserService } from './user.service';
import { ProtectedMiddleware } from './protected.middleware';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const userSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
});

type User = z.infer<typeof userSchema>;

@Router({ alias: 'users' })
export class UserRouter {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Query({
    input: z.object({ userId: z.string() }),
    output: userSchema,
  })
  @UseMiddlewares(ProtectedMiddleware)
  async getUserById(@Input('userId') userId: string): Promise<User> {
    const user = await this.userService.getUser(userId);

    if (user == null) {
      throw new TRPCError({
        message: 'Could not find user.',
        code: 'NOT_FOUND',
      });
    }

    return user;
  }
}
```

--------------------------------

### Data Transformers in v10 (Before Migration)

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/v10-to-v11.md

Before migrating to tRPC v11, data transformers were configured directly in the client options. This example shows the v10 configuration.

```typescript
// In your client
const client = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [httpBatchLink({ url: '/api/trpc' })],
});
```

--------------------------------

### Bad Comment Example: 'How'

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Illustrates a 'how' comment that should be avoided. Code should be refactored for clarity instead of explaining step-by-step logic.

```typescript
// ❌ BAD - "how" comment
// This function:
// 1. Validates the input
// 2. Queries the database
// 3. Transforms the result
function processUser(data) { ... }
```

--------------------------------

### Implementing AuthMiddleware

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/middlewares.mdx

An example of an AuthMiddleware that checks for a valid session and enriches the context with user ID. It throws a TRPCError if no session is found.

```typescript
import {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from 'nestjs-trpc';
import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TRPCError } from '@trpc/server';
import type { Context } from 'nestjs-trpc/types';

interface AuthReturnContext {
  auth: { userId: string };
}

@Injectable()
export class AuthMiddleware implements TRPCMiddleware {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}
  async use(opts: MiddlewareOptions<Context, AuthReturnContext>): Promise<MiddlewareResponse> {
      const { ctx, next } = opts;
      const session = await this.authService.getSession({ req: ctx.req });

      if(session == null) {
        throw new TRPCError("No session found.", "UNAUTHORIZED");
      }

      // `ctx` is now typed as AuthReturnContext — only valid shapes are accepted
      return next({
        ctx: {
          auth: {
            userId: session.user.id
          }
        }
      })
  }
}
```

--------------------------------

### Removed autoSchemaFile Option Example

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Shows the deprecated `autoSchemaFile` option in `TRPCModule.forRoot()`. This functionality is now handled by the CLI.

```typescript
// Before (no longer works)
TRPCModule.forRoot({
  autoSchemaFile: './src/@generated/server.ts',
})

// After (use CLI)
// 1. Remove autoSchemaFile option
TRPCModule.forRoot({})

// 2. Add CLI to build/dev scripts
```

--------------------------------

### Watch Mode for nestjs-trpc Development

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Starts the nestjs-trpc package in watch mode for continuous development.

```bash
cd packages/nestjs-trpc && bun run start:dev
```

--------------------------------

### NestJS Adapter Router Example

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/routers.mdx

Defines a tRPC router using NestJS decorators, including a query with an output schema. Requires the `@Router()` decorator and NestJS dependency injection.

```typescript
import { DatabaseService } from "./database.service.ts";
import { Router, Query } from 'nestjs-trpc';
import { Inject } from '@nestjs/common';
import { z } from 'zod';

const dogsSchema = z.object({
  name: z.string(),
  breed: z.enum(["Labrador", "Corgi", "Beagle", "Golden Retriver"])
});

@Router()
export class DogsRouter {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService){}

  @Query({ output: z.array(dogSchema) })
  async findAll(): string {
    const dogs = await this.databaseService.dogs.findMany();
    return dogs;
  }
}
```

--------------------------------

### Bad Comment Example: 'What'

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Illustrates a 'what' comment that should be avoided. The function name should clearly indicate its purpose.

```typescript
// ❌ BAD - "what" comment
// This function gets the user by ID
function getUserById(id: string) { ... }
```

--------------------------------

### Creating Per-Request Context with TRPCContext

Source: https://context7.com/kevinedry/nestjs-trpc/llms.txt

Implement TRPCContext to provide a custom context object for each request. This example shows how to create a context that includes user information based on an authorization token.

```typescript
// app.context.ts
import { Injectable, Inject } from '@nestjs/common';
import { ContextOptions, TRPCContext } from 'nestjs-trpc';
import { AuthService } from './auth.service';

@Injectable()
export class AppContext implements TRPCContext {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async create(opts: ContextOptions): Promise<Record<string, unknown>> {
    const token = opts.req.headers.authorization?.split(' ')[1];
    const user = token ? await this.authService.verifyToken(token) : null;
    return {
      req: opts.req,
      res: opts.res,
      user,  // available as ctx.user in all procedures
    };
  }
}

// app.module.ts
@Module({
  imports: [TRPCModule.forRoot({ context: AppContext })],
  providers: [AppContext, AuthService],
})
export class AppModule {}

// The generated Context type (nestjs-trpc/types) reflects the return shape:
// export type Context = { req: Request; res: Response; user: User | null }
```

--------------------------------

### Implementing RolesMiddleware using Procedure Metadata

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/middlewares.mdx

An example of a RolesMiddleware that reads 'roles' metadata from a procedure. It checks if the authenticated user's ID is included in the required roles, throwing a FORBIDDEN error if not.

```typescript
import {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from 'nestjs-trpc';
import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import type { AuthMiddlewareContext } from 'nestjs-trpc/types';

interface RolesMeta {
  roles: string[];
}

@Injectable()
export class RolesMiddleware implements TRPCMiddleware<RolesMeta> {
  async use(opts: MiddlewareOptions<AuthMiddlewareContext, Record<string, unknown>, RolesMeta>): Promise<MiddlewareResponse> {
    const { meta, ctx, next } = opts;

    if (!meta.roles.includes(ctx.auth.userId)) {
      throw new TRPCError({
        message: 'Insufficient permissions.',
        code: 'FORBIDDEN',
      });
    }

    return next();
  }
}
```

--------------------------------

### Implementing TRPC Middleware for Authentication

Source: https://context7.com/kevinedry/nestjs-trpc/llms.txt

Use TRPCMiddleware to create injectable middleware for tRPC procedures. This example demonstrates an authentication middleware that injects user ID into the context.

```typescript
// auth.middleware.ts
import { Injectable, Inject } from '@nestjs/common';
import { TRPCMiddleware, MiddlewareOptions, MiddlewareResponse } from 'nestjs-trpc';
import { TRPCError } from '@trpc/server';
import { AuthService } from './auth.service';
import type { Context } from 'nestjs-trpc/types';

interface AuthReturnContext {
  auth: { userId: string };
}

@Injectable()
export class AuthMiddleware implements TRPCMiddleware {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async use(opts: MiddlewareOptions<Context, AuthReturnContext>): Promise<MiddlewareResponse> {
    const { ctx, next } = opts;
    const session = await this.authService.getSession({ req: ctx.req });

    if (session == null) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No session found.' });
    }

    // Inject auth data into context for downstream procedures
    return next({ ctx: { auth: { userId: session.user.id } } });
  }
}

// Usage: the generated type AuthMiddlewareContext is importable from 'nestjs-trpc/types'
// export interface AuthMiddlewareContext extends Context { auth: { userId: string } }
```

--------------------------------

### Creating a tRPC Procedure Middleware

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/middlewares.mdx

Implement a middleware directly within a tRPC procedure using the .use() method. This example logs request timing and indicates success or failure, similar to the NestJS adapter middleware but without NestJS specific decorators.

```typescript
export const loggedProcedure = publicProcedure.use(async (opts) => {
  const start = Date.now();

  const result = await opts.next();

  const durationMs = Date.now() - start;
  const meta = { path: opts.path, type: opts.type, durationMs };

  result.ok
    ? console.log('OK request timing:', meta)
    : console.error('Non-OK request timing', meta);

  return result;
});
```

--------------------------------

### Define User Routes with NestJS tRPC Decorators

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/README.md

Example of defining a UserRouter using NestJS tRPC decorators like @Router, @Query, and @UseMiddlewares. Includes input validation with Zod and error handling with TRPCError.

```typescript
// users.router.ts
import { Inject } from '@nestjs/common';
import { Router, Query, UseMiddlewares } from 'nestjs-trpc';
import { UserService } from './user.service';
import { ProtectedMiddleware } from './protected.middleware';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string(),
  password: z.string()
})

@Router()
class UserRouter {
  constructor(
    @Inject(UserService) private readonly userService: UserService
  ) {}

  @UseMiddlewares(ProtectedMiddleware)
  @Query({ output: z.array(userSchema) })
  async getUsers() {
    try {
      return this.userService.getUsers();
    } catch (error: unknown) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error has occured when trying to get users.",
        cause: error
      })
    }
  }
}
```

--------------------------------

### Generated AppRouter Output

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/client.mdx

This is an example of the `AppRouter` generated by NestJS tRPC, used for type inference. It includes placeholder logic for procedures and reflects the router structure defined in the backend.

```typescript
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();
const publicProcedure = t.procedure;

const appRouter = t.router({
    users: {
        getUserById: publicProcedure
        .input(z.object({ userId: z.string() }))
        .output(
            z.object({
                name: z.string(),
                email: z.string(),
                password: z.string(),
            }),
        )
        .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    },
});
export type AppRouter = typeof appRouter;
```

--------------------------------

### Using Parameter Decorators in tRPC Routers

Source: https://context7.com/kevinedry/nestjs-trpc/llms.txt

Utilize parameter decorators like @Ctx(), @Input(), @Options(), and @RawInput() to extract data from the procedure options object. This example shows how to access typed context and specific input fields.

```typescript
import { Router, Query, Mutation, Input, Ctx, Options, RawInput } from 'nestjs-trpc';
import { z } from 'zod';
import type { AuthMiddlewareContext } from 'nestjs-trpc/types';

@Router({ alias: 'profile' })
export class ProfileRouter {

  // @Input('key') extracts a specific field from validated input
  @Query({ input: z.object({ format: z.enum(['short', 'full']) }) })
  async getProfile(
    @Ctx() ctx: AuthMiddlewareContext,   // typed ctx from generated interface
    @Input('format') format: 'short' | 'full',
  ) {
    return format === 'full'
      ? db.users.findFull(ctx.auth.userId)
      : db.users.findShort(ctx.auth.userId);
  }

  // @Options() gives access to signal, path, type, etc.
  @Mutation({ input: z.object({ name: z.string() }) })
  async updateName(
    @Input() input: { name: string },
    @Options() opts: { signal?: AbortSignal },
  ) {
    if (opts.signal?.aborted) throw new Error('Request cancelled');
    return db.users.update({ name: input.name });
  }
}
```

--------------------------------

### Define a User Router with tRPC Decorators

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/packages/nestjs-trpc/README.md

Example of defining a user router in NestJS using tRPC decorators for queries and middleware. It includes input validation with Zod and error handling.

```typescript
// users.router.ts
import { Inject } from '@nestjs/common';
import { Router, Query, UseMiddlewares } from 'trpc-nestjs';
import { UserService } from './user.service';
import { ProtectedMiddleware } from './protected.middleware';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string(),
  password: z.string()
})

@Router()
class UserRouter {
  constructor(
    @Inject(UserService) private readonly userService: UserService
  ) {}

  @UseMiddlewares(ProtectedMiddleware)
  @Query({ output: z.array(userSchema) })
  async getUsers() {
    try {
      return this.userService.getUsers();
    } catch (error: unknown) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error has occured when trying to get users.",
        cause: error
      })
    }
  }
}
```

--------------------------------

### Prepare and Publish npm Packages

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Commands to prepare a release by building and copying the changelog, and then publishing to npm. Use `publish:next` for canary or next versions.

```bash
bun run prepublish:npm
```

```bash
bun run publish:npm
```

```bash
bun run publish:next
```

--------------------------------

### CLI Options: Specify Paths

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Generate code with custom input and output paths.

```bash
npx nestjs-trpc generate --input ./src --output ./src/@generated/server.ts
```

--------------------------------

### CLI Options: Basic Generation

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Run the basic code generation command.

```bash
npx nestjs-trpc generate
```

--------------------------------

### CLI Options: Watch Mode with Paths

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Run the CLI in watch mode, specifying input and output paths.

```bash
npx nestjs-trpc watch --input ./src --output ./src/@generated/server.ts
```

--------------------------------

### Build Rust CLI for Windows x64

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/RELEASE_CHECKLIST.md

Build the Rust CLI for Windows on x64 architecture using cross-compilation. Ensure you are in the project root.

```bash
cross build --release --target x86_64-pc-windows-msvc
```

--------------------------------

### Build All Packages with Bun

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Executes a full build of all packages in the workspace using TypeScript project references.

```bash
bun run build
```

--------------------------------

### Build Rust CLI for Linux x64

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/RELEASE_CHECKLIST.md

Build the Rust CLI for Linux on x64 architecture using cross-compilation. Ensure you are in the project root.

```bash
cross build --release --target x86_64-unknown-linux-gnu
```

--------------------------------

### Using AuthMiddleware in User Router

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/middlewares.mdx

Demonstrates how to apply an AuthMiddleware to a user router procedure. The procedure's context is typed with the generated AuthMiddlewareContext, allowing access to authenticated user information.

```typescript
import type { AuthMiddlewareContext } from 'nestjs-trpc/types';
import { UserService } from "./user.service.ts";
import { AuthMiddleware } from "./auth.middleware.ts";
import { Router, Query, UseMiddlewares } from 'nestjs-trpc';
import { Inject } from '@nestjs/common';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string(),
  email: z.string(),
  avatar: z.string()
});

@Router()
export class UserRouter {
  constructor(@Inject(UserService) private userService: UserService){}

  @UseMiddlewares(AuthMiddleware)
  @Query({ output: userSchema })
  async getUserProfile(@Context() ctx: AuthMiddlewareContext): string {
    const { userId } = ctx.auth;
    return await this.userService.getUserById(userId);
  }
}
```

--------------------------------

### Build Rust CLI for macOS Intel

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/RELEASE_CHECKLIST.md

Build the Rust CLI for macOS on Intel processors. Ensure you are in the project root.

```bash
cargo build --release --target x86_64-apple-darwin
```

--------------------------------

### CLI Options: Verbose Output

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Enable verbose logging for the generation process.

```bash
npx nestjs-trpc generate --verbose
```

--------------------------------

### Good Naming Conventions for Constants in Rust

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/packages/nestjs-trpc/cli/CLAUDE.md

Demonstrates effective naming conventions for constants in Rust, including units and grouping for better organization and clarity.

```rust
// ✅ GOOD: Clear naming with units and grouping
// Dialog dimensions
const DIALOG_WIDTH_THRESHOLD: u16 = 80;
const DIALOG_WIDTH_SMALL: u16 = 80;
const DIALOG_WIDTH_NORMAL: u16 = 60;

// Animation timing (milliseconds)
const SPINNER_FRAME_DURATION_MS: u128 = 100;
const SPINNER_FRAME_COUNT: u128 = 10;

// Layout percentages
const BUTTON_WIDTH_PERCENT: u16 = 25;
const REVIEW_POPUP_HEIGHT_PERCENT: u16 = 90;
```

--------------------------------

### Configure Root App Component

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/_app.mdx

Sets up the main layout for the Next.js application, applying global styles and fonts. Includes Vercel Analytics.

```javascript
import '../styles/globals.css'
import { Analytics } from "@vercel/analytics/react";
import { GeistSans } from 'geist/font/sans'

export default function App({ Component, pageProps }) {
  return (
    <main className={GeistSans.className}>
      <Analytics/>
      <Component {...pageProps} />
    </main>
  )
}
```

--------------------------------

### Define a tRPC Router with Query and Mutation

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/trpc.mdx

Illustrates how to define a tRPC router containing a query procedure for fetching a user and a mutation procedure for creating a user. Requires importing `initTRPC` and defining input schemas using `zod`.

```typescript
import { initTRPC } from '@trpc/server';

const t = initTRPC.create();

const appRouter = t.router({
  getUser: t.procedure
    .input(z.string())
    .query(({ input }) => {
      return { id: input, name: 'John Doe' };
    }),

  createUser: t.procedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input }) => {
      return { id: '1', ...input };
    }),
});

export type AppRouter = typeof appRouter;
```

--------------------------------

### Run Generation Script

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Execute the generation process using the updated script.

```bash
bun run generate
```

--------------------------------

### Initialize TRPCModule in AppModule

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/index.mdx

Import and configure the TRPCModule using the forRoot() static method in your AppModule. Options passed to forRoot() are forwarded to the underlying Express or Fastify driver.

```typescript
import { Module } from '@nestjs/common';
import { TRPCModule } from 'nestjs-trpc';

@Module({
  imports: [
    TRPCModule.forRoot({
      // Optional: specify custom base path (default: '/trpc')
      // basePath: '/api/trpc',
    }),
  ],
})
export class AppModule {}
```

--------------------------------

### Generate AppRouter Types

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/index.mdx

Run this CLI command to generate your AppRouter types. Use the --output flag to specify a custom output path. For development, use the watch command to automatically regenerate types.

```bash
npx nestjs-trpc generate
```

```bash
npx nestjs-trpc watch
```

```bash
npx nestjs-trpc generate --output ./src/trpc/types.ts
```

--------------------------------

### Format Code with Prettier

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Applies code formatting rules using Prettier across the project.

```bash
bun run format
```

--------------------------------

### Build Rust CLI for macOS ARM

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/RELEASE_CHECKLIST.md

Build the Rust CLI for macOS on ARM processors. Ensure you are in the project root.

```bash
cargo build --release --target aarch64-apple-darwin
```

--------------------------------

### Create a Type-Safe tRPC Client

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/trpc.mdx

Demonstrates how to create a tRPC client that is type-safe with respect to the server's `AppRouter`. It uses `createTRPCProxyClient` and `httpLink` to establish a connection to the server.

```typescript
import { createTRPCProxyClient, httpLink } from '@trpc/client';
import type { AppRouter } from './path/to/server';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: 'http://localhost:3000/trpc',
    }),
  ],
});

async function main() {
  const user = await trpc.getUser.query('1');
  console.log(user); // { id: '1', name: 'John Doe' }

  const newUser = await trpc.createUser.mutation({ name: 'Jane Doe' });
  console.log(newUser); // { id: '1', name: 'Jane Doe' }
}

main();
```

--------------------------------

### Create New NestJS Project

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/nestjs.mdx

Generate a new NestJS project using the NestJS CLI. Replace 'project-name' with your desired project name.

```bash
nest new project-name
```

--------------------------------

### Build Rust CLI for Linux ARM

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/RELEASE_CHECKLIST.md

Build the Rust CLI for Linux on ARM architecture using cross-compilation. Ensure you are in the project root.

```bash
cross build --release --target aarch64-unknown-linux-gnu
```

--------------------------------

### Run All Workspace Tests

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Executes all tests across the entire workspace.

```bash
bun test
```

--------------------------------

### Configure Global Middlewares

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/middlewares.mdx

Apply middlewares to all procedures in the application by listing them in the `globalMiddlewares` option within `TRPCModule.forRoot()`. This is useful for cross-cutting concerns like logging or error reporting.

```typescript
import { Module } from '@nestjs/common';
import { TRPCModule } from 'nestjs-trpc';
import { LoggedMiddleware } from './logged.middleware';
import { ErrorReportingMiddleware } from './error-reporting.middleware';

@Module({
  imports: [
    TRPCModule.forRoot({
      globalMiddlewares: [LoggedMiddleware, ErrorReportingMiddleware],
    }),
  ],
  providers: [LoggedMiddleware, ErrorReportingMiddleware],
})
export class AppModule {}
```

--------------------------------

### CLI Options: Debug Mode

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/migration/typescript-to-rust-cli.md

Enable debug mode for detailed logging, useful for bug reporting.

```bash
npx nestjs-trpc generate --debug
```

--------------------------------

### Initialize TRPCModule with Options

Source: https://context7.com/kevinedry/nestjs-trpc/llms.txt

Registers the NestJS tRPC adapter. Configure the base path, context, error handler, data transformer, logger, global middlewares, and error handler. Must be imported in the root AppModule.

```typescript
import {
  Module
} from '@nestjs/common';
import {
  TRPCModule
} from 'nestjs-trpc';
import {
  AppContext
} from './app.context';
import {
  AppErrorHandler
} from './app.error-handler';
import {
  LoggedMiddleware
} from './logged.middleware';

@Module({
  imports: [
    TRPCModule.forRoot({
      basePath: '/trpc', // default; all tRPC routes served under /trpc/*
      context: AppContext, // class implementing TRPCContext
      onError: AppErrorHandler, // class implementing TRPCErrorHandler
      globalMiddlewares: [LoggedMiddleware], // applied to every procedure
    }),
  ],
  providers: [AppContext, AppErrorHandler, LoggedMiddleware],
})
export class AppModule {}
```

--------------------------------

### Defining Procedure Metadata

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/middlewares.mdx

Shows how to attach a 'meta' object with role information to TRPC query and mutation decorators. This metadata can be read by middlewares for authorization.

```typescript
import { Router, Query, Mutation, UseMiddlewares, Input } from 'nestjs-trpc';
import { z } from 'zod';

@Router({ alias: 'admin' })
@UseMiddlewares(RolesMiddleware)
export class AdminRouter {
  @Query({
    input: z.object({ userId: z.string() }),
    meta: { roles: ['admin'] },
  })
  async getUser(@Input('userId') userId: string) {
    return this.userService.getUser(userId);
  }

  @Mutation({
    input: z.object({ userId: z.string() }),
    meta: { roles: ['admin', 'moderator'] },
  })
  async deleteUser(@Input('userId') userId: string) {
    return this.userService.deleteUser(userId);
  }
}
```

--------------------------------

### Functional Core vs. Imperative Shell in Rust

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/packages/nestjs-trpc/cli/CLAUDE.md

Demonstrates separating pure business logic (functional core) from side effects like database operations (imperative shell). Pure functions are deterministic and easier to test.

```rust
// FUNCTIONAL CORE: Pure business logic
fn calculate_discount(user: &User, amount: f64) -> f64 {
    // Pure function - no I/O, no mutation
    if user.is_premium && amount > 100.0 {
        amount * 0.2
    } else {
        0.0
    }
}

// IMPERATIVE SHELL: Side effects at edges
fn apply_discount_and_save(user_id: Uuid, amount: f64) -> Result<()> {
    let user = database.load(user_id)?;
    let discount = calculate_discount(&user, amount); // Pure
    database.save_transaction(discount)?;
    Ok(())
}
```

--------------------------------

### Build nestjs-trpc Package

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Builds only the nestjs-trpc package after navigating to its directory.

```bash
cd packages/nestjs-trpc && bun run build
```

--------------------------------

### Subscription Cleanup with AbortSignal

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/subscriptions.mdx

Handle client disconnections gracefully by using the `AbortSignal` provided in the subscription options. This allows for cleaning up resources when the subscription is no longer active.

```typescript
@Subscription({
  input: z.object({ channelId: z.string() }),
})
async *onMessage(
  @Input('channelId') channelId: string,
  @Options() opts: { signal?: AbortSignal },
) {
  let count = 0;
  while (!opts.signal?.aborted) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    yield { message: `Event ${count++}`, timestamp: Date.now() };
  }
}
```

--------------------------------

### Applying Multiple Middlewares to a Router

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/middlewares.mdx

Use the @UseMiddlewares decorator to apply multiple middlewares to a router class. Middlewares are executed in the order they are provided.

```typescript
import { UseMiddlewares } from 'nestjs-trpc';

@UseMiddlewares(LoggingMiddleware, AuthMiddleware)
export class AppRouter extends TrpcRouter {}
```

--------------------------------

### Create trpc-ui Panel Controller

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/integrations.mdx

Implement a controller to serve the trpc-ui panel. This controller uses the `renderTrpcPanel` method and accesses the AppRouter via `AppRouterHost` in the `onModuleInit` lifecycle hook to ensure the router is initialized.

```typescript
import { All, Controller, Inject, OnModuleInit } from '@nestjs/common';
import { renderTrpcPanel } from 'trpc-ui';
import { AnyRouter } from '@trpc/server';
import { AppRouterHost } from 'nestjs-trpc';

@Controller()
export class TrpcPanelController implements OnModuleInit {
  private appRouter!: AnyRouter;

  constructor(
    @Inject(AppRouterHost) private readonly appRouterHost: AppRouterHost,
  ) {}

  onModuleInit() {
    this.appRouter = this.appRouterHost.appRouter;
  }

  @All('/panel')
  panel(): string {
    return renderTrpcPanel(this.appRouter, {
      url: 'http://localhost:8080/trpc',
    });
  }
}
```

--------------------------------

### CLI - Type Generation (generate / watch)

Source: https://context7.com/kevinedry/nestjs-trpc/llms.txt

The Rust-based CLI scans decorated routers and emits a TypeScript file containing the full AppRouter type for end-to-end type safety in frontend clients. Supports one-time generation or watch mode.

```APIDOC
## CLI — Type generation (`generate` / `watch`)

### Description
The Rust-based CLI scans your decorated routers and emits a TypeScript file containing the full `AppRouter` type. This file is imported by frontend clients to achieve end-to-end type safety. Use `generate` for a one-time build or `watch` during development to regenerate on file changes.

### Usage
```bash
# One-time generation (output defaults to ./src/@generated/server.ts)
npx nestjs-trpc generate

# Custom output path
npx nestjs-trpc generate --output ./src/trpc/types.ts

# Watch mode — regenerates whenever a router file changes
npx nestjs-trpc watch

# Example of the generated file consumed by a frontend client
# src/@generated/server.ts (auto-generated, do not edit manually)
# export type AppRouter = typeof appRouter;
```
```

--------------------------------

### Rust: Use 'Why' Comments, Not 'What' or 'How'

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/packages/nestjs-trpc/cli/CLAUDE.md

Comments should explain the business logic or rationale behind a piece of code, not describe what the code does or how it achieves it. If a comment is needed to explain 'what' or 'how', refactor the code for clarity instead.

```rust
// ❌ BAD: "What" comment - code already says this
// Increment the counter
counter += 1;

// ❌ BAD: "How" comment - code already shows how
// Loop through items and find matching ID
for item in items {
    if item.id == target_id {
        return Some(item);
    }
}

// ✅ GOOD: "Why" comment - explains business logic
// Task must move to previous column before deletion to maintain audit trail
move_task_previous();
delete_task();
```

```rust
// ❌ BAD: Needs comment to explain
// Parse the timestamp and convert to local timezone
let dt = chrono::DateTime::parse_from_rfc3339(&s)
    .map(|d| d.with_timezone(&chrono::Local))?;

// ✅ GOOD: Function name makes it clear
let dt = parse_timestamp_as_local(&s)?;
```

--------------------------------

### Code Locality: Bad vs. Good Constant Placement in Rust

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/packages/nestjs-trpc/cli/CLAUDE.md

Illustrates the anti-pattern of centralizing unshared constants in a separate file versus the recommended practice of keeping constants close to the code that uses them.

```rust
// ❌ BAD: Centralized constants file for unshared values
// src/constants.rs
pub const DIALOG_WIDTH: u16 = 60;
pub const COLUMN_HEIGHT: u16 = 7;
pub const BUTTON_COUNT: usize = 4;

// src/dialogs.rs
use crate::constants::DIALOG_WIDTH;  // Has to jump to another file

// src/columns.rs
use crate::constants::COLUMN_HEIGHT; // Has to jump to another file

// ✅ GOOD: Constants live with the code that uses them
// src/dialogs.rs
const DIALOG_WIDTH: u16 = 60;
const BUTTON_COUNT: usize = 4;

fn render_dialog() {
    // Constants are right here!
}

// src/columns.rs
const COLUMN_HEIGHT: u16 = 7;

fn render_column() {
    // Constants are right here!
}
```

--------------------------------

### Generate AppRouter Type with CLI

Source: https://context7.com/kevinedry/nestjs-trpc/llms.txt

Scans decorated routers to emit a TypeScript file with the full AppRouter type for frontend clients. Use 'generate' for a one-time build or 'watch' for development.

```bash
npx nestjs-trpc generate

# Custom output path
npx nestjs-trpc generate --output ./src/trpc/types.ts

# Watch mode — regenerates whenever a router file changes
npx nestjs-trpc watch
```

--------------------------------

### Update and publish npm package

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/docs/RELEASE_CHECKLIST.md

Update the package version to major, verify contents, and publish to npm. Ensure you are in the `packages/nestjs-trpc` directory.

```bash
cd packages/nestjs-trpc
npm version major  # Bumps to 2.0.0
npm pack --dry-run
npm publish
```

--------------------------------

### Run nestjs-trpc Tests with Coverage

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Executes tests for the nestjs-trpc package and generates a coverage report.

```bash
cd packages/nestjs-trpc && bun test --coverage
```

--------------------------------

### TRPCModule.forRoot() - Module Initialization

Source: https://context7.com/kevinedry/nestjs-trpc/llms.txt

Registers the NestJS tRPC adapter within an application module. It accepts an options object for configuration and must be imported in the root AppModule or a feature module.

```APIDOC
## TRPCModule.forRoot()

### Description
Registers the NestJS tRPC adapter inside an application module. Accepts an options object to configure the base path, context class, error formatter, data transformer, logger, global middlewares, and error handler. Must be imported in the root `AppModule` or any feature module before routers can be discovered.

### Usage
```typescript
// app.module.ts
import {
  Module
} from '@nestjs/common';
import { TRPCModule } from 'nestjs-trpc';
import { AppContext } from './app.context';
import { AppErrorHandler } from './app.error-handler';
import { LoggedMiddleware } from './logged.middleware';

@Module({
  imports: [
    TRPCModule.forRoot({
      basePath: '/trpc', // default; all tRPC routes served under /trpc/*
      context: AppContext, // class implementing TRPCContext
      onError: AppErrorHandler, // class implementing TRPCErrorHandler
      globalMiddlewares: [LoggedMiddleware], // applied to every procedure
    }),
  ],
  providers: [AppContext, AppErrorHandler, LoggedMiddleware],
})
export class AppModule {}
```
```

--------------------------------

### tRPC Middleware Decorator

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/routers.mdx

Explains how to apply custom middlewares to tRPC routes using the `@UseMiddlewares` decorator.

```APIDOC
## Middlewares

Custom middlewares can be applied to tRPC routes using the `@UseMiddlewares` decorator. By default, routes use `publicProcedure`.

### `@UseMiddlewares(middleware: TRPCMiddleware)`
Applies a specified middleware to the procedure. The middleware can then be invoked using `middleware.query()`, `middleware.mutation()`, etc.
```

--------------------------------

### Lint and Auto-Fix Code

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Runs ESLint to check for code style issues and automatically fixes them.

```bash
bun run lint
```

--------------------------------

### Debug nestjs-trpc with Node Inspector

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Launches the nestjs-trpc package in debug mode, enabling Node.js inspector.

```bash
cd packages/nestjs-trpc && bun run debug:dev
```

--------------------------------

### Run Tests for nestjs-trpc Package

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/CLAUDE.md

Executes tests specifically for the nestjs-trpc package.

```bash
cd packages/nestjs-trpc && bun test
```

--------------------------------

### Apply Router-Specific Middlewares

Source: https://github.com/kevinedry/nestjs-trpc/blob/main/docs/pages/docs/middlewares.mdx

Use the `@UseMiddlewares()` decorator on a router class to apply middlewares to all procedures within that router. Ensure the middleware classes are imported and available.

```typescript
import { DatabaseService } from "./database.service.ts";
import { LoggedMiddleware } from "./logged.middleware.ts";
import { AuthMiddleware } from "./auth.middleware.ts";
import { Router, Query, UseMiddlewares } from 'nestjs-trpc';
import { Inject } from '@nestjs/common';
import { z } from 'zod';

const dogsSchema = z.object({
  name: z.string(),
  breed: z.enum(["Labrador", "Corgi", "Beagle", "Golden Retriver"])
});

@Router()
export class DogsRouter {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService){}

  @UseMiddlewares(LoggedMiddleware, AuthMiddleware)
  @Query({ output: z.array(dogSchema) })
  async findAll(): string {
    const dogs = await this.databaseService.dogs.findMany();
    return dogs;
  }
}
```