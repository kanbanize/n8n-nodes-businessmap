import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { businessmapApiRequest } from '../transport';
import { GetBoardDependentItemsParams, getBoardDependentItems, checkApiResponse } from '../helpers/utils';

export async function getWorkspaces(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    '/workspaces',
    undefined,
    { is_archived: 0 },
  );

  const workspaces = response.data?.data;
	checkApiResponse(this.getNode(), response, workspaces, 'workspaces');

  return [
		{ name: '- Select -', value: '' },
		...workspaces.map((ws: { workspace_id: number; name: string }) => ({
    name: `${ws.name} (${ws.workspace_id})`,
    value: ws.workspace_id,
  }))]
}

export async function getWorkspaceBoards(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const workspaceId = this.getNodeParameter('workspace_id', '') as number;

  // If the user hasn’t picked a workspace yet, return an empty list
  if (!workspaceId) {
    return [];
  }

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    '/boards',
		undefined,
    { workspace_ids: workspaceId, is_archived: 0 },
  );

  const boards = response.data?.data;
	checkApiResponse(this.getNode(), response, boards, 'boards per workspace');

  return boards.map((board: { board_id: number; name: string }) => ({
    name: `${board.name} (${board.board_id})`,
    value: board.board_id,
  }));
}

export async function getBoards(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    '/boards',
		undefined,
		{is_archived: 0}
  );

  const boards = response.data?.data;
	checkApiResponse(this.getNode(), response, boards, 'boards');

  return boards.map((board: { board_id: number; name: string }) => ({
    name: `${board.name} (${board.board_id})`,
    value: board.board_id,
  }));
}

export async function getWorkflows(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const boardId = this.getNodeParameter('board_id', '') as number;

  // If the user hasn’t picked a board yet, return an empty list
  if (!boardId) {
    return [];
  }

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    `/boards/${boardId}/workflows`,
  );

  const workflows = response.data?.data;
	checkApiResponse(this.getNode(), response, workflows, 'workflows');

  return workflows
		// Show only enabled workflows (is_enabled !== 0)
		.filter((workflow: { workflow_id: number; name: string; is_enabled: number }) => workflow.is_enabled !== 0)
		.map((workflow: { workflow_id: number; name: string }) => ({
			name: workflow.name,
			value: workflow.workflow_id,
		}));
}

export async function getLanes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const boardId = this.getNodeParameter('board_id', '') as number;

  // 1) Primary workflow_id param
  let workflowId = this.getNodeParameter('workflow_id', '') as number;

  // 2) If there’s a cardPositionFields collection, override with its workflow_id
  const cardPosFields = this.getNodeParameter('cardPositionFields', {}) as { workflow_id?: number };
  if (cardPosFields.workflow_id) {
    workflowId = cardPosFields.workflow_id;
  }

  // If the user hasn’t picked a board and workflow yet, return an empty list
  if (!boardId || !workflowId) {
    return [];
  }

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    `/boards/${boardId}/lanes`,
  );

  const lanes = response.data?.data;
	checkApiResponse(this.getNode(), response, lanes, 'lanes');

  return lanes
		// Show only lanes for the selected workflow
		.filter((lane: { lane_id: number; name: string; workflow_id: number }) => lane.workflow_id === workflowId)
		.map((lane: { lane_id: number; name: string }) => ({
			name: lane.name,
			value: lane.lane_id,
		}));
}

export async function getColumns(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const boardId = this.getNodeParameter('board_id', '') as number;

  // 1) Primary workflow_id param
  let workflowId = this.getNodeParameter('workflow_id', '') as number;

  // 2) If there’s a cardPositionFields collection, override with its workflow_id
  const cardPosFields = this.getNodeParameter('cardPositionFields', {}) as { workflow_id?: number };
  if (cardPosFields.workflow_id) {
    workflowId = cardPosFields.workflow_id;
  }

  // 3) If we still don’t have both, nothing to load
  if (!boardId || !workflowId) {
    return [];
  }

  // 4) Fetch all columns for the board
  const response = await businessmapApiRequest.call(
    this,
    'GET',
    `/boards/${boardId}/columns`,
  );

  const columns = response.data?.data;
	checkApiResponse(this.getNode(), response, columns, 'columns');

  return columns
		// Show only columns for the selected workflow
		.filter((column: { column_id: number; name: string; workflow_id: number }) => column.workflow_id === workflowId)
		// Sort by the column name, ascending
		.sort((a: { name: string; }, b: { name: any; }) => a.name.localeCompare(b.name))
		.map((column: { column_id: number; name: string }) => ({
			name: column.name,
			value: column.column_id,
		}));
}

export async function geUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    '/users',
  );

  const users = response.data?.data;
	checkApiResponse(this.getNode(), response, users, 'users');

  return users.map((user: { user_id: number; username: string }) => ({
    name: user.username,
    value: user.user_id,
  }));
}

export async function getBoardBlockReasons(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'blockReasons',
    item: 'Block Reasons',
    idField: 'reason_id',
    endpoint: '/blockReasons',
    idsParamName: 'reason_ids',
    returnLabel: 'label',
  };

	return await getBoardDependentItems.call(this, params);
}

export async function getBoardUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'userRoles',
    item: 'Users',
    idField: 'user_id',
    endpoint: '/users',
    idsParamName: 'user_ids',
    returnLabel: 'username',
  };

	const users = await getBoardDependentItems.call(this, params);

  return [
    { name: 'Select User', value: '' },
    ...users,
  ];
}

export async function getBoardTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'cardTemplates',
    item: 'Card Templates',
    idField: 'template_id',
    endpoint: '/cardTemplates',
    idsParamName: 'template_ids',
    returnLabel: 'name',
  };

	return await getBoardDependentItems.call(this, params);
}

export async function getBoardTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'cardTypes',
    item: 'Card Types',
    idField: 'type_id',
    endpoint: '/cardTypes',
    idsParamName: 'type_ids',
    returnLabel: 'name',
  };

	return await getBoardDependentItems.call(this, params);
}

export async function getBoardStickers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'stickers',
    item: 'Stickers',
    idField: 'sticker_id',
    endpoint: '/stickers',
    idsParamName: 'sticker_ids',
    returnLabel: 'label',
  };

	return await getBoardDependentItems.call(this, params);
}

export async function getBoardTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'tags',
    item: 'Tags',
    idField: 'tag_id',
    endpoint: '/tags',
    idsParamName: 'tag_ids',
    returnLabel: 'label',
  };

	return await getBoardDependentItems.call(this, params);
}

export async function getBoardFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const params: GetBoardDependentItemsParams = {
    boardEndpoint: 'customFields',
    item: 'Custom Fields',
    idField: 'field_id',
    endpoint: '/customFields',
    idsParamName: 'field_ids',
    returnLabel: 'name',
  };

	return await getBoardDependentItems.call(this, params);
}

export async function getAttachments(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {

  const cardId = this.getNodeParameter('card_id', '') as number;
  // If the user hasn’t picked a card yet, return an empty list
  if (!cardId) {
    return [];
  }

  const response = await businessmapApiRequest.call(
    this,
    'GET',
    `/cards/${cardId}/attachments`,
  );

  const attachments = response.data?.data;
	checkApiResponse(this.getNode(), response, attachments, 'attachments');

  return attachments.map((attachment: { file_name: string; id: number }) => ({
    name: attachment.file_name,
    value: attachment.id,
  }));
}
