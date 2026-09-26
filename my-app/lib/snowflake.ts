import snowflake, { type Binds, type Connection } from "snowflake-sdk";

// Keep the driver quiet: its logs can include SQL text, and on Vercel the
// filesystem is read-only so it cannot write its default log file anyway.
snowflake.configure({ logLevel: "OFF" });

const QUERY_TIMEOUT_MS = Number(process.env.SNOWFLAKE_TIMEOUT_MS ?? 4000);

// Auth, in order of preference:
//   SNOWFLAKE_TOKEN        programmatic access token
//   SNOWFLAKE_PRIVATE_KEY  key-pair (PEM; "\n" escapes allowed for Vercel)
//   SNOWFLAKE_PASSWORD     password (may be blocked if the user has MFA)
function authOptions() {
  const { SNOWFLAKE_TOKEN, SNOWFLAKE_PRIVATE_KEY, SNOWFLAKE_PASSWORD } =
    process.env;
  if (SNOWFLAKE_TOKEN) {
    return { authenticator: "PROGRAMMATIC_ACCESS_TOKEN", token: SNOWFLAKE_TOKEN };
  }
  if (SNOWFLAKE_PRIVATE_KEY) {
    return {
      authenticator: "SNOWFLAKE_JWT",
      privateKey: SNOWFLAKE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }
  if (SNOWFLAKE_PASSWORD) return { password: SNOWFLAKE_PASSWORD };
  return null;
}

export function isSnowflakeConfigured(): boolean {
  return Boolean(
    process.env.SNOWFLAKE_ACCOUNT && process.env.SNOWFLAKE_USER && authOptions(),
  );
}

// Accepts the account as "ORG-ACCOUNT" or pasted as a full URL/hostname; the
// driver appends ".snowflakecomputing.com" itself, so strip it here.
function accountIdentifier(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.snowflakecomputing\.com$/i, "");
}

// One connection per server instance, reused across requests while it is warm.
let connection: Promise<Connection> | null = null;

function getConnection(): Promise<Connection> {
  if (!connection) {
    const conn = snowflake.createConnection({
      account: accountIdentifier(process.env.SNOWFLAKE_ACCOUNT!),
      username: process.env.SNOWFLAKE_USER!,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE ?? "NEWCOMER_NAVIGATOR",
      schema: process.env.SNOWFLAKE_SCHEMA ?? "PUBLIC",
      role: process.env.SNOWFLAKE_ROLE,
      ...authOptions(),
    });
    // connect() with a callback, not connectAsync(): connectAsync() can resolve
    // even when login fails, which hides the real error behind
    // "terminated connection" on the first query.
    connection = new Promise<Connection>((resolve, reject) => {
      conn.connect((err) => (err ? reject(err) : resolve(conn)));
    });
    connection.catch(() => {
      connection = null;
    });
  }
  return connection;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Snowflake timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// Runs one statement and returns its rows. Throws on any error or timeout so
// the caller can fall back to resources.json.
export async function query<T>(sqlText: string, binds: Binds = []): Promise<T[]> {
  if (!isSnowflakeConfigured()) throw new Error("Snowflake is not configured");

  const run = async () => {
    const conn = await getConnection();
    return new Promise<T[]>((resolve, reject) => {
      conn.execute({
        sqlText,
        binds,
        complete: (err, _stmt, rows) =>
          err ? reject(err) : resolve((rows ?? []) as T[]),
      });
    });
  };

  try {
    return await withTimeout(run(), QUERY_TIMEOUT_MS);
  } catch (err) {
    // Drop the connection so the next request starts fresh.
    connection = null;
    throw err;
  }
}
