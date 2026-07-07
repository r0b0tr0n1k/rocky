# UserRouter Example

Source: <https://www.nestjs-trpc.io/docs/routers>

An example of a UserRouter demonstrating a query to fetch a user by ID, including input validation, middleware, and error handling.

```APIDOC
## GET /users/getUserById

### Description
Fetches a user by their ID. This query is protected by middleware and validates the input userId.

### Method
GET

### Endpoint
/users/getUserById

### Parameters
#### Query Parameters
- **userId** (string) - Required - The ID of the user to retrieve.

### Request Example
```json
{
  "userId": "some-user-id"
}
```

### Response

#### Success Response (200)

- **name** (string) - The name of the user.
- **email** (string) - The email of the user.
- **password** (string) - The password of the user (should be handled securely).

#### Response Example

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "hashed_password"
}
```

#### Error Response (404)

- **message** (string) - "Could not find user."
- **code** (string) - "NOT_FOUND"

```

--------------------------------

### Install NestJS CLI

Source: https://www.nestjs-trpc.io/docs/nestjs

Install the NestJS command-line interface globally using npm.

```bash
npm i -g @nestjs/cli
```

--------------------------------

### Apply Middlewares to tRPC Subscriptions

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

This example shows how to apply middlewares, such as authentication, to tRPC subscription routes using the `@UseMiddlewares` decorator. Middlewares execute before the subscription generator starts, ensuring that only authenticated users can access the subscription.

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

### Run NestJS Application

Source: <https://www.nestjs-trpc.io/docs/nestjs>

Navigate to the project directory and start the NestJS application using npm.

```bash
cd project-name
npm run start
```

--------------------------------

### Client Usage Example

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

Provides an example of how to consume subscriptions on the client side using the `subscription` method from a tRPC client, specifically with `@trpc/react-query`.

```APIDOC
## Client Usage

On the client side, subscriptions are consumed using the `subscription` method from your tRPC client. The exact API depends on your client framework — refer to the tRPC client subscription docs for framework-specific examples.

### Example (React)

```typescript
// React example with @trpc/react-query
const { data } = trpc.events.onMessage.useSubscription(
  { channelId: 'general' },
  {
    onData(event) {
      console.log('Received:', event);
    },
  },
);
```

```

--------------------------------

### Basic Router Example

Source: https://www.nestjs-trpc.io/docs/routers

Demonstrates creating a simple router with a tRPC query to fetch data. It includes schema definition, router declaration, and procedure definition using decorators.

```APIDOC
## DogsRouter

### Description
A router to handle requests related to dogs, including fetching a list of dogs.

### Method
`@Query()`

### Endpoint
`/dogs` (implicitly handled by tRPC)

### Parameters
#### Input
- `input` (z.ZodObject) - Optional - Input schema for the query.

#### Output
- `output` (z.ZodArray) - Required - Schema defining the structure of the returned dog data.

### Request Example
(Not applicable for tRPC queries in this format)

### Response
#### Success Response (200)
- `dogs` (Array of dog objects) - A list of dog objects matching the output schema.

### Response Example
```json
[
  {
    "name": "Buddy",
    "breed": "Labrador"
  },
  {
    "name": "Lucy",
    "breed": "Corgi"
  }
]
```

```

--------------------------------

### Install NestJS tRPC with npm

Source: https://www.nestjs-trpc.io/docs

Use this command to install the nestjs-trpc package using npm.

```bash
npm install nestjs-trpc
```

--------------------------------

### Consume tRPC Subscription on the Client (React Example)

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

This React example demonstrates how to consume a tRPC subscription using the `@trpc/react-query` package. The `useSubscription` hook handles receiving real-time data and provides callbacks for data updates. Refer to tRPC client documentation for other frameworks.

```typescript
// React example with @trpc/react-query
const { data } = trpc.events.onMessage.useSubscription(
  { channelId: 'general' },
  {
    onData(event) {
      console.log('Received:', event);
    },
  },
);
```

--------------------------------

### Middlewares

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

Illustrates how to apply middlewares to subscriptions using the `@UseMiddlewares()` decorator, ensuring that middlewares execute before the subscription generator starts.

```APIDOC
## Middlewares

Subscriptions support the same `@UseMiddlewares()` decorator as queries and mutations. Middlewares execute before the generator starts:

