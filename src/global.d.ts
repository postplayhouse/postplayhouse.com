/// <reference types="@sveltejs/kit" />
type IAnyFunction = (...args: unknown[]) => unknown

type IHash<T> = Record<string, T>

namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "production" | "test"
    CONTEXT?: "production" | "deploy-preview" | "branch-deploy"
    DEPLOY_PRIME_URL?: string
  }
}
