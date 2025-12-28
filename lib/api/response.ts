import { NextResponse } from 'next/server'

export type ApiOk<T> = { success: true; data: T }
export type ApiFail = { success: false; data: { message: string; [k: string]: unknown } }
export type ApiResponse<T> = ApiOk<T> | ApiFail

export function ok<T>(data: T, status = 200) {
   return NextResponse.json({ success: true, data } satisfies ApiOk<T>, { status })
}

export function fail(message: string, status = 400, extra: Record<string, unknown> = {}) {
   return NextResponse.json(
      { success: false, data: { message, ...extra } } satisfies ApiFail,
      { status }
   )
}