### Example

```typescript
@UseMiddlewares(AuthMiddleware)
@Subscription({
  input: z.object({ channelId: z.string() }),
})
async *onMessage(@Input('channelId') channelId: string) {
  // Only authenticated users reach this point
}
```

```

--------------------------------

### Generated Context Interface Example

Source: https://www.nestjs-trpc.io/docs/context

When a context class is applied, a 'Context' type is generated. This example shows a minimal context implementation.

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

### Install trpc-ui Package

Source: <https://www.nestjs-trpc.io/docs/integrations>

Install the trpc-ui package using npm, yarn, or bun. This package is used for creating a tRPC UI panel.

```bash
npm install trpc-ui
```

--------------------------------

### User Router Example with Middleware and Input Validation

Source: <https://www.nestjs-trpc.io/docs/routers>

Defines a UserRouter with an alias 'users', uses Zod for input validation and output schema, and applies a ProtectedMiddleware to the getUserById query. It also demonstrates throwing a TRPCError for not found users.

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

### Implement a Logger Middleware

Source: <https://www.nestjs-trpc.io/docs/middlewares>

Create a middleware class that implements the `TRPCMiddleware` interface. This example logs request timing and status.

```typescript
import {
  TRPCMiddleware,
  TRPCMiddlewareOptions
} from 'nestjs-trpc';
import {
  Inject,
  Injectable,
  ConsoleLogger
} from '@nestjs/common';
import type {
  Context
} from "nestjs-trpc/types";

@Injectable()
export class LoggedMiddleware implements TRPCMiddleware<Context> {

  constructror(
    @Inject(ConsoleLogger) private readonly consoleLogger: ConsoleLogger
  ) {}

  async use(opts: TRPCMiddlewareOptions) {
    const start = Date.now();
    const {
      next,
      path,
      type
    } = opts;
    const result = await next();

    const durationMs = Date.now() - start;
    const meta = {
      path,
      type,
      durationMs
    }

    result.ok
      ? this.consoleLogger.log('OK request timing:', meta)
      : this.consoleLogger.error('Non-OK request timing', meta);

    return result;
  }
}
```

--------------------------------

### Implement Subscription Cleanup with AbortSignal

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

This example demonstrates how to handle client disconnections by using the `opts.signal`. The generator stops yielding events when the signal is aborted, allowing for resource cleanup. This requires tRPC v11 or later.

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

### Define TRPCModule Options with TypeScript

Source: <https://www.nestjs-trpc.io/docs>

Import TRPCModuleOptions to safely define options for the TRPCModule. This example sets a custom basePath.

```typescript
import { TRPCModule, TRPCModuleOptions } from 'nestjs-trpc';
const trpcOptions: TRPCModuleOptions = {
  basePath: '/trpc',
};
```

--------------------------------

### Configure Custom Logger for TRPCModule

Source: <https://www.nestjs-trpc.io/docs>

Provide a custom logger implementation that adheres to the NestJS LoggerService interface when configuring TRPCModule. This example uses a hypothetical MyLogger class.

```typescript
import {
  Module,
} from '@nestjs/common';
import { TRPCModule } from 'nestjs-trpc';
import { MyLogger } from './my-logger.service';

@Module({
  imports: [
    TRPCModule.forRoot({
      logger: new MyLogger(),
    }),
  ],
})
export class AppModule {}
```

--------------------------------

### Define a NestJS tRPC Router

Source: <https://www.nestjs-trpc.io/docs/client>

Example of a tRPC router definition in NestJS using decorators for queries, input validation with Zod, and middleware. Ensure to inject necessary services and handle potential errors like 'NOT_FOUND'.

```typescript
import { Inject } from '@nestjs/common';
import { Router, Query, UseMiddlewares, Input } from 'nestjs-trpc';
import { UserService } from './user.service';
import { ProtectedMiddleware } from './protected.middleware';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { User, userSchema } from './user.schema';

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

### Define a tRPC Subscription Router in NestJS

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

This snippet shows how to define a subscription router using the `@Router` and `@Subscription` decorators. It injects a service to listen for events on a specific channel. Ensure tRPC v11 or later is installed.

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

### Writing a Subscription

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

