import type { INodeProperties, IDataObject } from 'n8n-workflow';
import { IResourceHandler } from '../types';
import { NodeOperationError, } from 'n8n-workflow';

import { businessmapApiRequest } from '../transport';

export const stickersOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['stickers'],
      },
    },
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a sticker',
        action: 'Create sticker',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a sticker',
        action: 'Update sticker',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a sticker',
        action: 'Delete sticker',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a sticker',
        action: 'Get sticker',
      },
      {
        name: 'Get All Stickers',
        value: 'getAllStickers',
        description: 'Retrieve all stickers',
        action: 'Get all stickers',
      },
			{
				name: 'Assign Sticker',
				value: 'assign',
				description: 'Assign sticker to a board',
				action: 'Assign sticker to a board',
			},
    ],
    default: 'get',
  },
];

export const stickersFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                        sticker:create / sticker:update                     */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Sticker ID',
    name: 'sticker_id',
    type: 'number',
    default: '',
    placeholder: 'e.g. 12345',
    required: true,
    displayOptions: {
      show: {
        resource: ['stickers'],
        operation: ['update', 'delete'],
      },
    },
  },
  {
    displayName: 'Label',
    name: 'label',
    type: 'string',
    default: '',
    placeholder: 'Label',
    required: true,
    description: 'Sticker label',
    displayOptions: {
      show: {
        resource: ['stickers'],
        operation: ['create', 'update'],
      },
    },
  },
  {
    displayName: 'Color',
    name: 'color',
    type: 'color',
    default: '',
    placeholder: '#EEEEEE',
    description: 'Set sticker color (optional)',
    displayOptions: {
      show: {
        resource: ['stickers'],
        operation: ['create', 'update'],
      },
    },
  },
  /* -------------------------------------------------------------------------- */
  /*                                 sticker:get                                */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Search By',
    name: 'sticker_type',
    type: 'options',
    options: [
      {
        name: 'Label',
        value: 'label',
      },
      {
        name: 'Sticker ID',
        value: 'stickerId',
      },
    ],
    default: 'label',
    description: 'Select option to search by',
    displayOptions: {
      show: {
        resource: ['stickers'],
        operation: ['get'],
      },
    },
  },
  {
    displayName: 'Sticker ID/Label',
    name: 'sticker_id',
    type: 'string',
    default: '',
    placeholder: 'e.g. 12345 or Label Name',
    required: true,
    description: 'ID or label of the sticker to get',
    displayOptions: {
      show: {
        resource: ['stickers'],
        operation: ['get'],
      },
    },
  },
	/* -------------------------------------------------------------------------- */
	/*                             sticker:assign                                 */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Sticker Name or ID',
		name: 'sticker_id',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'Select a sticker by ID, pick from the list, or use the AI button to choose one',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'getStickers',
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'Sticker ID',
				name: 'id',
				type: 'string',
				hint: 'Enter the sticker ID',
				placeholder: '123456',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9]+$',
							errorMessage: 'Sticker ID must be numeric',
						},
					},
				],
				url: '={{ `https://${$credentials.subdomain}.businessmap.io/stickers/${$value}` }}',
			},
		],
		displayOptions: {
			show: {
				resource: ['stickers'],
				operation: ['assign'],
			},
		},
	},
	{
		displayName: 'Board Name or ID',
		name: 'board_id',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'Select a board by ID, pick from the list, or use the AI button to choose one',
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
				resource: ['stickers'],
				operation: ['assign'],
			},
		},
	},
];

export const stickerHandlers: IResourceHandler = {
  get: async function (this, itemIndex) {
    const stickerType = this.getNodeParameter('sticker_type', itemIndex) as string;
    const stickerIdentifier = this.getNodeParameter('sticker_id', itemIndex) as string;

    if (stickerType === 'label') {
      const response = await businessmapApiRequest.call(
        this,
        'GET',
        `/stickers/`,
        {},
        { label: stickerIdentifier },
      );

			return response.data;
    }
    const response = await businessmapApiRequest.call(this, 'GET', `/stickers/${stickerIdentifier}`);

		return response.data;
  },

  getAllStickers: async function (this) {
    const response = await businessmapApiRequest.call(this, 'GET', `/stickers`);

		return response.data;
  },

  create: async function (this, itemIndex) {
    const label = this.getNodeParameter('label', itemIndex) as string;
    const color = this.getNodeParameter('color', itemIndex) as string;

    const response = await businessmapApiRequest.call(
      this,
      'POST',
      `/stickers`,
      { label, color },
    );

		return response.data;
  },

  update: async function (this, itemIndex) {
    const stickerId = this.getNodeParameter('sticker_id', itemIndex) as string;
    const label = this.getNodeParameter('label', itemIndex) as string;
    let color = this.getNodeParameter('color', itemIndex) as string;

		const body: IDataObject = {};
		if (label) {
			body.label = label;
		}

		if (color) {
			// Remove the '#' if it is present at the beginning
			if (color.startsWith('#')) {
					color = color.substring(1);
			}
			// Regular expression to check if color is exactly 6 hexadecimal characters
			const hexColorRegex = /^[0-9A-Fa-f]{6}$/;
			// Verify if the color is valid 6 hexadecimal characters
			if (!hexColorRegex.test(color)) {
					throw new Error('Invalid color format. Color must be a 6-digit hexadecimal value.');
			}

			body.color = color;
		}

    const response = await businessmapApiRequest.call(
      this,
      'PATCH',
      `/stickers/${stickerId}`,
      body,
    );

		return response.data;
  },

  delete: async function (this, itemIndex) {
    const stickerId = this.getNodeParameter('sticker_id', itemIndex) as string;

    await businessmapApiRequest.call(this, 'DELETE', `/stickers/${stickerId}`);
    return { success: true };
  },

	assign: async function(this, itemIndex) {

		const sticker = this.getNodeParameter('sticker_id', itemIndex) as { value: number };
		let stickerId = sticker?.value;
		stickerId = Number(stickerId);
		if (Number.isNaN(stickerId) || stickerId === 0) {
			throw new NodeOperationError(this.getNode(), `Sticker ID must be a positive number`, {level: 'warning',});
		}

		const board = this.getNodeParameter('board_id', itemIndex) as { value: number };
		let boardId	= board?.value;
		boardId = Number(boardId);
		if (Number.isNaN(boardId) || boardId === 0) {
			throw new NodeOperationError(this.getNode(), `Board ID must be a positive number`, {level: 'warning',});
		}

		const result = await businessmapApiRequest.call(
				this,
				'PUT',
				`/boards/${boardId}/stickers/${stickerId}`,
		);

		return { status: result.statusCode};
	},
};
