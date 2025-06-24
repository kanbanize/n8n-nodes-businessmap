import type { INodeProperties, IDataObject } from 'n8n-workflow';
import { IResourceHandler } from '../types';
import { NodeOperationError } from 'n8n-workflow';

import { businessmapApiRequest } from '../transport';

// Workspaces operations
export const workspacesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['workspaces'],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a workspace',
				action: 'Create workspace',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a workspace',
				action: 'Update workspace',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a workspace',
				action: 'Get workspace',
			},
			{
				name: 'Get All Workspaces',
				value: 'getAllWorkspaces',
				description: 'Retrieve all workspaces',
				action: 'Get all workspaces',
			},
		],
		default: 'get',
	},
];

// Workspaces fields
export const workspacesFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*          workspace:create / update / get / getAllWorkspaces                */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Workspace ID',
		name: 'workspace_id',
		type: 'number',
		default: '',
		placeholder: 'e.g. 12345',
		required: true,
		displayOptions: {
			show: {
				resource: ['workspaces'],
				operation: ['update', 'get'],
			},
		},
	},
	{
		displayName: 'Workspace Name',
		name: 'name',
		type: 'string',
		default: '',
		placeholder: 'Workspace Name',
		required: true,
		description: 'The name of the workspace',
		displayOptions: {
			show: {
				resource: ['workspaces'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Workspace Name',
		name: 'name',
		type: 'string',
		default: '',
		placeholder: 'Workspace Name',
		description: 'The name of the workspace',
		displayOptions: {
			show: {
				resource: ['workspaces'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{
				name: 'Team Workspace',
				value: 1,
			},
			{
				name: 'Management Workspace',
				value: 2,
			},
		],
    default: 1,
		description: 'The type of the workspace',
		displayOptions: {
			show: {
				resource: ['workspaces'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'Search for this selected type of the workspaces',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'workspaceTypes',
					searchable: false,
					searchFilterRequired: false,
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['workspaces'],
				operation: ['getAllWorkspaces'],
			},
		},
	},
	{
		displayName: 'Archive',
		name: 'is_archived',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		description: 'Archive or unarchive workspace',
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
				resource: ['workspaces'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Get All, Archived or Non-Archived',
		name: 'is_archived',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'Get workspaces by archive status',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'workspaceArchiveTypes',
					searchable: false,
					searchFilterRequired: false,
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['workspaces'],
				operation: ['getAllWorkspaces'],
			},
		},
	},
];

export const workspaceHandlers: IResourceHandler = {
	create: async function(this, itemIndex) {

		const body: IDataObject = {};
		const name = this.getNodeParameter('name', itemIndex) as string;
		const type = this.getNodeParameter('type', itemIndex) as number;

		if (name) body.name = name;
		if (type) body.type = type;

		const response = await businessmapApiRequest.call(
				this,
				'POST',
				`/workspaces`,
				body
		);

		return this.helpers.returnJsonArray(response.data);
	},

	update: async function(this, itemIndex) {
		let workspaceId = this.getNodeParameter('workspace_id', itemIndex) as number;

		workspaceId = Number(workspaceId);
		if (Number.isNaN(workspaceId) || workspaceId === 0) {
			throw new NodeOperationError(this.getNode(), `Workspace ID must be a positive number`, {level: 'warning',});
		}

		const body: IDataObject = {};
		const name = this.getNodeParameter('name', itemIndex) as string;
		const archived = this.getNodeParameter('is_archived', itemIndex) as { value: string };
		const isArchived = archived?.value;

		if (name) body.name = name;
		if (isArchived !== '') body.is_archived = isArchived;

		const response = await businessmapApiRequest.call(
				this,
				'PATCH',
				`/workspaces/${workspaceId}`,
				body
		);

		return this.helpers.returnJsonArray(response.data);
	},

	get: async function(this, itemIndex) {
		const workspaceId = this.getNodeParameter('workspace_id', itemIndex) as string;

		const response = await businessmapApiRequest.call(this, 'GET', `/workspaces/${workspaceId}`);

		return this.helpers.returnJsonArray(response.data);
	},

	getAllWorkspaces: async function(this, itemIndex) {
		const qs: IDataObject = {};
		const type = this.getNodeParameter('type', itemIndex) as { value: number };
		const typeId = type?.value;

		const archived = this.getNodeParameter('is_archived', itemIndex) as { value: number };
		const isArchived = archived?.value;

		if (typeId > 0) qs.type = typeId;
		if (isArchived >= 0) qs.is_archived = isArchived;
		qs.expand = 'boards';

		const response = await businessmapApiRequest.call(
			this,
			'GET',
			`/workspaces/`,
			undefined,
			qs,
		);

		return this.helpers.returnJsonArray(response.data);
	},
};