Demonstrates how to define a subscription using the `@Subscription()` decorator and an async generator method. The generator yields values that are streamed to the client as SSE events.

```APIDOC
## Writing a Subscription

Subscriptions work just like queries and mutations but use the `@Subscription()` decorator and an async generator method. The generator yields values that are streamed to the client as SSE events.

### Example

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

```

--------------------------------

### Create a New NestJS Project

Source: https://www.nestjs-trpc.io/docs/nestjs

Generate a new NestJS project with the specified name using the NestJS CLI.

```bash
nest new project-name
```

--------------------------------

### Cleanup with AbortSignal

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

Shows how to handle client disconnections by using the `opts.signal` to clean up resources when the subscription is no longer active.

```APIDOC
## Cleanup with AbortSignal

When a client disconnects, tRPC signals the generator to stop via `opts.signal`. Use this to clean up resources:

### Example

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

```

--------------------------------

### Basic NestJS tRPC Router with a Query

Source: https://www.nestjs-trpc.io/docs/routers

Defines a router for 'dogs' with a 'findAll' query. Requires DatabaseService and uses Zod for schema validation. Register this router in your module's providers.

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

  @Query({ output: z.array(dogsSchema) })
  async findAll(): string {
    const dogs = await this.databaseService.dogs.findMany();
    return dogs;
  }
}
```

--------------------------------

### Dependency Injection

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

Highlights that subscription routers fully support Dependency Injection, allowing services to be injected via the constructor for accessing business logic.

```APIDOC
## Dependency Injection

Subscription routers fully support Dependency Injection, just like query and mutation routers. Inject services through the `constructor` to access your business logic.
```

--------------------------------

### Initialize TRPCModule in AppModule

Source: <https://www.nestjs-trpc.io/docs>

Import and configure the TRPCModule using the forRoot() static method in your AppModule. The basePath option is optional and defaults to '/trpc'.

```typescript
import {
  Module,
} from '@nestjs/common';
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

### Middleware Decorator

Source: <https://www.nestjs-trpc.io/docs/routers>

Explains how to apply custom middlewares to router routes using the `@UseMiddlewares()` decorator.

```APIDOC
## `@UseMiddlewares()` Decorator

### Description
Applies one or more custom middlewares to a router or specific procedure.

### Usage
```typescript
@UseMiddlewares(middleware1, middleware2)
```

### Parameters

- `middleware` (TRPCMiddleware) - Required - The middleware function or an array of middleware functions to apply.

```

--------------------------------

### Parameter Decorators

Source: https://www.nestjs-trpc.io/docs/routers

Lists and describes the available decorators for accessing request parameters within router methods.

```APIDOC
## Parameter Decorators

### Description
Decorators used to access request parameters and context within router methods.

#### `@Options()`
- **Represents**: The full options object passed to the procedure.

#### `@Context()`
- **Represents**: The context object (`opts.ctx`).

#### `@Path()`
- **Represents**: The path parameters (`opts.path`).

#### `@Type()`
- **Represents**: The type information (`opts.type`).

#### `@RawInput()`
- **Represents**: The raw input object (`opts.rawInput`).

#### `@Input(key?: string)`
- **Represents**: The validated input object (`opts.input`) or a specific field within it (`opts.input[key]`).
```

--------------------------------

### Apply Middlewares to a Router Procedure

Source: <https://www.nestjs-trpc.io/docs/middlewares>

Use the `@UseMiddlewares()` decorator on a procedure to apply specific middlewares. Middlewares are executed in the order they are provided.

```typescript
import {
  DatabaseService
} from "./database.service.ts";
import {
  LoggedMiddleware
} from "./logged.middleware.ts";
import {
  AuthMiddleware
} from "./auth.middleware.ts";
import {
  Router,
  Query,
  UseMiddlewares
} from 'nestjs-trpc';
import {
  Inject
} from '@nestjs/common';
import {
  z
} from 'zod';

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

--------------------------------

### Register Global Middlewares

Source: <https://www.nestjs-trpc.io/docs/middlewares>

Configure global middlewares in the `TRPCModule.forRoot()` options to apply them to all procedures in the application. Ensure middlewares are also listed in the module's `providers`.

```typescript
import {
  Module
} from '@nestjs/common';
import {
  TRPCModule
} from 'nestjs-trpc';
import {
  LoggedMiddleware
} from './logged.middleware';
import {
  ErrorReportingMiddleware
} from './error-reporting.middleware';

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

