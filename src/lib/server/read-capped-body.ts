/**
 * Reads a request body up to a byte limit, without ever buffering more than
 * the limit: a declared Content-Length above it is refused before reading, and
 * a body streamed without one (chunked) is cut off as soon as it passes it.
 *
 * Returns null when the body is larger than the limit.
 */
export async function readCappedBody(
  request: Request,
  limit: number,
): Promise<Uint8Array<ArrayBuffer> | null> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > limit)) {
    return null;
  }

  if (!request.body) return new Uint8Array(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
