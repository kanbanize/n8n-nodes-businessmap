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
	IHttpRequestOptions,
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
	// Subdomain is still needed to build the URL; the apikey header is injected
	// by the credential's `authenticate` block via httpRequestWithAuthentication.
	const credentials = await this.getCredentials('businessmapApi') as {
		subdomain: string;
	};
	const baseUrl = `${credentials.subdomain.replace(/\/$/, '')}/api/v2`;

	let options: IHttpRequestOptions = {
		method,
		headers: {
			'kanbanize-integration': 'n8n',
		},
		qs,
		body,
		url: uri || `${baseUrl}${resource}`,
		json: false,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};

	options = Object.assign({}, options, option);
	if (options.body && typeof options.body === 'object' && Object.keys(options.body as IDataObject).length === 0) {
		delete options.body;
	}

	// json:false means body is sent as-is. Serialize plain objects to JSON
	// and set the Content-Type header so write requests reach the API correctly.
	if (
		options.body &&
		typeof options.body === 'object' &&
		!Buffer.isBuffer(options.body) &&
		!(typeof FormData !== 'undefined' && options.body instanceof FormData)
	) {
		options.body = JSON.stringify(options.body);
		options.headers = {
			...(options.headers ?? {}),
			'Content-Type': 'application/json',
		};
	}

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'businessmapApi',
			options,
		);

		// axios may return a Buffer when json:false; coerce to string so JSON.parse works.
		const raw =
			Buffer.isBuffer(response.body)
				? response.body.toString('utf8')
				: typeof response.body === 'string'
					? response.body
					: response.body == null
						? ''
						: JSON.stringify(response.body);

		// Empty bodies (e.g. 204 DELETE) must not become JSON `null`, or n8n output helpers break on null items.
		const trimmed = raw.trim();
		let data: any;
		if (!trimmed) {
			data = {};
		} else {
			try {
				data = JSON.parse(trimmed);
			} catch {
				data = null;
			}
		}
		if (data === null || data === undefined) {
			data = {};
		}

		if (response.statusCode !== 200 && response.statusCode !== 204) {
			throw new NodeApiError(
				this.getNode(),
				response as any,
				{
					message: `Request failed with status code ${response.statusCode}`,
					description: data?.error?.message || data?.message || raw || 'No further details available',
				},
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
			},
		);
	}
}
