import type {
	INodeProperties,
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';
import { IResourceHandler } from '../types';
import { NodeApiError, NodeOperationError, BINARY_ENCODING } from 'n8n-workflow';
import type { Readable } from 'stream';

import { businessmapApiRequest, } from '../transport';
//import { checkApiResponse } from '../helpers/utils';

export const attachmentsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['attachments'],
			},
		},
		options: [
			{
				name: 'Upload',
				value: 'upload',
				description: 'Upload attachment to a card',
				action: 'Upload attachment to a card',
			},
			{
				name: 'Download',
				value: 'download',
				description: 'Download an attachment',
				action: 'Download an attachment',
			},
			{
				name: 'Get Attachments',
				value: 'get',
				description: 'Get card attachments',
				action: 'Get card attachments',
			},
		],
		default: 'upload',
	},
];

export const attachmentsFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                     attachments: upload, download, get                      */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Card ID',
		name: 'card_id',
		type: 'number',
			default: 0,
		required: true,
			placeholder: 'Enter Card ID',
		displayOptions: {
			show: {
			resource: ['attachments'],
			operation: ['upload', 'download', 'get'],
			},
		},
	},
	/* -------------------------------------------------------------------------- */
	/*                          attachments: upload                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'File Name',
		name: 'filename',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['attachments'],
				operation: ['upload'],
			},
		},
	},
	{
		displayName: 'Content',
		name: 'binaryFileData',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['attachments'],
				operation: ['upload'],
			},
		},
	},
	/* -------------------------------------------------------------------------- */
	/*                          attachments: download                             */
	/* -------------------------------------------------------------------------- */
  {
    displayName: 'File Name or ID',
    name: 'filename',
    type: 'options',
		typeOptions: {
			loadOptionsDependsOn: ['card_id'],
    	loadOptionsMethod: 'getAttachments',
    },
		options: [],
    default: '',
    required: true,
	placeholder: 'Select Attachment or enter Attachment ID from Get Attachments',
    description: 'Selected file to download. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['attachments'],
        operation: ['download'],
      },
    },
  },
];

