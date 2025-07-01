import type { INodeProperties, IDataObject } from 'n8n-workflow';
import { IResourceHandler } from '../types';
import { NodeOperationError } from 'n8n-workflow';

import { businessmapApiRequest } from '../transport';

// Boards operations
export const boardsOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['boards'],
      },
    },
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a board',
        action: 'Create board',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a board',
        action: 'Update board',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a board',
        action: 'Get board',
      },
      {
        name: 'Get All Boards',
        value: 'getAllBoards',
        description: 'Retrieve all boards',
        action: 'Get all boards',
      },
      {
        name: 'Get Board Structure',
        value: 'getBoardStructure',
        description: 'Retrieve board structure',
        action: 'Get board structure',
      },
    ],
    default: 'create',
  },
];

// Boards fields
export const boardsFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                        boards:create / update / get                        */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Board ID',
    name: 'board_id',
    type: 'number',
    default: '',
    placeholder: 'e.g. 9876',
    required: true,
    displayOptions: {
      show: {
        resource: ['boards'],
        operation: ['update', 'get', 'getBoardStructure'],
      },
    },
  },
  {
    displayName: 'Workspace',
    name: 'workspace_id',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
		required: true,
    description: 'Select workspace for the board',
    modes: [
      {
        displayName: 'List',
        name: 'list',
        type: 'list',
        typeOptions: {
          searchListMethod: 'searchWorkspaces',
          searchable: true,
          searchFilterRequired: false,
        },
      },
    ],
    displayOptions: {
      show: {
        resource: ['boards'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Workspace',
    name: 'workspace_id',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    description: 'Filter boards by workspace',
    modes: [
      {
        displayName: 'List',
        name: 'list',
        type: 'list',
        typeOptions: {
          searchListMethod: 'searchWorkspaces',
          searchable: true,
          searchFilterRequired: false,
        },
      },
    ],
    displayOptions: {
      show: {
        resource: ['boards'],
        operation: ['getAllBoards'],
      },
    },
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    default: '',
    placeholder: 'My board',
    required: true,
    description: 'The name of the board',
    displayOptions: {
      show: {
        resource: ['boards'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    default: '',
    placeholder: 'My board',
    description: 'The name of the board',
    displayOptions: {
      show: {
        resource: ['boards'],
        operation: ['update'],
      },
    },
  },
  {
    displayName: 'Description',
    name: 'description',
    type: 'string',
    default: '',
    description: 'The description of the board',
    displayOptions: {
      show: {
        resource: ['boards'],
        operation: ['create', 'update'],
      },
    },
  },
	{
		displayName: 'Archive',
		name: 'is_archived',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		description: 'Archive or unarchive board',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'archiveTypes',
					searchable: false,
					searchFilterRequired: false,
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['boards'],
				operation: ['update'],
			},
		},
	},

  /* -------------------------------------------------------------------------- */
  /*                               boards:getAllBoards                          */
  /* -------------------------------------------------------------------------- */

	{
		displayName: 'Show Archive',
		name: 'is_archived',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		description: 'Archive or unarchive board',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'archiveTypes',
					searchable: false,
					searchFilterRequired: false,
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['boards'],
				operation: ['getAllBoards'],
			},
		},
	},
];

export const boardHandlers: IResourceHandler = {
  create: async function (this, itemIndex) {
    const workspace = this.getNodeParameter('workspace_id', itemIndex) as { value: number };
		const workspaceId = workspace?.value;

    const name = this.getNodeParameter('name', itemIndex) as string;

    const body: IDataObject = { workspace_id: workspaceId, name };

    const response = await businessmapApiRequest.call(
      this,
      'POST',
      `/boards`,
      body,
    );

    return this.helpers.returnJsonArray(response.data);
  },

  update: async function (this, itemIndex) {
    let boardId = this.getNodeParameter('board_id', itemIndex) as number;

    boardId = Number(boardId);
    if (Number.isNaN(boardId) || boardId <= 0) {
      throw new NodeOperationError(this.getNode(), 'Board ID must be a positive number', {
        level: 'warning',
      });
    }

    const body: IDataObject = {};
    const name = this.getNodeParameter('name', itemIndex) as string;

		const archived = this.getNodeParameter('is_archived', itemIndex) as { value: number };
		const isArchived = archived?.value;

    if (name) body.name = name;
    if (isArchived === 0 || isArchived === 1) body.is_archived = isArchived;

    const response = await businessmapApiRequest.call(
      this,
      'PATCH',
      `/boards/${boardId}`,
      body,
    );

    return this.helpers.returnJsonArray(response.data);
  },

  get: async function (this, itemIndex) {
    const boardId = this.getNodeParameter('board_id', itemIndex) as string;

    const response = await businessmapApiRequest.call(
      this,
      'GET',
      `/boards/${boardId}`,
    );

    return this.helpers.returnJsonArray(response.data);
  },

  getAllBoards: async function (this, itemIndex) {
    const qs: IDataObject = {};
    const workspace = this.getNodeParameter('workspace_id', itemIndex) as { value: number };
		const workspaceId = workspace?.value;

		const archived = this.getNodeParameter('is_archived', itemIndex) as { value: string };
		const isArchived = archived?.value;

    if (workspaceId) qs.workspace_ids = workspaceId;
    if (isArchived !== '') qs.is_archived = isArchived;

    const response = await businessmapApiRequest.call(
      this,
      'GET',
      `/boards`,
      undefined,
      qs,
    );

    return this.helpers.returnJsonArray(response.data);
  },

  getBoardStructure: async function (this, itemIndex) {
    const boardId = this.getNodeParameter('board_id', itemIndex) as string;

    const response = await businessmapApiRequest.call(
      this,
      'GET',
      `/boards/${boardId}/currentStructure`,
    );

    return this.helpers.returnJsonArray(response.data);
  },
};
