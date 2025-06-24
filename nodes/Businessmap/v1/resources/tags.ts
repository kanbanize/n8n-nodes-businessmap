import type { INodeProperties, IDataObject } from 'n8n-workflow';
import { IResourceHandler } from '../types';
import { NodeOperationError, } from 'n8n-workflow';

import { businessmapApiRequest } from '../transport';

export const tagsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['tags'],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a tag',
				action: 'Create tag',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a tag',
				action: 'Update tag',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a tag',
				action: 'Delete tag',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a tag',
				action: 'Get tag',
			},
			{
				name: 'Get All Tags',
				value: 'getAllTags',
				description: 'Retrieve all tags',
				action: 'Get all tags',
			},
			{
				name: 'Assign Tag',
				value: 'assign',
				description: 'Assign tag to a Board',
				action: 'Assign tag to a board',
			},
		],
		default: 'get',
	},
];

export const tagsFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                           tag:create / tag:update                          */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Tag ID',
		name: 'tag_id',
		type: 'number',
		default: '',
		placeholder: 'e.g. 12345',
		required: true,
		displayOptions: {
			show: {
				resource: ['tags'],
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
		description: 'Tag label',
		displayOptions: {
			show: {
				resource: ['tags'],
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
		description: 'Set tag color (optional)',
		displayOptions: {
			show: {
				resource: ['tags'],
				operation: ['create', 'update'],
			},
		},
	},
	/* -------------------------------------------------------------------------- */
	/*                                 tag:get                                   */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Search By',
		name: 'tag_type',
		type: 'options',
		options: [
			{
				name: 'Label',
				value: 'label',
			},
			{
				name: 'Tag ID',
				value: 'tagId',
			},
		],
		default: 'label',
		description: 'Select option to search by',
		displayOptions: {
			show: {
				resource: ['tags'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'Tag ID/Label',
		name: 'tag_id',
		type: 'string',
		default: '',
		placeholder: 'e.g. 12345 or Label Name',
		required: true,
		description: 'ID or label of the tag to get',
		displayOptions: {
			show: {
				resource: ['tags'],
				operation: ['get'],
			},
		},
	},
	/* -------------------------------------------------------------------------- */
	/*                                 tag:assign                                 */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Tag Name or ID',
		name: 'tag_id',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'Select a tag by ID, pick from the list, or use the AI button to choose one',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'getTags',
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'Tag ID',
				name: 'id',
				type: 'string',
				hint: 'Enter the tag ID',
				placeholder: '123456',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9]+$',
							errorMessage: 'Tag ID must be numeric',
						},
					},
				],
				url: '={{ `https://${$credentials.subdomain}.businessmap.io/tags/${$value}` }}',
			},
		],
		displayOptions: {
			show: {
				resource: ['tags'],
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
				resource: ['tags'],
				operation: ['assign'],
			},
		},
	},
];

export const tagHandlers: IResourceHandler = {
    get: async function(this, itemIndex) {
        const tagType = this.getNodeParameter('tag_type', itemIndex) as string;
        const tagIdentifier = this.getNodeParameter('tag_id', itemIndex) as string;

        if (tagType === 'label') {
            const response = await businessmapApiRequest.call(
                this,
                'GET',
                `/tags/`,
                {},
                { label: tagIdentifier }
            );

						return response.data;
        }
        const response = await businessmapApiRequest.call(this, 'GET', `/tags/${tagIdentifier}`);

				return response.data;
    },

    getAllTags: async function(this) {
        const response = await businessmapApiRequest.call(this, 'GET', `/tags`);

				return response.data;
    },

    create: async function(this, itemIndex) {
        const label = this.getNodeParameter('label', itemIndex) as string;
        const color = this.getNodeParameter('color', itemIndex) as string;

        const response = await businessmapApiRequest.call(
            this,
            'POST',
            `/tags`,
            { label, color }
        );

				return response.data;
    },

    update: async function(this, itemIndex) {
			const tagId = this.getNodeParameter('tag_id', itemIndex) as string;
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
					`/tags/${tagId}`,
					body
			);

			return response.data;
    },

    delete: async function(this, itemIndex) {
        const tagId = this.getNodeParameter('tag_id', itemIndex) as string;

        await businessmapApiRequest.call(
            this,
            'DELETE',
            `/tags/${tagId}`
        );
        return { success: true };
    },

    assign: async function(this, itemIndex) {

			const tag = this.getNodeParameter('tag_id', itemIndex) as { value: number };
			let tagId = tag?.value;
			tagId = Number(tagId);
			if (Number.isNaN(tagId) || tagId === 0) {
				throw new NodeOperationError(this.getNode(), `Tag ID must be a positive number`, {level: 'warning',});
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
					`/boards/${boardId}/tags/${tagId}`,
			);

			return { status: result.statusCode};
    },
};