export const attachmentHandlers: IResourceHandler = {
  get: async function(this, itemIndex) {
		const cardId = this.getNodeParameter('card_id', itemIndex) as number;

		if (cardId === 0) {
			throw new NodeOperationError(this.getNode(), 'Card ID must be a positive number', {level: 'warning',});
		}

		const response = await businessmapApiRequest.call(
			this,
			'GET',
			`/cards/${cardId}/attachments`,
		);

		return response.data;
  },

	download: async function (this: IExecuteFunctions, itemIndex: number,): Promise<INodeExecutionData[]> {
		const cardId = this.getNodeParameter('card_id', itemIndex) as number;

		// 1) Read the “filename” parameter as a number (file ID)
		const fileId = this.getNodeParameter('filename', itemIndex) as number;
		if (!fileId) {
			throw new NodeOperationError(this.getNode(), 'Filename/ID not provided', {level: 'warning',});
		}

		// 2) Call Businessmap API to get the actual file URL
		let fileInfoResponse;
		try {
			fileInfoResponse = await businessmapApiRequest.call(
				this,
				'GET',
				`/cards/${cardId}/attachments/${fileId}`,
			);
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to fetch file metadata for ID "${fileId}"`, {level: 'warning',});
		}

		// 3) Extract the URL from the response
		let fileUrl = fileInfoResponse.data.data?.link as string;
		if (!fileUrl) {
			throw new NodeApiError(this.getNode(), {
				message: `File URL not found in response for file ID ${fileId} for card ID ${cardId}`,
				description: JSON.stringify(fileInfoResponse.data),
			});
		}

		const credentials = await this.getCredentials('businessmapApi') as {
			apikey: string;
			subdomain: string;
		};

		fileUrl = `${credentials.subdomain.replace(/\/$/, '')}${fileUrl}`;

		// 4) Download binary file to buffer
		let binaryData: Buffer;
		try {
			binaryData = await this.helpers.httpRequest.call(this, {
				method:   'GET',
				url:      fileUrl,
				encoding: 'arraybuffer',
				headers: {
					apikey: credentials.apikey,
					'kanbanize-integration': 'n8n',
				},
			});
		} catch (error) {
			throw new NodeApiError(this.getNode(), {}, {
				message:     `Failed to download file from URL "${fileUrl}"`,
				description: (error as Error).message,
			});
		}

		// 5) Set filename
		const fileName = fileInfoResponse.data.data?.file_name as string;

		// 6) Prepare the binary data for n8n (wrap Buffer ↦ IBinaryData)
		const binaryPropertyName = 'content';
		const binaryPrepared = await this.helpers.prepareBinaryData(binaryData as Buffer, fileName,);

		// 7) Build and return an INodeExecutionData[] with that single binary property
		const newItem: INodeExecutionData = {
			json: {}, // no JSON payload, only binary
			binary: {
				[binaryPropertyName]: binaryPrepared,
			},
		};
		return [newItem];
	},

	upload: async function (this: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
			const UPLOAD_CHUNK_SIZE = 1024 * 1024;
			const cardId = this.getNodeParameter('card_id', itemIndex) as number;

			if (cardId === 0) {
					throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
			}

			const binaryPropertyName = this.getNodeParameter('binaryFileData', itemIndex) as string;
			if (!binaryPropertyName) {
					throw new NodeOperationError(this.getNode(), `Binary data not provided`, {level: 'warning',});
			}

			const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
			// Create FormData object using the native FormData API
			const form = new FormData();

			// Add CSRF token
			const length = 20;
			const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
			let csrfToken = '';
			for (let i = 0; i < length; i++) {
				const idx = Math.floor(Math.random() * chars.length);
				csrfToken += chars[idx];
			}
			form.append('ci_csrf_token', csrfToken);

			const filename = this.getNodeParameter('filename', itemIndex) as string || binaryPropertyName;
			// Add file with proper formatting
			if (binaryData.id) {
					// Stream approach
					const stream = await this.helpers.getBinaryStream(binaryData.id, UPLOAD_CHUNK_SIZE);
					const metadata = await this.helpers.getBinaryMetadata(binaryData.id);
					form.append('files[]', new Blob([await streamToBuffer(stream)], {	type: metadata.mimeType ?? binaryData.mimeType }), filename);
			} else {
					// Buffer approach
					form.append('files[]', new Blob([Buffer.from(binaryData.data, BINARY_ENCODING)], {type: binaryData.mimeType}), filename);
			}

			// Helper function to convert stream to buffer
			async function streamToBuffer(stream: Readable): Promise<Buffer> {
					return new Promise((resolve, reject) => {
							const chunks: Buffer[] = [];
							stream.on('data', (chunk) => chunks.push(chunk));
							stream.on('error', reject);
							stream.on('end', () => resolve(Buffer.concat(chunks)));
					});
			}

			const credentials = await this.getCredentials('businessmapApi') as {
					apikey: string;
					subdomain: string;
			};
			const fileUploadUrl = `${credentials.subdomain.replace(/\/$/, '')}/files`;

			const headers = {
					'Cookie': `ci_csrf_token=${csrfToken}`,
					'apikey': credentials.apikey,
					'kanbanize-integration': 'n8n',
			};

			let parsedResponse: {
				response: boolean;
				resparray: Array<{
					file_name: string;
					status: string;
					link: string;
				}>;
			};

			try {
					const rawResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: fileUploadUrl,
							headers,
							body: form,
							json: false
					});

					parsedResponse = rawResponse as any;

			} catch (error) {
					throw new NodeApiError(this.getNode(), {
							message: 'Failed to upload the file',
							description: (error as Error).message,
					});
			}

			if (
				!parsedResponse ||
				!Array.isArray(parsedResponse.resparray) ||
				parsedResponse.resparray.length === 0
			) {
				throw new NodeApiError(this.getNode(), {
					message: 'Unexpected upload response format or empty resparray',
					description: JSON.stringify(parsedResponse),
				});
			}

			const fileInfo = parsedResponse.resparray[0];
			const { file_name, status, link } = fileInfo;

			if (status !== 'success') {
				throw new NodeApiError(this.getNode(), {
					message: `Upload failed for file "${file_name}"`,
					description: JSON.stringify(fileInfo),
				});
			}

			let attachResponse;
			try {
				attachResponse = await businessmapApiRequest.call(
					this,
					'POST',
					`/cards/${cardId}/attachments`,
					{ file_name, link },
				);
			} catch (attachError) {
				throw new NodeApiError(this.getNode(), {
					message: `Failed to attach "${file_name}" to card ${cardId}`,
					description: (attachError as Error).message,
				});
			}

		return attachResponse.data;
	},
};