### Procedure Decorators

Source: <https://www.nestjs-trpc.io/docs/routers>

Lists the available decorators for defining tRPC procedures (Query, Mutation, Subscription) and their corresponding tRPC procedure types.

```APIDOC
## Procedure Decorators

### Description
Decorators used to define tRPC procedures within a NestJS router.

#### `@Query({ input?, output?, meta? })`
- **Description**: Defines a tRPC query procedure.
- **Corresponds to**: `publicProcedure.query()`

#### `@Mutation({ input?, output?, meta? })`
- **Description**: Defines a tRPC mutation procedure.
- **Corresponds to**: `publicProcedure.mutation()`

#### `@Subscription({ input?, output?, meta? })`
- **Description**: Defines a tRPC subscription procedure.
- **Corresponds to**: `publicProcedure.subscription()`

### Parameters
- `input` (z.ZodSchema) - Optional - Schema for validating input data.
- `output` (z.ZodSchema) - Optional - Schema for validating output data.
- `meta` (object) - Optional - Metadata object for middlewares (e.g., authorization).
```

--------------------------------

### Generate AppRouter Types with CLI

Source: <https://www.nestjs-trpc.io/docs>

Run the nestjs-trpc generate command to scan your routers and create TypeScript types for your AppRouter. Use the 'watch' command for development mode.

```bash
npx nestjs-trpc generate
```

```bash
npx nestjs-trpc watch
```

--------------------------------

### Define tRPC Router with Query and Mutation

Source: <https://www.nestjs-trpc.io/docs/trpc>

Define a tRPC router containing a query to fetch a user by ID and a mutation to create a new user. Requires @trpc/server and Zod for input validation.

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

### Reading Procedure Metadata in RolesMiddleware

Source: <https://www.nestjs-trpc.io/docs/middlewares>

Implement `TRPCMiddleware` and use generics for `meta` to safely access procedure metadata within the middleware's `use` method, enabling role-based access control.

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

### Create trpc-ui Panel Controller

Source: <https://www.nestjs-trpc.io/docs/integrations>

Implement a NestJS controller to serve the tRPC UI panel. This controller uses `renderTrpcPanel` to generate the panel, ensuring the AppRouter is available via `onModuleInit`.

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

### Input Validation

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

Explains how to validate subscription input using Zod schemas, similar to how queries and mutations are validated.

```APIDOC
## Input Validation

Subscription input is validated the same way as queries and mutations — pass a Zod schema to the `input` option:

### Example

```typescript
@Subscription({
  input: z.object({
    channelId: z.string(),
    since: z.date().optional(),
  }),
})
async *onMessage(
  @Input('channelId') channelId: string,
  @Input('since') since: Date | undefined,
) {
  // ...
}
```

```

--------------------------------

### Using AuthMiddleware with Typed Context in User Router

Source: https://www.nestjs-trpc.io/docs/middlewares

Import and use generated context types like `AuthMiddlewareContext` to strongly type the `ctx` object within your tRPC procedures when a middleware is applied.

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

### Create Type-Safe tRPC Client

Source: <https://www.nestjs-trpc.io/docs/trpc>

Create a tRPC client that connects to a server endpoint and provides type-safe access to defined queries and mutations. Requires @trpc/client.

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

### Register Context in AppModule

Source: <https://www.nestjs-trpc.io/docs/context>

Register your custom context class within the TRPCModule's forRoot options in your main application module.

```typescript
import { Module } from '@nestjs/common';
import { TRPCModule } from 'nestjs-trpc';
import { AppContext } from 'app.context';

@Module({
  imports: [
    TRPCModule.forRoot({
      autoSchemaFile: "/src/@generated",
      context: AppContext,
    }),
  ],
})
export class AppModule {}
```

--------------------------------

### Define a Custom tRPC Context Class

Source: <https://www.nestjs-trpc.io/docs/context>

Create a class that implements TRPCContext and its create() method to define your custom context. This class can inject other NestJS providers.

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { ContextOptions, TRPCContext } from 'nestjs-trpc';
import { InnerContext } from './inner.context';

@Injectable()
export class AppContext implements TRPCContext {
  constructor(@Inject(InnerContext) private readonly innerContext: InnerContext){}

