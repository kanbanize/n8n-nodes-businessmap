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
				name: 'Get Document',
				value: 'get',
				description: 'Get a single document by ID',
				action: 'Get a document',
			},
			{
				name: 'Get Board Documents',
				value: 'getBoardDocs',
				description: 'Get all documents on a board',
				action: 'Get board documents',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a document',
				action: 'Update document',
			},
			{
				name: 'Set Location',
				value: 'setLocation',
				description: 'Add the document to a card or a board',
				action: 'Set document location',
			},
			{
				name: 'Add Attachment',
				value: 'addAttachment',
				description: 'Upload a file and attach it to a document',
				action: 'Add attachment to document',
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
		required: true,
		placeholder: 'e.g. 123',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['get'],
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
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'Document title',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 8,
		},
		default: '',
		placeholder: 'Enter content as text or HTML',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'For Welcome',
				name: 'for_welcome',
				type: 'boolean',
				default: false,
				description: 'Whether to show the doc on the welcome screen',
			},
			{
				displayName: 'Is Archived',
				name: 'is_archived',
				type: 'boolean',
				default: false,
				description: 'Whether to create the doc as archived',
			},
			{
				displayName: 'Is Important',
				name: 'is_important',
				type: 'boolean',
				default: false,
				description: 'Whether to mark the doc as important',
			},
			{
				displayName: 'Is Indexed for AI',
				name: 'is_indexed_for_ai',
				type: 'boolean',
				default: false,
				description: 'Whether to index the doc for AI. Omit this field to use the account default.',
			},
			{
				displayName: 'Parent Doc ID',
				name: 'parent_doc_id',
				type: 'number',
				default: 0,
				description: 'ID of an existing doc to nest this one under. Leave 0 to create as top-level.',
			},
			{
				displayName: 'Show in Main Doc List',
				name: 'show_in_main_doc_list',
				type: 'boolean',
				default: true,
				description: 'Whether to show the doc in the main doc list',
			},
		],
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
				operation: ['update', 'setLocation', 'addAttachment'],
			},
		},
	},
	{
		displayName: 'Card ID',
		name: 'card_id',
		type: 'number',
		default: 0,
		placeholder: 'e.g. 456',
		description: 'Card to add the document to. Leave 0 to skip.',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['setLocation'],
			},
		},
	},
	{
		displayName: 'Board Name or ID',
		name: 'board_id',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		description: 'Board to add the document to. Leave empty to skip.',
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
				operation: ['setLocation'],
			},
		},
	},
	{
		displayName: 'File Name',
		name: 'filename',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['addAttachment'],
			},
		},
	},
	{
		displayName: 'Binary Property',
		name: 'binaryFileData',
		type: 'string',
		default: '',
		description:
			'Binary field name on this item (e.g. Attachment_to_add), or an expression that returns that name or the full binary object (e.g. {{ $(\'On form submission\').item.binary.Attachment_to_add }} when this item no longer carries the file).',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['addAttachment'],
			},
		},
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		placeholder: 'Document title',
		description: 'Leave empty to keep the current title',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 8,
		},
		default: '',
		placeholder: 'Enter content as text or HTML',
		description: 'Leave empty to keep the current content',
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['documents'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'For Welcome',
				name: 'for_welcome',
				type: 'boolean',
				default: false,
				description: 'Whether to show the doc on the welcome screen',
			},
			{
				displayName: 'Is Archived',
				name: 'is_archived',
				type: 'boolean',
				default: false,
				description: 'Whether the doc should be archived',
			},
			{
				displayName: 'Is Important',
				name: 'is_important',
				type: 'boolean',
				default: false,
				description: 'Whether to mark the doc as important',
			},
			{
				displayName: 'Is Indexed for AI',
				name: 'is_indexed_for_ai',
				type: 'boolean',
				default: false,
				description: 'Whether to index the doc for AI. Requires permission to manage AI indexation.',
			},
			{
				displayName: 'Parent Doc ID',
				name: 'parent_doc_id',
				type: 'number',
				default: 0,
				description: 'ID of an existing doc to nest this one under. Set to 0 to detach the current parent (make it top-level).',
			},
		],
	},
];

function parsePositiveInteger(value: unknown): number | undefined {
	const parsed = Number(value);
	if (Number.isNaN(parsed) || parsed <= 0) {
		return undefined;
	}
	return parsed;
}

/**
 * Maps the create/edit "Additional Fields" / "Update Fields" collection onto the doc body.
 * Booleans become 0/1. parent_doc_id: present-but-zero means "no parent" — sent as null to
 * detach on edit (Businessmap has no doc with id 0); a positive integer sets the parent.
 * Fields the user didn't add to the collection are absent here, so the API uses its own defaults.
 */
