type IAnyFunction = (...args: unknown[]) => unknown

declare module "@sapper/server" {
  const middleware: IAnyFunction
  export { middleware }
}
