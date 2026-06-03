/**
 * @module listSearch
 * n8n `listSearch` handler functions for resource-locator fields.
 * Each function fetches data from the Businessmap REST API and returns
 * a searchable option list. Optional client-side text filtering is applied
 * after the API response is received.
 */

import type {
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeListSearchResult,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { businessmapApiRequest } from '../transport';
import { GetBoardDependentItemsParams, getBoardDependentItems, checkApiResponse } from '../helpers/utils';

/**
 * Returns all non-archived workspaces as searchable options.
 *
 * Results are sorted alphabetically. Each option label is formatted as
 * `"WorkspaceName (workspace_id)"`.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of workspaces.
 */
export async function searchWorkspaces(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {

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

/**
 * Returns all non-archived boards as searchable options.
 *
 * Results are sorted alphabetically. Each option label is formatted as
 * `"BoardName (board_id)"`.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of boards.
 */
export async function searchBoards(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {

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

/**
 * Returns enabled workflows for the selected board as searchable options.
 *
 * Reads `board_id` from the node parameters. Workflows with `is_enabled === 0`
 * are excluded from the results.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of enabled workflows.
 * @throws {NodeOperationError} At `warning` level when `board_id` is not set.
 */
export async function searchWorkflows(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
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

/**
 * Returns columns for the selected board and workflow as searchable options.
 *
 * Reads `board_id` from node parameters. For the `update` operation, `workflow_id`
 * is resolved from `cardPositionFields.workflow_id.__rl` (a nested resource-locator
 * field); for all other operations it is read from the top-level `workflow_id`
 * parameter. Results are filtered client-side to columns belonging to the resolved
 * workflow.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of columns for the workflow.
 * @throws {NodeOperationError} At `warning` level when `board_id` or `workflow_id` is not set.
 */
export async function searchColumns(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
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

/**
 * Returns lanes for the selected board and workflow as searchable options.
 *
 * Mirrors the `searchColumns` resolution logic: for the `update` operation,
 * `workflow_id` is read from `cardPositionFields.workflow_id.__rl`; for all
 * other operations it is read from the top-level `workflow_id` parameter.
 * Results are filtered client-side to lanes belonging to the resolved workflow.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of lanes for the workflow.
 * @throws {NodeOperationError} At `warning` level when `board_id` or `workflow_id` is not set.
 */
export async function searchLanes(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
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

/**
 * Returns users assigned to the selected board as searchable options.
 *
 * Delegates to `getBoardDependentItems`, which performs a two-step fetch:
 * first retrieves board user-role IDs, then resolves full user objects via
 * `/users`. Requires `board_id` to be set.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of board users.
 */
export async function searchUsers(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
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

/**
 * Returns tags assigned to the selected board as searchable options.
 *
 * Delegates to `getBoardDependentItems`, which fetches board-scoped tag IDs
 * then resolves full tag objects via `/tags`. Requires `board_id` to be set.
 * For account-wide tags, use `getTags` instead.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of board-scoped tags.
 */
export async function searchTags(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
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

/**
 * Returns stickers assigned to the selected board as searchable options.
 *
 * Delegates to `getBoardDependentItems`, which fetches board-scoped sticker IDs
 * then resolves full sticker objects via `/stickers`. Requires `board_id` to be
 * set. For account-wide stickers, use `getStickers` instead.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of board-scoped stickers.
 */
export async function searchStickers(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
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

/**
 * Returns card types available on the selected board as searchable options.
 *
 * Delegates to `getBoardDependentItems`, which fetches board-scoped card type IDs
 * then resolves full card type objects via `/cardTypes`. Requires `board_id` to
 * be set.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of card types for the board.
 */
export async function searchTypes(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
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

/**
 * Returns card templates available on the selected board as searchable options.
 *
 * Delegates to `getBoardDependentItems`, which fetches board-scoped template IDs
 * then resolves full card template objects via `/cardTemplates`. Requires
 * `board_id` to be set.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of card templates for the board.
 */
export async function searchTemplates(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
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

/**
 * Returns block reasons available on the selected board as searchable options.
 *
 * Delegates to `getBoardDependentItems`, which fetches board-scoped block reason
 * IDs then resolves full block reason objects via `/blockReasons`. Requires
 * `board_id` to be set.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of block reasons for the board.
 */
export async function searchBlockReasons(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
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

/**
 * Returns a static list of workspace type options.
 *
 * No API call is made. Options: All Workspaces (-1), Team Workspaces (1),
 * Management Workspaces (2).
 *
 * @param this            - n8n load-options context.
 * @param filter          - Accepted to satisfy the interface; not used (list is static).
 * @param _paginationToken - Accepted to satisfy the interface; not used (list is static).
 * @returns Static option list of workspace types.
 */
export async function workspaceTypes(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
	const workspaceTypes = [
		{ name: 'All Workspaces', value: -1 },
		{ name: 'Team Workspaces', value: 1 },
		{ name: 'Management Workspaces', value: 2 },
	];

  return {
    results: workspaceTypes,
  };
}

/**
 * Returns a static list of workspace archive-state filter options.
 *
 * No API call is made. Options: All (-1), Non-Archived (0), Archived (1).
 *
 * @param this            - n8n load-options context.
 * @param filter          - Accepted to satisfy the interface; not used (list is static).
 * @param _paginationToken - Accepted to satisfy the interface; not used (list is static).
 * @returns Static option list of workspace archive states.
 */
export async function workspaceArchiveTypes(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
	const workspaceArchiveTypes = [
		{ name: 'All', value: -1 },
		{ name: 'Non-Archived', value: 0 },
		{ name: 'Archived', value: 1 },
	];

  return {
    results: workspaceArchiveTypes,
  };
}

/**
 * Returns a static list of archive-state options for cards or boards.
 *
 * No API call is made. Options: No (0), Yes (1).
 *
 * @param this            - n8n load-options context.
 * @param filter          - Accepted to satisfy the interface; not used (list is static).
 * @param _paginationToken - Accepted to satisfy the interface; not used (list is static).
 * @returns Static option list of archive states.
 */
export async function archiveTypes(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {
	const archiveTypes = [
		{ name: 'No', value: 0 },
		{ name: 'Yes', value: 1 },
	];

  return {
    results: archiveTypes,
  };
}

/**
 * Returns a static list of card state options.
 *
 * No API call is made. Options: Active, Archived, Discarded.
 *
 * @param this              - n8n load-options context.
 * @param _filter           - Accepted to satisfy the interface; not used (list is static).
 * @param _paginationToken  - Accepted to satisfy the interface; not used (list is static).
 * @returns Static option list of card states.
 */
export async function cardStateTypes(this: ILoadOptionsFunctions, _filter?: string, __paginationToken?: string,): Promise<INodeListSearchResult> {
	const cardStateTypes = [
		{ name: 'Active', value: 'active' },
		{ name: 'Archived', value: 'archived' },
		{ name: 'Discarded', value: 'discarded' },
	];

	return {
		results: cardStateTypes,
	};
}

/**
 * Returns all tags across the account as searchable options.
 *
 * Unlike `searchTags`, this function is not scoped to a board — it fetches
 * every tag in the account via `GET /tags`. Results are filtered client-side
 * then sorted alphabetically by label.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of all account tags, sorted alphabetically.
 */
export async function getTags(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {

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

/**
 * Returns all stickers across the account as searchable options.
 *
 * Unlike `searchStickers`, this function is not scoped to a board — it fetches
 * every sticker in the account via `GET /stickers`. Results are filtered
 * client-side then sorted alphabetically by label.
 *
 * @param this            - n8n load-options context.
 * @param filter          - Optional case-insensitive substring filter applied client-side.
 * @param _paginationToken - Accepted to satisfy the interface; not used (API does not paginate).
 * @returns Searchable option list of all account stickers, sorted alphabetically.
 */
export async function getStickers(this: ILoadOptionsFunctions, filter?: string, _paginationToken?: string,): Promise<INodeListSearchResult> {

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
