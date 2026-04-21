import type { IDataObject, INodeProperties, IExecuteFunctions, IBinaryData } from 'n8n-workflow';
import { NodeOperationError, NodeApiError, BINARY_ENCODING } from 'n8n-workflow';
import type { Readable } from 'stream';
import { IResourceHandler } from '../types';
import { businessmapApiRequest } from '../transport';

export const documentsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['documents'],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a document',
				action: 'Create document',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get documents or a single document',
				action: 'Get document',
			},
			{
				name: 'Get Board Documents',
				value: 'getBoardDocs',
				description: 'Get documents located on a board',
				action: 'Get board documents',
			},
			{
				name: 'Edit',
				value: 'edit',
				description: 'Edit a document',
				action: 'Edit document',
			},
			{
				name: 'Add Attachment',
				value: 'addAttachment',
				description: 'Upload a file and attach it to a document',
				action: 'Add attachment to document',
			},
			{
				name: 'Update Attachment',
				value: 'updateAttachment',
				description: 'Update an attachment on a document',
				action: 'Update document attachment',
			},
			{
				name: 'Delete Attachment',
				value: 'deleteAttachment',
				description: 'Remove an attachment from a document',
				action: 'Delete document attachment',
			},
		],
		default: 'get',
	},
];

export const documentsFields: INodeProperties[] = [
	{
		displayName: 'Document ID',
		name: 'doc_id',
		type: 'number',
		default: 0,
		placeholder: 'e.g. 123',
		description: 'If provided, fetches this single document. Leave 0 to list documents.',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'List Filters (JSON)',
		name: 'filters',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		placeholder: '{ "board_id": 123 }',
		description: 'Optional query parameters as JSON when listing documents',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['get'],
				doc_id: [0],
			},
		},
	},
	{
		displayName: 'Board Name or ID',
		name: 'board_id',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'Board whose documents to list',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchBoards',
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'Board ID',
				name: 'id',
				type: 'string',
				hint: 'Enter the board ID',
				placeholder: '123456',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9]+$',
							errorMessage: 'Board ID must be numeric',
						},
					},
				],
				url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$value}` }}',
			},
		],
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['getBoardDocs'],
			},
		},
	},
	{
		displayName: 'Document Data (JSON)',
		name: 'document_data',
		type: 'string',
		typeOptions: {
			rows: 6,
		},
		default: '{\n  "title": "",\n  "content": ""\n}',
		required: true,
		description: 'Request body for creating a document',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Document ID',
		name: 'doc_id',
		type: 'number',
		default: 0,
		required: true,
		placeholder: 'e.g. 123',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['edit', 'addAttachment', 'updateAttachment', 'deleteAttachment'],
			},
		},
	},
	{
		displayName: 'Attachment ID',
		name: 'attachment_id',
		type: 'number',
		default: 0,
		required: true,
		placeholder: 'e.g. 456',
		description:
			'Document attachment ID (from the attachments list on the document in API responses)',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['updateAttachment', 'deleteAttachment'],
			},
		},
	},
	{
		displayName: 'Attachment Data (JSON)',
		name: 'attachment_data',
		type: 'string',
		typeOptions: {
			rows: 6,
		},
		default: '{}',
		required: false,
		description:
			'Optional extra fields for PATCH. If you upload a file below, file_name and link from POST /api/v2/files are merged into this object. Otherwise set file_name and link (or other fields) here. See updateDocAttachment in the API docs.',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['updateAttachment'],
			},
		},
	},
	{
		displayName: 'File Name',
		name: 'filename',
		type: 'string',
		default: '',
		required: false,
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['addAttachment', 'updateAttachment'],
			},
		},
	},
	{
		displayName: 'Binary Property',
		name: 'binaryFileData',
		type: 'string',
		default: '',
		required: false,
		description:
			'Binary field name on this item (e.g. Attachment_to_add), or an expression that returns that name or the full binary object (e.g. {{ $(\'On form submission\').item.binary.Attachment_to_add }} when this item no longer carries the file).',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['addAttachment', 'updateAttachment'],
			},
		},
	},
	{
		displayName: 'Document Data (JSON)',
		name: 'document_data',
		type: 'string',
		typeOptions: {
			rows: 6,
		},
		default: '{\n  "title": ""\n}',
		required: true,
		description: 'Request body for updating a document',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['edit'],
			},
		},
	},
];

function parseJsonString(this: any, value: unknown, parameterName: string): IDataObject {
	if (value === null || value === undefined || value === '') {
		return {};
	}

	if (typeof value === 'object' && !Array.isArray(value)) {
		return value as IDataObject;
	}

	if (typeof value !== 'string') {
		throw new NodeOperationError(this.getNode(), `${parameterName} must be a JSON object`, {
			level: 'warning',
		});
	}

	if (!value.trim()) {
		return {};
	}

	try {
		const parsed = JSON.parse(value);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new NodeOperationError(this.getNode(), `${parameterName} must be a JSON object`, {
				level: 'warning',
			});
		}
		return parsed as IDataObject;
	} catch (error) {
		if (error instanceof NodeOperationError) {
			throw error;
		}
		throw new NodeOperationError(this.getNode(), `${parameterName} contains invalid JSON`, {
			level: 'warning',
		});
	}
}

function parsePositiveInteger(value: unknown): number | undefined {
	const parsed = Number(value);
	if (Number.isNaN(parsed) || parsed <= 0) {
		return undefined;
	}
	return parsed;
}

/** Node parameters / expressions may be non-strings; coerce before calling string methods. */
function trimmedString(value: unknown): string {
	if (value === null || value === undefined) {
		return '';
	}
	return String(value).trim();
}

/** Expression may return the binary object (e.g. $('Node').item.binary.Attachment) instead of the property name string. */
function isN8nBinaryData(value: unknown): value is IBinaryData {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const b = value as IBinaryData;
	const hasId = typeof b.id === 'string' && b.id.length > 0;
	const hasData = typeof b.data === 'string';
	if (!hasId && !hasData) {
		return false;
	}
	return typeof b.mimeType === 'string' && b.mimeType.length > 0;
}

function binaryPropertyInputProvided(value: unknown): boolean {
	if (isN8nBinaryData(value)) {
		return true;
	}
	return trimmedString(value) !== '';
}

/** Resolves board id from resourceLocator output or expressions that return a number, string, or single-element array (e.g. "[798]" from mistaken `[{{ ... }}]`). */
function coercePositiveBoardId(raw: unknown): number | undefined {
	if (raw === null || raw === undefined || raw === '') {
		return undefined;
	}

	if (Array.isArray(raw)) {
		if (raw.length === 0) {
			return undefined;
		}
		return coercePositiveBoardId(raw[0]);
	}

	if (typeof raw === 'object' && raw !== null && 'value' in raw) {
		return coercePositiveBoardId((raw as { value: unknown }).value);
	}

	if (typeof raw === 'number') {
		return parsePositiveInteger(raw);
	}

	if (typeof raw === 'string') {
		let s = raw.trim();
		if (s.startsWith('[') && s.endsWith(']')) {
			s = s.slice(1, -1).trim();
		}
		const parsed = Number(s);
		if (Number.isNaN(parsed) || parsed <= 0) {
			return undefined;
		}
		return parsed;
	}

	return undefined;
}

function extractDocIdFromResponse(responseData: any): number | undefined {
	return (
		parsePositiveInteger(responseData?.data?.doc_id) ??
		parsePositiveInteger(responseData?.data?.id) ??
		parsePositiveInteger(responseData?.doc_id) ??
		parsePositiveInteger(responseData?.id)
	);
}

const UPLOAD_CHUNK_SIZE = 1024 * 1024;

async function streamToBuffer(stream: Readable): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		stream.on('data', (chunk) => chunks.push(chunk));
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks)));
	});
}

type FilesV2UploadResponse = {
	data?: {
		file_name: string;
		link: string;
	};
};

/**
 * POST `/api/v2/files` with multipart field `file` (same for add and update attachment flows).
 * `binaryPropertyInput` may be a field name string or a resolved n8n binary object (e.g. from another node).
 */
export async function uploadBinaryToFilesApiV2(
	this: IExecuteFunctions,
	itemIndex: number,
	binaryPropertyInput: unknown,
	filename: string,
): Promise<{ file_name: string; link: string }> {
	let binaryData: IBinaryData;
	let uploadFilename: string;

	if (isN8nBinaryData(binaryPropertyInput)) {
		binaryData = binaryPropertyInput;
		uploadFilename =
			trimmedString(filename) || trimmedString(binaryData.fileName) || 'file';
	} else {
		const binaryKey = trimmedString(binaryPropertyInput);
		if (!binaryKey || binaryKey === '[object Object]') {
			throw new NodeOperationError(
				this.getNode(),
				'Binary Property must be the name of a binary field on this item (e.g. Attachment_to_add), not the binary object. Use the plain name, {{ $binary.Attachment_to_add }}, or an expression that returns the binary object itself (e.g. {{ $("On form submission").item.binary.Attachment_to_add }}).',
				{ level: 'warning' },
			);
		}
		try {
			binaryData = this.helpers.assertBinaryData(itemIndex, binaryKey);
		} catch {
			throw new NodeOperationError(
				this.getNode(),
				`This item has no binary field "${binaryKey}". Intermediate nodes often drop binary. Use an expression that returns the file object, e.g. {{ $('On form submission').item.binary.${binaryKey} }}.`,
				{ level: 'warning' },
			);
		}
		uploadFilename = trimmedString(filename) || binaryKey;
	}

	const form = new FormData();
	if (binaryData.id) {
		const stream = await this.helpers.getBinaryStream(binaryData.id, UPLOAD_CHUNK_SIZE);
		const metadata = await this.helpers.getBinaryMetadata(binaryData.id);
		form.append(
			'file',
			new Blob([await streamToBuffer(stream)], { type: metadata.mimeType ?? binaryData.mimeType }),
			uploadFilename,
		);
	} else {
		form.append(
			'file',
			new Blob([Buffer.from(binaryData.data, BINARY_ENCODING)], { type: binaryData.mimeType }),
			uploadFilename,
		);
	}

	const credentials = (await this.getCredentials('businessmapApi')) as {
		apikey: string;
		subdomain: string;
	};
	const fileUploadUrl = `${credentials.subdomain.replace(/\/$/, '')}/api/v2/files`;
	const headers: Record<string, string> = {
		apikey: credentials.apikey,
		'kanbanize-integration': 'n8n',
	};

	let parsedResponse: FilesV2UploadResponse;
	try {
		const raw = await this.helpers.httpRequest({
			method: 'POST',
			url: fileUploadUrl,
			headers,
			body: form,
			json: false,
		});
		parsedResponse =
			typeof raw === 'string' ? (JSON.parse(raw) as FilesV2UploadResponse) : (raw as FilesV2UploadResponse);
	} catch (error) {
		throw new NodeApiError(this.getNode(), {
			message: 'Failed to upload the file',
			description: (error as Error).message,
		});
	}

	const fileInfo = parsedResponse?.data;
	const file_name = fileInfo?.file_name;
	const link = fileInfo?.link;
	if (!file_name || !link) {
		throw new NodeApiError(this.getNode(), {
			message: 'Unexpected upload response: missing data.file_name or data.link',
			description: JSON.stringify(parsedResponse),
		});
	}

	return { file_name, link };
}

/**
 * Uploads via {@link uploadBinaryToFilesApiV2}, then attaches to the document (POST `/docs/{doc_id}/attachments`).
 */
export async function addAttachment(
	this: IExecuteFunctions,
	itemIndex: number,
	docId: number,
	binaryPropertyInput: unknown,
	filename: string,
): Promise<unknown> {
	const { file_name, link } = await uploadBinaryToFilesApiV2.call(
		this,
		itemIndex,
		binaryPropertyInput,
		filename,
	);

	let attachResponse;
	try {
		attachResponse = await businessmapApiRequest.call(
			this,
			'POST',
			`/docs/${docId}/attachments`,
			{ file_name, link },
		);
	} catch (attachError) {
		throw new NodeApiError(this.getNode(), {
			message: `Failed to attach "${file_name}" to document ${docId}`,
			description: (attachError as Error).message,
		});
	}

	return attachResponse.data;
}

function assertPositiveDocAndAttachmentIds(
	this: IExecuteFunctions,
	docId: number,
	attachmentId: number,
): void {
	if (Number.isNaN(docId) || docId <= 0) {
		throw new NodeOperationError(this.getNode(), 'Document ID must be a positive number', {
			level: 'warning',
		});
	}
	if (Number.isNaN(attachmentId) || attachmentId <= 0) {
		throw new NodeOperationError(this.getNode(), 'Attachment ID must be a positive number', {
			level: 'warning',
		});
	}
}

/**
 * PATCH `/docs/{doc_id}/attachments/{attachment_id}` — OpenAPI [updateDocAttachment](https://spain.kanbanize.com/openapi/#/operations/updateDocAttachment).
 */
export async function updateDocAttachment(
	this: IExecuteFunctions,
	docId: number,
	attachmentId: number,
	body: IDataObject,
): Promise<unknown> {
	assertPositiveDocAndAttachmentIds.call(this, docId, attachmentId);

	const response = await businessmapApiRequest.call(
		this,
		'PATCH',
		`/docs/${docId}/attachments/${attachmentId}`,
		body,
	);
	return response.data;
}

/**
 * DELETE `/docs/{doc_id}/attachments/{attachment_id}` — OpenAPI [deleteDocAttachment](https://spain.kanbanize.com/openapi/#/operations/deleteDocAttachment).
 */
export async function deleteDocAttachment(
	this: IExecuteFunctions,
	docId: number,
	attachmentId: number,
): Promise<unknown> {
	assertPositiveDocAndAttachmentIds.call(this, docId, attachmentId);

	const response = await businessmapApiRequest.call(
		this,
		'DELETE',
		`/docs/${docId}/attachments/${attachmentId}`,
	);
	// Ensure a plain object for returnJsonArray (empty DELETE bodies used to yield null).
	return Object.assign(
		{ doc_id: docId, attachment_id: attachmentId },
		typeof response.data === 'object' && response.data !== null && !Array.isArray(response.data)
			? (response.data as IDataObject)
			: {},
	);
}

export const documentHandlers: IResourceHandler = {
	get: async function (this, itemIndex) {
		let docId = this.getNodeParameter('doc_id', itemIndex) as number;
		docId = Number(docId);

		if (Number.isNaN(docId) || docId < 0) {
			throw new NodeOperationError(this.getNode(), 'Document ID must be 0 or a positive number', {
				level: 'warning',
			});
		}

		if (docId > 0) {
			const response = await businessmapApiRequest.call(this, 'GET', `/docs/${docId}`);
			return response.data;
		}

		const filtersRaw = this.getNodeParameter('filters', itemIndex);
		const qs = parseJsonString.call(this, filtersRaw, 'List Filters');

		const response = await businessmapApiRequest.call(this, 'GET', '/docs', undefined, qs);
		return response.data;
	},

	getBoardDocs: async function (this, itemIndex) {
		const boardRaw = this.getNodeParameter('board_id', itemIndex);
		const boardId = coercePositiveBoardId(boardRaw);
		if (boardId === undefined) {
			throw new NodeOperationError(
				this.getNode(),
				'Board ID must be a positive number (use a plain ID like {{ $json["Board ID"] }}, not wrapped in [ ] brackets)',
				{ level: 'warning' },
			);
		}

		const response = await businessmapApiRequest.call(this, 'GET', `/boards/${boardId}/docs`);
		return response.data;
	},

	create: async function (this, itemIndex) {
		const bodyRaw = this.getNodeParameter('document_data', itemIndex);
		const body = parseJsonString.call(this, bodyRaw, 'Document Data');

		const response = await businessmapApiRequest.call(this, 'POST', '/docs', body);

		const boardId = parsePositiveInteger(body.board_id);
		if (boardId !== undefined) {
			const docId = extractDocIdFromResponse(response.data);
			if (docId === undefined) {
				throw new NodeOperationError(
					this.getNode(),
					'Document created but could not determine doc_id to update document locations',
					{ level: 'warning' },
				);
			}

			await businessmapApiRequest.call(
				this,
				'PATCH',
				`/docs/${docId}/locations`,
				{ boards_to_add_or_update: [{ board_id: boardId }] },
			);
		}

		return response.data;
	},

	edit: async function (this, itemIndex) {
		let docId = this.getNodeParameter('doc_id', itemIndex) as number;
		docId = Number(docId);

		if (Number.isNaN(docId) || docId <= 0) {
			throw new NodeOperationError(this.getNode(), 'Document ID must be a positive number', {
				level: 'warning',
			});
		}

		const bodyRaw = this.getNodeParameter('document_data', itemIndex);
		const body = parseJsonString.call(this, bodyRaw, 'Document Data');

		const response = await businessmapApiRequest.call(this, 'PATCH', `/docs/${docId}`, body);
		return response.data;
	},

	addAttachment: async function (this: IExecuteFunctions, itemIndex: number) {
		let docId = this.getNodeParameter('doc_id', itemIndex) as number;
		docId = Number(docId);

		if (Number.isNaN(docId) || docId <= 0) {
			throw new NodeOperationError(this.getNode(), 'Document ID must be a positive number', {
				level: 'warning',
			});
		}

		const binaryInput = this.getNodeParameter('binaryFileData', itemIndex);
		if (!binaryPropertyInputProvided(binaryInput)) {
			throw new NodeOperationError(this.getNode(), 'Binary Property is required for Add Attachment', {
				level: 'warning',
			});
		}
		const filename =
			trimmedString(this.getNodeParameter('filename', itemIndex)) ||
			(isN8nBinaryData(binaryInput) ? trimmedString(binaryInput.fileName) : trimmedString(binaryInput));

		return addAttachment.call(this, itemIndex, docId, binaryInput, filename);
	},

	updateAttachment: async function (this: IExecuteFunctions, itemIndex: number) {
		let docId = this.getNodeParameter('doc_id', itemIndex) as number;
		docId = Number(docId);
		let attachmentId = this.getNodeParameter('attachment_id', itemIndex) as number;
		attachmentId = Number(attachmentId);

		const binaryInput = this.getNodeParameter('binaryFileData', itemIndex);
		const filename =
			trimmedString(this.getNodeParameter('filename', itemIndex)) ||
			(isN8nBinaryData(binaryInput) ? trimmedString(binaryInput.fileName) : trimmedString(binaryInput));
		const bodyRaw = this.getNodeParameter('attachment_data', itemIndex);
		let body = parseJsonString.call(this, bodyRaw, 'Attachment Data');

		if (binaryPropertyInputProvided(binaryInput)) {
			const uploaded = await uploadBinaryToFilesApiV2.call(
				this,
				itemIndex,
				binaryInput,
				filename,
			);
			body = { ...body, file_name: uploaded.file_name, link: uploaded.link };
		}

		if (!Object.keys(body).length) {
			throw new NodeOperationError(
				this.getNode(),
				'Update Attachment: provide Binary Property (to upload via POST /api/v2/files) and/or Attachment Data (JSON) with at least one field to PATCH',
				{ level: 'warning' },
			);
		}

		return updateDocAttachment.call(this, docId, attachmentId, body);
	},

	deleteAttachment: async function (this: IExecuteFunctions, itemIndex: number) {
		let docId = this.getNodeParameter('doc_id', itemIndex) as number;
		docId = Number(docId);
		let attachmentId = this.getNodeParameter('attachment_id', itemIndex) as number;
		attachmentId = Number(attachmentId);

		return deleteDocAttachment.call(this, docId, attachmentId);
	},
};