import type {
	IDataObject,
	ResourceMapperValue,
	ResourceMapperField,
	INodeProperties
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { IResourceHandler } from '../types';

import { businessmapApiRequest } from '../transport';
import { formatCardOutput, getSelectedFields } from '../helpers/utils';

export const mainCardOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['mainCard'],
      },
    },
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create card',
        action: 'Create card',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update card',
        action: 'Update card',
      },
      {
        name: 'Move',
        value: 'move',
        description: 'Move card',
        action: 'Move card',
      },
      {
        name: 'Get Card',
        value: 'get',
				description: 'Get card by ID',
        action: 'Get card by ID',
      },
      {
        name: 'Get Custom Card',
        value: 'getCustom',
				description: 'Get card by custom card ID',
        action: 'Get card by custom card ID',
      },
      {
        name: 'Get All Cards Per Board',
        value: 'getAllCardsPerBoard',
        description: 'Retrieve all cards from a board',
        action: 'Get all cards per board',
      },
    ],
    default: 'create',
  },
];

export const mainCardFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                                 mainCard:move                              */
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
        resource: ['mainCard'],
        operation: ['move', 'update'],
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
				resource: ['mainCard'],
				operation: ['move', 'update', 'create', 'getAllCardsPerBoard'],
			},
		},
	},
	{
		displayName: 'Workflow Name or ID',
		name: 'workflow_id',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'Select a workflow by ID, pick from the list, or click the AI button to choose one',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchWorkflows',
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'Workflow ID',
				name: 'id',
				type: 'string',
				hint: 'Enter the workflow ID (or ⭐ to have AI pick one)',
				placeholder: '456',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9]+$',
							errorMessage: 'Workflow ID must be numeric',
						},
					},
				],
				url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/workflows/${$value}` }}',
			},
		],
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['move', 'create'],
			},
		},
	},
	{
		displayName: 'Lane Name or ID',
		name: 'lane_id',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'Select a lane by ID, pick from the list, or click the AI button to choose one',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchLanes',
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'Lane ID',
				name: 'id',
				type: 'string',
				placeholder: '789',
				hint: 'Enter the lane ID (or ⭐ for AI)',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9]+$',
							errorMessage: 'Lane ID must be numeric',
						},
					},
				],
				url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/lanes/${$value}` }}',
			},
		],
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['move', 'create'],
			},
		},
	},
	{
		displayName: 'Column Name or ID',
		name: 'column_id',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'Select a column by ID, pick from the list, or click the AI button to choose one',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchColumns',
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'Column ID',
				name: 'id',
				type: 'string',
				placeholder: '789',
				hint: 'Enter the column ID (or ⭐ for AI)',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9]+$',
							errorMessage: 'Column ID must be numeric',
						},
					},
				],
				url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/columns/${$value}` }}',
			},
		],
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['move', 'create'],
			},
		},
	},
  /* -------------------------------------------------------------------------- */
  /*                           mainCard:update,create                           */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Custom Card ID',
    name: 'custom_id',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['mainCard'],
        operation: ['update', 'create'],
      },
    },
  },
  {
    displayName: 'Title',
    name: 'title',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['mainCard'],
        operation: ['update', 'create'],
      },
    },
  },
  {
    displayName: 'Description',
    name: 'description',
    type: 'string',
		typeOptions: {
			rows: 4,
		},
    default: '',
		placeholder: 'Enter card description as text or HTML',
    displayOptions: {
      show: {
        resource: ['mainCard'],
        operation: ['update', 'create'],
      },
    },
  },
  {
    displayName: 'Priority',
    name: 'priority',
    type: 'options',
		options: [
			{
				name: 'Critical',
				value: 1,
			},
			{
				name: 'High',
				value: 2,
			},
			{
				name: 'Average',
				value: 3,
			},
			{
				name: 'Low',
				value: 4,
			},
		],
    default: 3,
    description: 'Select priority for the card. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['mainCard'],
        operation: ['update', 'create'],
      },
    },
  },
	{
		displayName: 'Owner Name or ID',
		name: 'owner_id',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		description: 'Select a user by ID, pick from the list, or click the AI button to choose one',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchUsers',
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: 'Enter owner ID',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9]+$',
							errorMessage: 'Owner ID must be numeric',
						},
					},
				],
				url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/userRoles/${$value}` }}',
			},
		],
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['update', 'create'],
			},
		},
	},
	{
		displayName: 'Deadline',
		name: 'deadline',
		type: 'dateTime',
		typeOptions: {
			enableTime: false,
			dateFormat: 'yyyy-MM-dd',
		},
		default: '',
		description: 'Card deadline',
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['update', 'create'],
			},
		},
	},
  {
    displayName: 'Card Size',
    name: 'size',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['mainCard'],
        operation: ['update', 'create'],
      },
    },
  },
	{
		displayName: 'Workflow, Column and Lane Fields',
		name: 'cardPositionFields',
		type: 'collection',
		placeholder: 'Set workflow, column and lane',
		default: {},
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Workflow Name or ID',
				name: 'workflow_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Select a workflow by ID, pick from the list, or click the AI button to choose one',
				modes: [
					{
						displayName: 'List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchWorkflows',
							searchable: true,
							searchFilterRequired: false,
						},
					},
					{
						displayName: 'Workflow ID',
						name: 'id',
						type: 'string',
						hint: 'Enter the workflow ID (or ⭐ to have AI pick one)',
						placeholder: '456',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Workflow ID must be numeric',
								},
							},
						],
						url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/workflows/${$value}` }}',
					},
				],
			},
			{
				displayName: 'Lane Name or ID',
				name: 'lane_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Select a lane by ID, pick from the list, or click the AI button to choose one',
				modes: [
					{
						displayName: 'List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchLanes',
							searchable: true,
							searchFilterRequired: false,
						},
					},
					{
						displayName: 'Lane ID',
						name: 'id',
						type: 'string',
						placeholder: '789',
						hint: 'Enter the lane ID (or ⭐ for AI)',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Lane ID must be numeric',
								},
							},
						],
						url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/lanes/${$value}` }}',
					},
				],
			},
			{
				displayName: 'Column Name or ID',
				name: 'column_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Select a column by ID, pick from the list, or click the AI button to choose one',
				modes: [
					{
						displayName: 'List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchColumns',
							searchable: true,
							searchFilterRequired: false,
						},
					},
					{
						displayName: 'Column ID',
						name: 'id',
						type: 'string',
						placeholder: '789',
						hint: 'Enter the column ID (or ⭐ for AI)',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Column ID must be numeric',
								},
							},
						],
						url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/columns/${$value}` }}',
					},
				],
			},
		],
	},
	{
		displayName: 'Tag, Sticker and Card Type Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add tag, sticker or card type',
		default: {},
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Tag Name or ID',
				name: 'tag_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Get tags for the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				modes: [
					{
						displayName: 'Tag ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter tag ID',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Tag ID must be numeric',
								},
							},
						],
						url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/tags/${$value}` }}',
					},
					{
						displayName: 'List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchTags',
							searchable: true,
							searchFilterRequired: false,
						},
					},
				],
			},
			{
				displayName: 'Sticker Name or ID',
				name: 'sticker_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Get stickers for the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				modes: [
					{
						displayName: 'Sticker ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter sticker ID',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Sticker ID must be numeric',
								},
							},
						],
						url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/stickers/${$value}` }}',
					},
					{
						displayName: 'List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchStickers',
							searchable: true,
							searchFilterRequired: false,
						},
					},
				],
			},
			{
				displayName: 'Card Type Name or ID',
				name: 'type_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Get card types for the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				modes: [
					{
						displayName: 'Card Type ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter card type ID',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Card Type ID must be numeric',
								},
							},
						],
						url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/cardTypes/${$value}` }}',
					},
					{
						displayName: 'List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchTypes',
							searchable: true,
							searchFilterRequired: false,
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Tag, Sticker, Card Type and Template Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add tag, sticker, card type or template',
		default: {},
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Tag Name or ID',
				name: 'tag_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Get tags for the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				modes: [
					{
						displayName: 'Tag ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter tag ID',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Tag ID must be numeric',
								},
							},
						],
						url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/tags/${$value}` }}',
					},
					{
						displayName: 'List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchTags',
							searchable: true,
							searchFilterRequired: false,
						},
					},
				],
			},
			{
				displayName: 'Sticker Name or ID',
				name: 'sticker_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Get stickers for the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				modes: [
					{
						displayName: 'Sticker ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter sticker ID',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Sticker ID must be numeric',
								},
							},
						],
						url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/stickers/${$value}` }}',
					},
					{
						displayName: 'List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchStickers',
							searchable: true,
							searchFilterRequired: false,
						},
					},
				],
			},
			{
				displayName: 'Card Type Name or ID',
				name: 'type_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Get card types for the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				modes: [
					{
						displayName: 'Card Type ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter card type ID',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Card Type ID must be numeric',
								},
							},
						],
						url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/cardTypes/${$value}` }}',
					},
					{
						displayName: 'List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchTypes',
							searchable: true,
							searchFilterRequired: false,
						},
					},
				],
			},
			{
				displayName: 'Template Name or ID',
				name: 'template_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Get card templates for the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				modes: [
					{
						displayName: 'Template ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter template ID',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[0-9]+$',
									errorMessage: 'Template ID must be numeric',
								},
							},
						],
						url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/cardTemplates/${$value}` }}',
					},
					{
						displayName: 'List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchTemplates',
							searchable: true,
							searchFilterRequired: false,
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Color',
		name: 'color',
		type: 'color',
		default: '',
		placeholder: '#EEEEEE',
		description: 'Set card color',
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['update', 'create'],
			},
		},
	},
	{
		displayName: 'Custom Fields (will show after board is selected)',
		name: 'notice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['update', 'create'],
			},
		},
	},
	{
		displayName: 'Custom Fields to Set',
		name: 'customFields',
		type: 'resourceMapper',
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		typeOptions: {
			loadOptionsDependsOn: ['board_id.value'],
			resourceMapper: {
				resourceMapperMethod: 'getBoardCustomFields',
				mode: 'add',
				fieldWords: {
					singular: 'field',
					plural:   'fields',
				},
				supportAutoMap: false,
				addAllFields: false,
				multiKeyMatch: false,
			},
		},
		displayOptions: {
			show: {
				resource: ['mainCard'],
				operation: ['update', 'create'],
			},
			hide: {
				board_id: [''],
			}
		},
	},

  /* -------------------------------------------------------------------------- */
  /*                                 card:get                                   */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Card ID',
    name: 'card_id',
    type: 'number',
    default: '',
    placeholder: 'Card ID',
    required: true,
    description: 'Card ID of the card to get',
    displayOptions: {
      show: {
        resource: ['mainCard'],
        operation: ['get'],
      },
    },
  },
  /* -------------------------------------------------------------------------- */
  /*                                 card:getCustom                             */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Custom Card ID',
    name: 'card_id',
    type: 'string',
    default: '',
    placeholder: 'Custom card ID',
    required: true,
    description: 'Custom card ID of the card to get',
    displayOptions: {
      show: {
        resource: ['mainCard'],
        operation: ['getCustom'],
      },
    },
  },
	{
		displayName: 'Board Name or ID',
		name: 'board_id',
		type: 'resourceLocator',
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
				resource: ['mainCard'],
				operation: ['getCustom'],
			},
		},
	},
  /* -------------------------------------------------------------------------- */
  /*                                 Output                                     */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Output',
    name: 'output',
    type: 'options',
		options: [
			{
				name: 'Simplified',
				value: 'simplified',
			},
			{
				name: 'Raw',
				value: 'raw',
			},
			{
				name: 'Selected Fields',
				value: 'selected',
			},
		],
    default: 'simplified',
    required: true,
    description: 'Select the fields available in the output',
    displayOptions: {
      show: {
        resource: ['mainCard'],
				operation: ['move', 'update', 'create', 'get', 'getCustom', 'getAllCardsPerBoard'],
      },
    },
  },
  {
    displayName: 'Select Output Fields',
    name: 'output_fields',
    type: 'multiOptions',
		options: [
			{ name: 'Annotations', value: 'annotations' },
			{ name: 'Archived At', value: 'archived_at' },
			{ name: 'Attachments', value: 'attachments' },
			{ name: 'Block Reason', value: 'block_reason' },
			{ name: 'Block Times', value: 'block_times' },
			{ name: 'Board ID', value: 'board_id' },
			{ name: 'Card ID', value: 'card_id' },
			{ name: 'Checked Column Checklist Items', value: 'checked_column_checklist_items' },
			{ name: 'Child Card Stats', value: 'child_card_stats' },
			{ name: 'Co Owner IDs', value: 'co_owner_ids' },
			{ name: 'Color', value: 'color' },
			{ name: 'Column ID', value: 'column_id' },
			{ name: 'Comment Count', value: 'comment_count' },
			{ name: 'Cover Image', value: 'cover_image' },
			{ name: 'Created At', value: 'created_at' },
			{ name: 'Current Block Time', value: 'current_block_time' },
			{ name: 'Current Cycle Time', value: 'current_cycle_time' },
			{ name: 'Current Logged Time', value: 'current_logged_time' },
			{ name: 'Custom Card ID', value: 'custom_id' },
			{ name: 'Custom Fields', value: 'custom_fields' },
			{ name: 'Deadline', value: 'deadline' },
			{ name: 'Description', value: 'description' },
			{ name: 'Discard Comment', value: 'discard_comment' },
			{ name: 'Discarded At', value: 'discarded_at' },
			{ name: 'Finished Subtask Count', value: 'finished_subtask_count' },
			{ name: 'First End Time', value: 'first_end_time' },
			{ name: 'First Request Time', value: 'first_request_time' },
			{ name: 'First Start Time', value: 'first_start_time' },
			{ name: 'In Current Position Since', value: 'in_current_position_since' },
			{ name: 'Initiative Details', value: 'initiative_details' },
			{ name: 'Is Blocked', value: 'is_blocked' },
			{ name: 'Lane ID', value: 'lane_id' },
			{ name: 'Last Column ID', value: 'last_column_id' },
			{ name: 'Last End Time', value: 'last_end_time' },
			{ name: 'Last Lane ID', value: 'last_lane_id' },
			{ name: 'Last Modified', value: 'last_modified' },
			{ name: 'Last Request Time', value: 'last_request_time' },
			{ name: 'Last Start Time', value: 'last_start_time' },
			{ name: 'Lead Time Per Column', value: 'lead_time_per_column' },
			{ name: 'Linked Cards', value: 'linked_cards' },
			{ name: 'Logged Times', value: 'logged_times' },
			{ name: 'Logged Times For Child Cards', value: 'logged_times_for_child_cards' },
			{ name: 'Outcome Current Values', value: 'outcome_current_values' },
			{ name: 'Outcomes', value: 'outcomes' },
			{ name: 'Owner User ID', value: 'owner_user_id' },
			{ name: 'Position', value: 'position' },
			{ name: 'Priority', value: 'priority' },
			{ name: 'Reason ID', value: 'reason_id' },
			{ name: 'Reporter', value: 'reporter' },
			{ name: 'Revision', value: 'revision' },
			{ name: 'Section', value: 'section' },
			{ name: 'Size', value: 'size' },
			{ name: 'Stickers', value: 'stickers' },
			{ name: 'Subtasks', value: 'subtasks' },
			{ name: 'Tag IDs', value: 'tag_ids' },
			{ name: 'Title', value: 'title' },
			{ name: 'Transitions', value: 'transitions' },
			{ name: 'Type ID', value: 'type_id' },
			{ name: 'Unfinished Subtask Count', value: 'unfinished_subtask_count' },
			{ name: 'Version ID', value: 'version_id' },
			{ name: 'Watcher IDs', value: 'watcher_ids' },
			{ name: 'Workflow ID', value: 'workflow_id' },
		],
    default: ['card_id', ],
		required: true,
    description: 'Select all the putput fields you want to receive for the card(s). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['mainCard'],
        operation: ['move', 'update', 'create', 'get', 'getCustom', 'getAllCardsPerBoard'],
				output: ['selected'],
      },
    },
  },
];

