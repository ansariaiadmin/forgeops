import type { Role } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession['user']
  }

  // Optional so it stays compatible with the AdapterUser type
  // used by @auth/prisma-adapter.
  interface User {
    role?: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: Role
  }
}
