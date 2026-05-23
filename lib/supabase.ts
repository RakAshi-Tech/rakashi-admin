/**
 * AWS API Gateway wrapper providing a Supabase-compatible interface for the admin panel.
 * DB queries → POST {API_URL}/query → Lambda → Aurora RDS
 */

const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL!
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? ''

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function callApi<T = unknown>(path: string, body: unknown): Promise<T> {
  if (!API_URL) throw new Error('NEXT_PUBLIC_API_GATEWAY_URL is not configured')
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY && { 'x-api-key': API_KEY }),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterOp = 'eq' | 'gte' | 'lte' | 'not_is_null' | 'is_null'

interface Filter {
  column: string
  op: FilterOp
  value?: unknown
}

interface QueryPayload {
  table: string
  operation: 'select' | 'insert' | 'upsert' | 'update' | 'delete'
  columns?: string
  filters?: Filter[]
  data?: Record<string, unknown>
  onConflict?: string
  single?: boolean
  orderBy?: { column: string; ascending: boolean }
  countExact?: boolean
  headOnly?: boolean
  limit?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ApiResult<T = any> {
  data: T | null
  error: { message: string; code?: string } | null
  count?: number
}

// ── Select query builder ──────────────────────────────────────────────────────

class SelectBuilder<T = any> {
  protected payload: QueryPayload

  constructor(table: string) {
    this.payload = { table, operation: 'select' }
  }

  select(columns = '*', opts?: { count?: 'exact'; head?: boolean }): this {
    this.payload.columns = columns
    if (opts?.count === 'exact') this.payload.countExact = true
    if (opts?.head) this.payload.headOnly = true
    return this
  }

  eq(column: string, value: unknown): this {
    this.payload.filters = [...(this.payload.filters ?? []), { column, op: 'eq', value }]
    return this
  }

  gte(column: string, value: unknown): this {
    this.payload.filters = [...(this.payload.filters ?? []), { column, op: 'gte', value }]
    return this
  }

  lte(column: string, value: unknown): this {
    this.payload.filters = [...(this.payload.filters ?? []), { column, op: 'lte', value }]
    return this
  }

  not(column: string, _op: string, _value: unknown): this {
    this.payload.filters = [...(this.payload.filters ?? []), { column, op: 'not_is_null' }]
    return this
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this.payload.orderBy = { column, ascending: opts?.ascending ?? true }
    return this
  }

  limit(n: number): this {
    this.payload.limit = n
    return this
  }

  single(): Promise<ApiResult<T>> {
    this.payload.single = true
    return callApi<ApiResult<T>>('/query', this.payload)
  }

  then<R>(
    resolve: (value: ApiResult<T>) => R,
    reject?: (reason: unknown) => R
  ): Promise<R> {
    return callApi<ApiResult<T>>('/query', this.payload).then(resolve, reject)
  }
}

// ── Mutation builder (insert / upsert / update) ───────────────────────────────

class MutationBuilder<T = any> {
  protected payload: QueryPayload

  constructor(
    table: string,
    operation: 'insert' | 'upsert' | 'update',
    data: Record<string, unknown>,
    onConflict?: string
  ) {
    this.payload = { table, operation, data, ...(onConflict && { onConflict }) }
  }

  eq(column: string, value: unknown): this {
    this.payload.filters = [...(this.payload.filters ?? []), { column, op: 'eq', value }]
    return this
  }

  select(columns = '*'): this {
    this.payload.columns = columns
    return this
  }

  single(): Promise<ApiResult<T>> {
    this.payload.single = true
    return callApi<ApiResult<T>>('/query', this.payload)
  }

  then<R>(
    resolve: (value: ApiResult<T>) => R,
    reject?: (reason: unknown) => R
  ): Promise<R> {
    return callApi<ApiResult<T>>('/query', this.payload).then(resolve, reject)
  }
}

// ── Delete builder ────────────────────────────────────────────────────────────

class DeleteBuilder<T = any> {
  private payload: QueryPayload

  constructor(table: string) {
    this.payload = { table, operation: 'delete' }
  }

  eq(column: string, value: unknown): this {
    this.payload.filters = [...(this.payload.filters ?? []), { column, op: 'eq', value }]
    return this
  }

  then<R>(
    resolve: (value: ApiResult<T>) => R,
    reject?: (reason: unknown) => R
  ): Promise<R> {
    return callApi<ApiResult<T>>('/query', this.payload).then(resolve, reject)
  }
}

// ── Main client ───────────────────────────────────────────────────────────────

class SupabaseAWSClient {
  from(table: string) {
    return {
      select: (columns = '*', opts?: { count?: 'exact'; head?: boolean }) =>
        new SelectBuilder(table).select(columns, opts),
      insert: (data: Record<string, unknown>) =>
        new MutationBuilder(table, 'insert', data),
      upsert: (data: Record<string, unknown>, opts?: { onConflict?: string }) =>
        new MutationBuilder(table, 'upsert', data, opts?.onConflict),
      update: (data: Record<string, unknown>) =>
        new MutationBuilder(table, 'update', data),
      delete: () =>
        new DeleteBuilder(table),
    }
  }
}

export const supabase = new SupabaseAWSClient()
