// Via https://github.com/benaubin/b2-js/blob/master/src/api-operations/authorize-account.ts
export interface AuthorizeAccountSuccessResponse {
  /** The identifier for the account. */
  accountId: string
  /**
   * An authorization token to use with all calls,
   * other than b2_authorize_account, that need an Authorization header.
   *
   * This authorization token is valid for at most 24 hours.
   */
  authorizationToken: string
  /**
   * The smallest possible size of a part of a large file (except the last one).
   * This is smaller than the recommendedPartSize.
   * If you use it, you may find that it takes longer overall to upload a large file.
   */
  absoluteMinimumPartSize: number
  allowed: KeyAllowedField
  /** The base URL to use for all API calls except for uploading and downloading files. */
  apiUrl: "https://apiNNN.backblazeb2.com"
  /** The base URL to use for downloading files. */
  downloadUrl: "https://f002.backblazeb2.com"
  /**
   * The recommended size for each part of a large file.
   * We recommend using this part size for optimal upload performance.
   */
  recommendedPartSize: number
}

export type B2KeyCapability =
  | "listBuckets"
  | "listFiles"
  | "readFiles"
  | "shareFiles"
  | "writeFiles"
  | "deleteFiles"

export interface KeyAllowedField {
  capabilities: B2KeyCapability[]

  /** When present, access is restricted to one bucket. */
  bucketId?: string
  /**
   * When bucketId is set, and it is a valid bucket that has not been deleted,
   * this field is set to the name of the bucket. It's possible that bucketId
   * is set to a bucket that no longer exists, in which case this field will
   * be null. It's also null when bucketId is null. */
  bucketName?: string
  /** When present, access is restricted to files whose names start with the prefix */
  namePrefix?: string
}