function applyDocBodyExtras(body: IDataObject, extras: IDataObject): void {
	const booleanFields = [
		'is_important',
		'for_welcome',
		'is_archived',
		'is_indexed_for_ai',
		'show_in_main_doc_list',
	] as const;
	for (const key of booleanFields) {
		if (extras[key] !== undefined) {
			body[key] = extras[key] ? 1 : 0;
		}
	}
	if (extras.parent_doc_id !== undefined) {
		const parentId = parsePositiveInteger(extras.parent_doc_id);
		body.parent_doc_id = parentId ?? null;
	}
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

const UPLOAD_CHUNK_SIZE = 1024 * 1024;

// Buffer.concat always allocates a fresh, non-shared ArrayBuffer, so narrowing the return type
// to Buffer<ArrayBuffer> is safe and makes the result usable as a BlobPart (which rejects
// SharedArrayBuffer-backed views). Same workaround as nodes/Businessmap/v1/resources/attachments.ts.
async function streamToBuffer(stream: Readable): Promise<Buffer<ArrayBuffer>> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		stream.on('data', (chunk) => chunks.push(chunk));
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks) as Buffer<ArrayBuffer>));
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

	// Subdomain is still needed to build the URL; the apikey header is injected by the
	// credential's `authenticate` block via httpRequestWithAuthentication.
	const credentials = (await this.getCredentials('businessmapApi')) as {
		subdomain: string;
	};
	const fileUploadUrl = `${credentials.subdomain.replace(/\/$/, '')}/api/v2/files`;
	const headers: Record<string, string> = {
		'kanbanize-integration': 'n8n',
	};

	let parsedResponse: FilesV2UploadResponse;
	try {
		const raw = await this.helpers.httpRequestWithAuthentication.call(this, 'businessmapApi', {
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

export const documentHandlers: IResourceHandler = {
	get: async function (this, itemIndex) {
		let docId = this.getNodeParameter('doc_id', itemIndex) as number;
		docId = Number(docId);

		if (Number.isNaN(docId) || docId <= 0) {
			throw new NodeOperationError(this.getNode(), 'Document ID must be a positive number', {
				level: 'warning',
			});
		}

		const response = await businessmapApiRequest.call(this, 'GET', `/docs/${docId}`);
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
		const title = trimmedString(this.getNodeParameter('title', itemIndex));
		if (!title) {
			throw new NodeOperationError(this.getNode(), 'Title is required', { level: 'warning' });
		}

		const contentRaw = this.getNodeParameter('content', itemIndex);
		const content = (contentRaw === null || contentRaw === undefined ? '' : String(contentRaw)).replace(/\r?\n/g, '<br>');

		const body: IDataObject = { title, content };

		const additional = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		applyDocBodyExtras(body, additional);

		const response = await businessmapApiRequest.call(this, 'POST', '/docs', body);
		return response.data;
	},

	update: async function (this, itemIndex) {
		let docId = this.getNodeParameter('doc_id', itemIndex) as number;
		docId = Number(docId);

		if (Number.isNaN(docId) || docId <= 0) {
			throw new NodeOperationError(this.getNode(), 'Document ID must be a positive number', {
				level: 'warning',
			});
		}

		const title = trimmedString(this.getNodeParameter('title', itemIndex));
		const contentRaw = this.getNodeParameter('content', itemIndex);
		const contentString = contentRaw === null || contentRaw === undefined ? '' : String(contentRaw);

		const body: IDataObject = {};
		if (title) {
			body.title = title;
		}
		// Treat a blank or whitespace-only content as "leave unchanged"; only convert newlines for real input.
		if (contentString.trim()) {
			body.content = contentString.replace(/\r?\n/g, '<br>');
		}

		const updates = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
		applyDocBodyExtras(body, updates);

		if (Object.keys(body).length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Provide at least one field to update (Title, Content, or an Update Field)',
				{ level: 'warning' },
			);
		}

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

	setLocation: async function (this, itemIndex) {
		let docId = this.getNodeParameter('doc_id', itemIndex) as number;
		docId = Number(docId);

		if (Number.isNaN(docId) || docId <= 0) {
			throw new NodeOperationError(this.getNode(), 'Document ID must be a positive number', {
				level: 'warning',
			});
		}

		const cardId = parsePositiveInteger(this.getNodeParameter('card_id', itemIndex));
		const boardId = coercePositiveBoardId(this.getNodeParameter('board_id', itemIndex));

		if (cardId === undefined && boardId === undefined) {
			throw new NodeOperationError(
				this.getNode(),
				'Provide a Card ID or a Board to add the document to',
				{ level: 'warning' },
			);
		}

		const body: IDataObject = {};
		if (cardId !== undefined) {
			body.card_ids_to_add = [cardId];
		}
		if (boardId !== undefined) {
			body.boards_to_add_or_update = [{ board_id: boardId }];
		}

		const response = await businessmapApiRequest.call(
			this,
			'PATCH',
			`/docs/${docId}/locations`,
			body,
		);
		return response.data;
	},
};