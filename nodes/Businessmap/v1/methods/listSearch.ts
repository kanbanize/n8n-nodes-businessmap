import type {
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeListSearchResult,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { businessmapApiRequest } from '../transport';
import { GetBoardDependentItemsParams, getBoardDependentItems, checkApiResponse } from '../helpers/utils';

export async function searchWorkspaces(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    '/workspaces',
		undefined,
		{is_archived: 0}
  );

  const workspacesData = response.data?.data;
	checkApiResponse(this.getNode(), response, workspacesData, 'search workspaces');

  let allWorkspaces: INodePropertyOptions[] = workspacesData
		.sort((a: { name: string; }, b: { name: string; }) => a.name.localeCompare(b.name))
		.map((workspace: any) => ({
			name: `${workspace.name} (${workspace.workspace_id})`,
			value: workspace.workspace_id,
  }));

  // Apply filter if provided
  const filtered = filter
    ? allWorkspaces.filter(workspace =>
        (workspace.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : allWorkspaces;

  return {
    results: filtered,
  };
}

export async function searchBoards(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    '/boards',
		undefined,
		{is_archived: 0}
  );

  const boardsData = response.data?.data;
	checkApiResponse(this.getNode(), response, boardsData, 'search boards');

  const allBoards: INodePropertyOptions[] = boardsData
		.sort((a: { name: string; }, b: { name: string; }) => a.name.localeCompare(b.name))
		.map((board: any) => ({
			name: `${board.name} (${board.board_id})`,
			value: board.board_id,
  }));

  // Apply filter if provided
  const filtered = filter
    ? allBoards.filter(board =>
        (board.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : allBoards;

  return {
    results: filtered,
  };
}

export async function searchWorkflows(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const boardId = this.getNodeParameter('board_id',	undefined, { extractValue: true },) as number;

  if (!boardId) {
		throw new NodeOperationError(
			this.getNode(),
			`Please select a board above to load workflows.`,
			{ level: 'warning' },
  	)
	}

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    `/boards/${boardId}/workflows`,
  );

  const workflows = response.data?.data;
	checkApiResponse(this.getNode(), response, workflows, 'search workflows');

  const enabledWorkflows: INodePropertyOptions[] = workflows
		.filter((workflow: { workflow_id: number; name: string; is_enabled: number }) => workflow.is_enabled !== 0)
		.map((workflow: { workflow_id: number; name: string }) => ({
			name: workflow.name,
			value: workflow.workflow_id,
	}));

  // Apply filter if provided
  const filtered = filter
    ? enabledWorkflows.filter(b =>
        (b.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : enabledWorkflows;

  return {
    results: filtered,
  };
}

export async function searchColumns(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const boardId = this.getNodeParameter('board_id',	undefined, { extractValue: true },) as number;
	const operation = this.getNodeParameter('operation', '') as string;

	let workflowId: number | undefined;
	if (operation === 'update') {
		const cardPositionFields = this.getNodeParameter('cardPositionFields', {}) as {
			workflow_id?: { __rl: boolean; value: number; mode: string; cachedResultName: string };
			lane_id?: { __rl: boolean; mode: string; value: string };
			column_id?: { __rl: boolean; mode: string; value: string };
		};
		if (cardPositionFields.workflow_id) {
			const workflowField = cardPositionFields.workflow_id;
			if (workflowField.__rl && workflowField.value) {
				workflowId = workflowField.value;
			}
		}
	} else {
		workflowId = this.getNodeParameter('workflow_id', undefined, { extractValue: true }) as number;
	}

  if (!boardId || !workflowId) {
		throw new NodeOperationError(
			this.getNode(),
			`Please select a board and workflow above to load columns.`,
			{ level: 'warning' },
  	)
	}

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    `/boards/${boardId}/columns`,
  );

  const columns = response.data?.data;
	checkApiResponse(this.getNode(), response, columns, 'search columns');

  const workflowColumns: INodePropertyOptions[] = columns
		.filter((column: { column_id: number; name: string; workflow_id: number }) => column.workflow_id === workflowId)
		.map((column: { column_id: number; name: string }) => ({
			name: column.name,
			value: column.column_id,
	}));

  // Apply filter if provided
  const filtered = filter
    ? workflowColumns.filter(b =>
        (b.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : workflowColumns;

  return {
    results: filtered,
  };
}

export async function searchLanes(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const boardId = this.getNodeParameter('board_id',	undefined, { extractValue: true },) as number;
	const operation = this.getNodeParameter('operation', '') as string;

	let workflowId: number | undefined;
	if (operation === 'update') {
		const cardPositionFields = this.getNodeParameter('cardPositionFields', {}) as {
			workflow_id?: { __rl: boolean; value: number; mode: string; cachedResultName: string };
			lane_id?: { __rl: boolean; mode: string; value: string };
			column_id?: { __rl: boolean; mode: string; value: string };
		};
		if (cardPositionFields.workflow_id) {
			const workflowField = cardPositionFields.workflow_id;
			if (workflowField.__rl && workflowField.value) {
				workflowId = workflowField.value;
			}
		}
	} else {
		workflowId = this.getNodeParameter('workflow_id', undefined, { extractValue: true }) as number;
	}

  if (!boardId || !workflowId) {
		throw new NodeOperationError(
			this.getNode(),
			`Please select a board and workflow above to load lanes.`,
			{ level: 'warning' },
  	)
	}

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    `/boards/${boardId}/lanes`,
  );

  const lanes = response.data?.data;
	checkApiResponse(this.getNode(), response, lanes, 'search lanes');

  const workflowLanes: INodePropertyOptions[] = lanes
		.filter((lane: { lane_id: number; name: string; workflow_id: number }) => lane.workflow_id === workflowId)
		.map((lane: { lane_id: number; name: string }) => ({
			name: lane.name,
			value: lane.lane_id,
	}));

  // Apply filter if provided
  const filtered = filter
    ? workflowLanes.filter(b =>
        (b.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : workflowLanes;

  return {
    results: filtered,
  };
}

export async function searchUsers(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const boardId = this.getNodeParameter('board_id',	undefined, { extractValue: true },) as number;

	const params: GetBoardDependentItemsParams = {
		boardEndpoint: 'userRoles',
		item: 'Users',
		idField: 'user_id',
		endpoint: '/users',
		idsParamName: 'user_ids',
		returnLabel: 'username',
	};

	const users = await getBoardDependentItems.call(this, params, boardId);

  // Apply filter if provided
  const filtered = filter
    ? users.filter(user =>
        (user.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : users;

  return {
    results: filtered,
  };
}

export async function searchTags(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const boardId = this.getNodeParameter('board_id',	undefined, { extractValue: true },) as number;

  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'tags',
    item: 'Tags',
    idField: 'tag_id',
    endpoint: '/tags',
    idsParamName: 'tag_ids',
    returnLabel: 'label',
  };

	const tags = await getBoardDependentItems.call(this, params, boardId);

  // Apply filter if provided
  const filtered = filter
    ? tags.filter(tag =>
        (tag.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : tags;

  return {
    results: filtered,
  };
}

export async function searchStickers(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const boardId = this.getNodeParameter('board_id',	undefined, { extractValue: true },) as number;

  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'stickers',
    item: 'Stickers',
    idField: 'sticker_id',
    endpoint: '/stickers',
    idsParamName: 'sticker_ids',
    returnLabel: 'label',
  };

	const stickers = await getBoardDependentItems.call(this, params, boardId);

  // Apply filter if provided
  const filtered = filter
    ? stickers.filter(sticker =>
        (sticker.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : stickers;

  return {
    results: filtered,
  };
}

export async function searchTypes(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const boardId = this.getNodeParameter('board_id',	undefined, { extractValue: true },) as number;

  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'cardTypes',
    item: 'Card Types',
    idField: 'type_id',
    endpoint: '/cardTypes',
    idsParamName: 'type_ids',
    returnLabel: 'name',
  };

	const cardTypes = await getBoardDependentItems.call(this, params, boardId);

  // Apply filter if provided
  const filtered = filter
    ? cardTypes.filter(cardType =>
        (cardType.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : cardTypes;

  return {
    results: filtered,
  };
}

export async function searchTemplates(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const boardId = this.getNodeParameter('board_id',	undefined, { extractValue: true },) as number;

  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'cardTemplates',
    item: 'Card Templates',
    idField: 'template_id',
    endpoint: '/cardTemplates',
    idsParamName: 'template_ids',
    returnLabel: 'name',
  };

	const cardTemplates = await getBoardDependentItems.call(this, params, boardId);

  // Apply filter if provided
  const filtered = filter
    ? cardTemplates.filter(cardTemplate =>
        (cardTemplate.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : cardTemplates;

  return {
    results: filtered,
  };
}

export async function searchBlockReasons(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const boardId = this.getNodeParameter('board_id',	undefined, { extractValue: true },) as number;

  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'blockReasons',
    item: 'Block Reasons',
    idField: 'reason_id',
    endpoint: '/blockReasons',
    idsParamName: 'reason_ids',
    returnLabel: 'label',
  };

	const blockReasons = await getBoardDependentItems.call(this, params, boardId);

  // Apply filter if provided
  const filtered = filter
    ? blockReasons.filter(blockReason =>
        (blockReason.name as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : blockReasons;

  return {
    results: filtered,
  };
}

export async function workspaceTypes(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const workspaceTypes = [
		{ name: 'All Workspaces', value: -1 },
		{ name: 'Team Workspaces', value: 1 },
		{ name: 'Management Workspaces', value: 2 },
	];

  return {
    results: workspaceTypes,
  };
}

export async function workspaceArchiveTypes(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const workspaceArchiveTypes = [
		{ name: 'All', value: -1 },
		{ name: 'Non-Archived', value: 0 },
		{ name: 'Archived', value: 1 },
	];

  return {
    results: workspaceArchiveTypes,
  };
}

export async function archiveTypes(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {
	const archiveTypes = [
		{ name: 'No', value: 0 },
		{ name: 'Yes', value: 1 },
	];

  return {
    results: archiveTypes,
  };
}

export async function getTags(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    '/tags',
  );

  const tags = response.data?.data;

  // Apply filter if provided
  const filtered = filter
    ? tags.filter((tag: { label: string; }) =>
        (tag.label as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : tags;

	const result = filtered
		.map((tag: { tag_id: number; label: string }) => ({
			name: tag.label,
			value: tag.tag_id,
		}))
		.sort((a: { name: string; }, b: { name: any; }) => a.name.localeCompare(b.name));

  return {
    results: result,
  };
}

export async function getStickers(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string,): Promise<INodeListSearchResult> {

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    '/stickers',
  );

  const stickers = response.data?.data;

  // Apply filter if provided
  const filtered = filter
    ? stickers.filter((sticker: { label: string; }) =>
        (sticker.label as string).toLowerCase().includes(filter.toLowerCase()),
      )
    : stickers;

	const result = filtered
		.map((sticker: { sticker_id: number; label: string }) => ({
			name: sticker.label,
			value: sticker.sticker_id,
		}))
		.sort((a: { name: string; }, b: { name: any; }) => a.name.localeCompare(b.name));

  return {
    results: result,
  };
}
