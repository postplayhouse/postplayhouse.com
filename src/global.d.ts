/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="@sveltejs/kit" />

type IAnyFunction = (...args: unknown[]) => unknown

type IHash<T> = Record<string, T>

type ConstructTuple<
  L extends number,
  T = unknown,
  Res extends T[] = [],
> = Res["length"] extends L ? Res : ConstructTuple<L, T, [...Res, T]>

declare const poop: ConstructTuple<2, { hello: string }>

poop

namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "production" | "test"
    CONTEXT?: "production" | "deploy-preview" | "branch-deploy"
    DEPLOY_PRIME_URL?: string
  }
}