  async create(opts: ContextOptions): Promise<Record<string, unknown>> {
    const contextInner = await this.innerContext.create(opts);
    return {
      ...contextInner,
      req: opts.req,
      res: opts.res,
    };
  }
}
```

--------------------------------

### Defining Procedure Metadata with Roles

Source: <https://www.nestjs-trpc.io/docs/middlewares>

Pass a `meta` object to tRPC decorators like `@Query()` or `@Mutation()` to define metadata, such as required roles for authorization, which can be read by middlewares.

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

### Typed Return Context in MiddlewareOptions

Source: <https://www.nestjs-trpc.io/docs/middlewares>

Use the `TReturnContext` generic in `MiddlewareOptions` to type the context passed to `next()`, ensuring compile-time safety for downstream procedures.

```typescript
MiddlewareOptions<TContext, TReturnContext, TMeta>
```

--------------------------------

### Customize Type Generation Output Path

Source: <https://www.nestjs-trpc.io/docs>

Use the --output flag with the nestjs-trpc generate command to specify a custom path for the generated TypeScript types.

```bash
npx nestjs-trpc generate --output ./src/trpc/types.ts
```

--------------------------------

### Validate Subscription Input with Zod

Source: <https://www.nestjs-trpc.io/docs/subscriptions>

This snippet shows how to validate subscription input using Zod schemas. The `input` option within the `@Subscription` decorator ensures that incoming data conforms to the defined schema, including optional fields. This requires tRPC v11 or later.

```typescript
@Subscription({
  input: z.object({
    channelId: z.string(),
    since: z.date().optional(),
  }),
})
async *onMessage(
  @Input('channelId') channelId: string,
  @Input('since') since: Date | undefined,
) {
  // ...
}
```

--------------------------------

### Injecting a Service in a Constructor

Source: <https://www.nestjs-trpc.io/docs/dependency-injection>

Use the @Inject() decorator to inject an instance of CatsService into the constructor of another class. NestJS will automatically resolve and provide the dependency.

```typescript
constructor(@Inject(CatsService) private catsService: CatsService) {}
```

--------------------------------

### Register trpc-ui Controller in AppModule

Source: <https://www.nestjs-trpc.io/docs/integrations>

Register the `TrpcPanelController` within your NestJS application's `AppModule` to enable the tRPC panel routes. This is typically done in the `controllers` array.

```typescript
@Module({
  imports: [
    TRPCModule.forRoot({
      autoSchemaFile: './src/@generated',
      context: AppContext,
    }),
  ],
  controllers: [TrpcPanelController],
  providers: [],
})
export class AppModule {}
```

--------------------------------

### Access AppRouter in NestJS

Source: <https://www.nestjs-trpc.io/docs/integrations>

Retrieve the AppRouter instance from the application context. This is useful for end-to-end testing or integrating with other tRPC plugins. Ensure this is called after the application has been initialized.

```typescript
const { appRouter } = app.get(AppRouterHost);
```

--------------------------------

### Register and Configure Error Handler in TRPCModule

Source: <https://www.nestjs-trpc.io/docs/error-handling>

Register the custom error handler as a NestJS provider and pass it to the `onError` option in the `TRPCModule.forRoot` configuration.

```typescript
import { Module } from '@nestjs/common';
import { TRPCModule } from 'nestjs-trpc';
import { AppErrorHandler } from 'app.error-handler';

@Module({
  imports: [
    TRPCModule.forRoot({
      onError: AppErrorHandler,
    }),
  ],
  providers: [AppErrorHandler],
})
export class AppModule {}
```

--------------------------------

### Define Custom tRPC Error Handler

Source: <https://www.nestjs-trpc.io/docs/error-handling>

Implement the `TRPCErrorHandler` interface to create a custom error handler. This class can inject NestJS services for logging or reporting errors.

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { OnErrorOptions, TRPCErrorHandler } from 'nestjs-trpc';

@Injectable()
export class AppErrorHandler implements TRPCErrorHandler {
  constructor(@Inject('LogService') private readonly logService: LogService) {}

  onError(opts: OnErrorOptions): void {
    this.logService.error(`[${opts.type}] ${opts.path}: ${opts.error.message}`);
  }
}
```
