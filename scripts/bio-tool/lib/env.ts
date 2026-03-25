import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname =
  import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))

config({ path: resolve(__dirname, "../../../.env") })

export function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}
