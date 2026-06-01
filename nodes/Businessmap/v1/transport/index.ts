/**
 * @module transport
 * HTTP transport layer for the Businessmap n8n node.
 * Wraps the Businessmap REST API v2, handling authentication, request building,
 * response normalisation, and error mapping to n8n's NodeApiError.
 */

import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Executes an authenticated HTTP request against the Businessmap REST API v2.
 *
 * @param this    - n8n execution context (hook, execute, or load-options).
 * @param method  - HTTP method (GET, POST, PATCH, DELETE, …).
 * @param resource - API path appended to the base URL (e.g. `/cards`).
 * @param body    - Request body; omitted from the request when empty.
 * @param qs      - Query-string parameters.
 * @param uri     - Override the full request URI; falls back to `<baseUrl><resource>`.
 * @param option  - Additional `IRequestOptions` fields merged into the request.
 * @returns Resolved response object with the following shape:
 *   - `statusCode` — HTTP status code returned by the API.
 *   - `headers`    — Response headers.
 *   - `data`       — Parsed JSON body, or `null` when the body is not JSON.
 *   - `rawBody`    — Raw response body string.
 * @throws {NodeApiError} On non-200/204 status codes or network-level failures.
 */
export async function businessmapApiRequest(
  this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  resource: string,
  body: any = {},
  qs: IDataObject = {},
  uri?: string,
  option: IDataObject = {},
): Promise<any> {
  // Get the Businessmap API credentials
  const credentials = await this.getCredentials('businessmapApi') as {
    apikey: string;
    subdomain: string;
  };
  const baseUrl = `${credentials.subdomain.replace(/\/$/, '')}/api/v2`;

  let options: IRequestOptions = {
    method,
    headers: {
      apikey: credentials.apikey,
			'kanbanize-integration': 'n8n'
    },
    qs,
    body,
    uri: uri || `${baseUrl}${resource}`,
    json: false,
    resolveWithFullResponse: true as any,
  };

  options = Object.assign({}, options, option);
  if (options.body && Object.keys(options.body as IDataObject).length === 0) {
    delete options.body;
  }

  try {
    // this.helpers.request now returns the full HTTP response object
    const response = await this.helpers.request(options);

    // pull out raw text (HTML or whatever)
    const raw = response.body as string;

    // if it *is* JSON, parse it (or else leave it)
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    if (response.statusCode !== 200 && response.statusCode !== 204) {
      throw new NodeApiError(
				this.getNode(),
				response,
				{
					message: `Request failed with status code ${response.statusCode}`,
					description: data?.message || 'No further details available',
	      }
			);
    }

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      // parsed JSON (if any)
      data,
      // always include the raw response
      rawBody: raw,
    };
	} catch (error) {

		const err = error as any;

		let message = `An error occurred while making the request: ${err?.message}`;
		// Strip forward slashes (/) and backslashes (\) from the message
		message = message.replace(/[\/\\]/g, '');

		// Check if we have an `error` in the response and try to parse it as JSON
		if (err?.error) {
			let parsedError;

			try {
				parsedError = JSON.parse(err.error);
			} catch (parseError) {
				parsedError = null;
			}

			// If parsed body is valid JSON and contains an error.message, use that as the message
			if (parsedError && parsedError.error?.message) {
				message = parsedError.error.message;
			}
		}

		throw new NodeApiError(
			this.getNode(),
			err,
			{
				message: message,
				description: err?.response?.body || 'No further details available',
			}
		);
	}
}