export const mainCardHandlers: IResourceHandler = {

  create: async function (this, itemIndex) {
			// 1) define request body
			const body: IDataObject = {};
			// Get required fields
			const column      = this.getNodeParameter('column_id', itemIndex) as { value: number };
			const columnId 		= column?.value;
			const lane        = this.getNodeParameter('lane_id', itemIndex)   as { value: number };
			const laneId	 		= lane?.value;
			// Add required fields
			body['column_id'] = columnId;
			body['lane_id']   = laneId;

			// 2) add simple fields (only add them if the user supplied a value)
			const customId    = this.getNodeParameter('custom_id', itemIndex)    as string;
			const title       = this.getNodeParameter('title', itemIndex)        as string;
			const description = this.getNodeParameter('description', itemIndex)  as string;
			const priority    = this.getNodeParameter('priority', itemIndex)     as number;
			const owner       = this.getNodeParameter('owner_id', itemIndex)     as { value: string };
			const ownerId 		= owner?.value;
			let color 				= this.getNodeParameter('color', itemIndex) 			 as string;
			let deadline 			= this.getNodeParameter('deadline', itemIndex)		 as string;
			const size        = this.getNodeParameter('size', itemIndex)         as string;

			// Validate color
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
			}

			if (customId)    body.custom_id   = customId;
			if (title)       body.title       = title;
			if (description) body.description = description.replace(/\r?\n/g, '<br>');
			if (priority)    body.priority    = priority;
			if (ownerId)     body.owner_user_id = ownerId;
			if (size)        body.size        = size;
			if (color)       body.color       = color;
			// Validate and format the deadline to the required format YYYY-MM-DD H:i:s, by converting it to date object
			if (deadline) {
				const date = new Date(deadline);
				// Check if the deadline is a valid date
				if (isNaN(date.getTime())) {
						throw new Error('Invalid deadline format. Deadline must be a valid date.');
				}
				// Set hours, minutes, seconds, and milliseconds to 0
				date.setHours(0, 0, 0, 0);
				// Format the deadline as YYYY-MM-DDТH:i:sZ
				body.deadline = date.toISOString();
			}

			// 3) merge in any 'additionalFields' collection values -> type_id, tag_id, sticker_id, template_id
			const additional = this.getNodeParameter('additionalFields', itemIndex) as IDataObject;

			for (const [key, value] of Object.entries(additional)) {
				if (key === 'tag_id') {
					if (
						value &&
						typeof value === 'object' &&
						'value' in value &&
						value.value != null
					) {
						const tagValues = Array.isArray(value)
							? value.map((v) => Number(v.value))
							: [Number(value.value)];

						body.tag_ids_to_add = tagValues.filter((val) => !isNaN(val) && val !== 0);
					}
				} else if (key === 'sticker_id') {
					if (
						value &&
						typeof value === 'object' &&
						'value' in value &&
						value.value != null
					) {
						const stickers = Array.isArray(value)
							? value.map((v) => Number(v.value))
							: [Number(value.value)];

						body.stickers_to_add = stickers
							.filter((id) => !isNaN(id) && id !== 0)
							.map((stickerId) => ({ sticker_id: stickerId }));
					}
				} else {
					if (
						value &&
						typeof value === 'object' &&
						'value' in value &&
						value.value != null
					) {
						const numericVal = Number(value.value);
						if (!isNaN(numericVal) && numericVal !== 0) {
							body[key] = numericVal;
						}
					} else {
						const numericVal = Number(value);
						if (!isNaN(numericVal) && numericVal !== 0) {
							body[key] = numericVal;
						}
					}
				}
			}

			// 4) merge custom fields from resourceMapper
			const mapperValue = this.getNodeParameter('customFields.value', itemIndex) as ResourceMapperValue;
			const mapperSchema = this.getNodeParameter('customFields.schema', itemIndex) as ResourceMapperField[];

			if (mapperValue && typeof mapperValue === 'object' &&	Object.keys(mapperValue).length) {
				const customFields: IDataObject[] = [];

				for (const [fieldId, fieldValue] of Object.entries(mapperValue)) {
					// look up this field’s schema entry
					const schemaField = mapperSchema.find((f) => f.id === fieldId);
					if (!schemaField) continue;  // no schema found? skip it

					if (schemaField.type === 'options') {
						// special handling for option‐type fields
						const optionVal = {value_id: fieldValue};
						customFields.push({
							field_id:  fieldId,
							selected_values_to_add_or_update: [optionVal],
						});
					} else {
						// default handling
						customFields.push({
							field_id: fieldId,
							value:    fieldValue,
						});
					}
				}

				body.custom_fields_to_add_or_update = customFields;
			}

			// 5) send the request
			const response = await businessmapApiRequest.call(
				this,
				'POST',
				`/cards`,
				body,
			);

			const items = response.data?.data;
			if (Array.isArray(items) && items.length > 0) {
				// 6) return the created card
				return formatCardOutput.call(this, items, itemIndex);
			}

			// 7) return error if card was not created
			return {status: 'Card not created', details: response.data};
  },

  update: async function (this, itemIndex) {
		let cardId  = this.getNodeParameter('card_id', itemIndex)  as number;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

		// 1) define request body
		const body: IDataObject = {};
		// 2) add simple fields (only add them if the user supplied a value)
		const customId    = this.getNodeParameter('custom_id', itemIndex)    as string;
		const title       = this.getNodeParameter('title', itemIndex)        as string;
		const description = this.getNodeParameter('description', itemIndex)  as string;
		const priority    = this.getNodeParameter('priority', itemIndex)     as number;
		const owner       = this.getNodeParameter('owner_id', itemIndex)     as { value: string };
		const ownerId 		= owner?.value;
		let color 				= this.getNodeParameter('color', itemIndex) 			 as string;
		let deadline 			= this.getNodeParameter('deadline', itemIndex)		 as string;
		const size        = this.getNodeParameter('size', itemIndex)         as string;

		// Validate color
		// Remove the '#' if it is present at the beginning
		if (color) {
			if (color.startsWith('#')) {
					color = color.substring(1);
			}
			// Regular expression to check if color is exactly 6 hexadecimal characters
			const hexColorRegex = /^[0-9A-Fa-f]{6}$/;
			// Verify if the color is valid 6 hexadecimal characters
			if (!hexColorRegex.test(color)) {
					throw new Error('Invalid color format. Color must be a 6-digit hexadecimal value.');
			}
		}

		if (customId)    body.custom_id   = customId;
		if (title)       body.title       = title;
		if (description) body.description = description.replace(/\r?\n/g, '<br>');
		if (priority)    body.priority    = priority;
		if (ownerId)     body.owner_user_id = ownerId;
		if (size)        body.size        = size;
		if (color)       body.color       = color;
		// Validate and format the deadline to the required format YYYY-MM-DD H:i:s, by converting it to date object
		if (deadline) {
			const date = new Date(deadline);
			// Check if the deadline is a valid date
			if (isNaN(date.getTime())) {
					throw new Error('Invalid deadline format. Deadline must be a valid date.');
			}
			// Set hours, minutes, seconds, and milliseconds to 0
			date.setHours(0, 0, 0, 0);
			// Format the deadline as YYYY-MM-DDТH:i:sZ
			body.deadline = date.toISOString();
		}

		// 3) merge in any 'cardPositionFields' collection values -> workflow_id, column_id, lane_id
		const cardPositionFields = this.getNodeParameter('cardPositionFields', itemIndex) as {
			workflow_id?: { __rl: boolean; value: number; mode: string; cachedResultName: string };
			lane_id?: { __rl: boolean; mode: string; value: string };
			column_id?: { __rl: boolean; mode: string; value: string };
		};
		if (cardPositionFields.lane_id) {
			const lane = cardPositionFields.lane_id;
			const laneId 		= lane?.value;
			body['lane_id'] = laneId;
		}
		if (cardPositionFields.column_id) {
			const column = cardPositionFields.column_id;
			const columnId 		= column?.value;
			body['column_id'] = columnId;
		}

		// 4) merge in any 'additionalFields' collection values -> type_id, tag_id, sticker_id
		const additional = this.getNodeParameter('additionalFields', itemIndex) as IDataObject;
		for (const [key, value] of Object.entries(additional)) {
			if (key === 'tag_id') {
				if (value && typeof value === 'object' && 'value' in value && value.value != null) {
						body.tag_ids_to_add = Array.isArray(value) ? value.map((v) => v.value) : [value.value];
				}
			} else if (key === 'sticker_id') {

				if (value && typeof value === 'object' && 'value' in value && value.value != null) {
						const stickers = Array.isArray(value) ? value.map((v) => v.value) : [value.value];
						body.stickers_to_add = stickers.map((stickerId) => ({sticker_id: Number(stickerId)}));
				}
			} else {
				if (value && typeof value === 'object' && 'value' in value && value.value != null) {
					// If 'value' exists and is not null or undefined, assign it
					body[key] = value.value;
				} else {
					body[key] = value;
				}
			}
		}

		// 5) merge custom fields from resourceMapper
		const mapperValue = this.getNodeParameter('customFields.value', itemIndex) as ResourceMapperValue;
		const mapperSchema = this.getNodeParameter('customFields.schema', itemIndex) as ResourceMapperField[];

		if (mapperValue && typeof mapperValue === 'object' &&	Object.keys(mapperValue).length) {
			const customFields: IDataObject[] = [];
			const customFieldsToRemove = [];

			for (const [fieldId, fieldValue] of Object.entries(mapperValue)) {
				// look up this field’s schema entry
				const schemaField = mapperSchema.find((f) => f.id === fieldId);
				if (!schemaField) continue;  // no schema found? skip it

				if (schemaField.type === 'options') {
					// special handling for option‐type fields
					const optionVal = {value_id: fieldValue};
					customFields.push({
						field_id:  fieldId,
						selected_values_to_add_or_update: [optionVal],
					});
					customFieldsToRemove.push(fieldId);
				} else {
					// default handling
					customFields.push({
						field_id: fieldId,
						value:    fieldValue,
					});
				}
			}

			body.custom_fields_to_add_or_update = customFields;
			body.custom_field_ids_to_remove = customFieldsToRemove;
		}

		// 6) send the request
		const response = await businessmapApiRequest.call(
			this,
			'PATCH',
			`/cards/${cardId}`,
			body,
		);

		const items = response.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			// 6) return the updated card
			return formatCardOutput.call(this, items, itemIndex);
		}

		if (Array.isArray(items) && items.length === 0) {
			// 7) nothing to be updated
			return { status: 'No update applied — request contained no changes.' };
		}

		// 8) Some other error
		return {status: 'Card not updated', details: response.data};
  },

  move: async function (this, itemIndex) {

    let cardId = this.getNodeParameter('card_id', itemIndex) as number;

		let column = this.getNodeParameter('column_id', itemIndex) as { value: number };
		let columnId = column?.value;

		let lane = this.getNodeParameter('lane_id', itemIndex) as { value: number };
		let laneId = lane?.value;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

		columnId = Number(columnId);
		if (Number.isNaN(columnId) || columnId === 0) {
			throw new NodeOperationError(this.getNode(), `Column ID must be a positive number`, {level: 'warning',});
		}

		laneId = Number(laneId);
		if (Number.isNaN(laneId) || laneId === 0) {
			throw new NodeOperationError(this.getNode(), `Lane ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'PATCH',
      `/cards/${cardId}`,
      { column_id: columnId, lane_id: laneId },
    );

		const items = response.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, items, itemIndex);
		}

		if (Array.isArray(items) && items.length === 0) {
			// 4) nothing updated
			return {status: 'Card not moved, because it is already there'};
		}

		// 5) Some other error
		return {status: 'Card not moved', details: response.data};
  },

	get: async function (this, itemIndex) {
		let cardIdentifier = this.getNodeParameter('card_id', itemIndex) as number;

		cardIdentifier = Number(cardIdentifier);
		if (Number.isNaN(cardIdentifier) || cardIdentifier === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

		const qs: IDataObject = {};
		qs.card_ids = cardIdentifier;

		const { fields, expand } = getSelectedFields.call(this, itemIndex);
		if (fields !== '') {
			qs.fields = fields;
		}
		if (expand !== '') {
			qs.expand = expand;
		}

		const response = await businessmapApiRequest.call(
			this,
			'GET',
			`/cards/`,
			undefined,
			qs,
		);

		// pull out the parsed JSON (response.data.data) and then its data array
		// First `data` is from businessmapApiRequest, second is from Businessmap main `data` and third `data` are the actual cards
		const items = response.data?.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, items, itemIndex);
		}

		// 4) nothing found → return an empty object
		return {status: 'Card not found'};
	},

	getCustom: async function (this, itemIndex) {
		const cardIdentifier = this.getNodeParameter('card_id', itemIndex) as string;
		const board   = this.getNodeParameter('board_id', itemIndex) as { value: number };
		const boardId = board?.value;

		if (cardIdentifier === '') {
			throw new NodeOperationError(this.getNode(), `Custom Card ID must not be empty`, {level: 'warning',});
		}

		const qs: IDataObject = {};
		if(boardId) {
			qs.board_ids = boardId.toString();
		}

		qs.custom_ids = cardIdentifier;

		const { fields, expand } = getSelectedFields.call(this, itemIndex);
		if (fields !== '') {
			qs.fields = fields;
		}
		if (expand !== '') {
			qs.expand = expand;
		}

		const response = await businessmapApiRequest.call(
			this,
			'GET',
			'/cards/',
			undefined,
			qs,
		);

		const items = response.data?.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, items, itemIndex);
		}

		return {status: 'Card not found'};
	},

  getAllCardsPerBoard: async function (this, itemIndex) {
		const board   = this.getNodeParameter('board_id', itemIndex) as { value: number };
		let boardId = board?.value;

		boardId = Number(boardId);
		if (Number.isNaN(boardId) || boardId === 0) {
			throw new NodeOperationError(this.getNode(), `Board ID must be a positive number`, {level: 'warning',});
		}

		const qs: IDataObject = {};
		if(boardId) {
			qs.board_ids = boardId.toString();
		}

		const { fields, expand } = getSelectedFields.call(this, itemIndex);
		if (fields !== '') {
			qs.fields = fields;
		}
		if (expand !== '') {
			qs.expand = expand;
		}
		const response = await businessmapApiRequest.call(
			this,
			'GET',
			'/cards/',
			undefined,
			qs,
		);

		const items = response.data?.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, response.data, itemIndex);
		}

		return {status: 'No cards found'};
  },
};
