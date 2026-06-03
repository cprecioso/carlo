import { buffer as consumeBuffer } from "node:stream/consumers";
import type { HTTPRequest, ResponseForRequest } from "puppeteer";

export const toFetchRequest = async (request: HTTPRequest): Promise<Request> =>
  new Request(request.url(), {
    method: request.method(),
    headers: request.headers(),
    body: request.hasPostData() ? await request.fetchPostData() : undefined,
  });

export const fromFetchResponse = async (
  response: Response,
): Promise<Partial<ResponseForRequest>> => ({
  status: response.status,
  contentType: response.headers.get("content-type") || undefined,
  headers: Object.fromEntries(response.headers.entries()),
  body: response.body ? await consumeBuffer(response.body) : undefined,
});

export const wrapFetch =
  (fetch: (request: Request) => Response | Promise<Response>) =>
  async (request: HTTPRequest) =>
    await fromFetchResponse(await fetch(await toFetchRequest(request)));
