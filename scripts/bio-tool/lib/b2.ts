import { requireEnv } from "./env"

interface B2AuthResponse {
  accountId: string
  authorizationToken: string
  apiUrl: string
  downloadUrl: string
}

interface B2File {
  fileName: string
  fileId: string
  contentLength: number
  uploadTimestamp: number
}

interface B2ListFilesResponse {
  files: B2File[]
  nextFileName: string | null
}

let cachedAuth: B2AuthResponse | null = null

async function authorize(): Promise<B2AuthResponse> {
  if (cachedAuth) return cachedAuth

  const keyId = requireEnv("B2_APPLICATION_KEY_ID")
  const key = requireEnv("B2_APPLICATION_KEY")
  const auth = "Basic " + Buffer.from(`${keyId}:${key}`).toString("base64")

  const resp = await fetch(
    "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
    {
      method: "GET",
      headers: { Authorization: auth },
    },
  )

  if (!resp.ok) throw new Error(`B2 auth failed: ${resp.status}`)
  cachedAuth = (await resp.json()) as B2AuthResponse
  return cachedAuth
}

/** List all files in the bucket */
export async function listFiles(): Promise<B2File[]> {
  const auth = await authorize()
  const bucketId = requireEnv("B2_BUCKET_ID")
  const allFiles: B2File[] = []
  let nextFileName: string | null = null

  do {
    const body: Record<string, unknown> = {
      bucketId,
      maxFileCount: 1000,
    }
    if (nextFileName) body.startFileName = nextFileName

    const resp = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names`, {
      method: "POST",
      headers: { Authorization: auth.authorizationToken },
      body: JSON.stringify(body),
    })

    if (!resp.ok) throw new Error(`B2 list files failed: ${resp.status}`)
    const data = (await resp.json()) as B2ListFilesResponse
    allFiles.push(...data.files)
    nextFileName = data.nextFileName
  } while (nextFileName)

  return allFiles
}

/** Download a file by ID */
export async function downloadFileById(fileId: string): Promise<Buffer> {
  const auth = await authorize()

  const resp = await fetch(
    `${auth.downloadUrl}/b2api/v2/b2_download_file_by_id?fileId=${fileId}`,
    {
      headers: { Authorization: auth.authorizationToken },
    },
  )

  if (!resp.ok)
    throw new Error(`B2 download by ID failed for ${fileId}: ${resp.status}`)
  return Buffer.from(await resp.arrayBuffer())
}

/** Parse a B2 bio submission filename: `{timestamp}-{first}-{last}.txt` */
export function parseSubmissionFilename(fileName: string): {
  timestamp: number
  firstName: string
  lastName: string
} | null {
  const match = fileName.match(/^(\d+)-(.+)\.txt$/)
  if (!match) return null

  const timestamp = parseInt(match[1])
  const nameParts = match[2].split("-")

  if (nameParts.length < 2) return null

  return {
    timestamp,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join("-"),
  }
}

/** Find a matching image file for a bio submission basename */
export function findMatchingImage(
  allFiles: B2File[],
  basename: string,
): B2File | null {
  const imageExts = [".jpg", ".jpeg", ".png", ".webp"]
  return (
    allFiles.find((f) =>
      imageExts.some((ext) => f.fileName === `${basename}${ext}`),
    ) ?? null
  )
}
