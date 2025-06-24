import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

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
