import type { ILoadOptionsFunctions, INodePropertyOptions, INode, IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { businessmapApiRequest } from '../transport';

export const untilBoardSelected = { boardName: [''] }

export interface GetBoardDependentItemsParams {
  boardEndpoint: string;
  item: string;
  idField: string;
  endpoint: string;
  idsParamName: string;
  returnLabel: string;
}

export function checkApiResponse(node: INode, response: any, items: any, item: string) {
	  if (!Array.isArray(items)) {
    throw new NodeApiError(node, {
      message: `Unexpected format when loading ${item}`,
      description: response.rawBody,
      response: response,
    });
  }
}

export async function getBoardDependentItems(this: ILoadOptionsFunctions, params: GetBoardDependentItemsParams, selectedBoardId?: number, ): Promise<INodePropertyOptions[]> {
	const boardId = selectedBoardId ?? (this.getNodeParameter('board_id', '') as number);
  const {
    boardEndpoint,
    item,
    idField,
    endpoint,
    idsParamName,
    returnLabel,
  } = params;

  // If the user hasn’t picked a board yet, return an empty list
  if (!boardId) {
		throw new NodeOperationError(
			this.getNode(),
			`Please select a board above to load ${item}.`,
			{ level: 'warning' },
		)
  }

  // 2) fetch the list of reason IDs for this board
  const idResponse = await businessmapApiRequest.call(
    this,
    'GET',
    `/boards/${boardId}/${boardEndpoint}`,
  );

  const idData = idResponse.data?.data;
	checkApiResponse(this.getNode(), idResponse, idData, item);

  // 3) build comma-separated list
	const itemIds = idData.map((i: Record<string, any>) => i[idField]).join(',');

  if (!itemIds) {
    return [];
  }

  // 4) fetch full reason objects
  const fullResponse = await businessmapApiRequest.call(
    this,
    'GET',
    `${endpoint}`,
    undefined,
    { [idsParamName]: itemIds },
  );

  const items = fullResponse.data?.data;
	checkApiResponse(this.getNode(), fullResponse, items, "full "+item);

	return items
		.sort((a: { [x: string]: string; }, b: { [x: string]: any; }) => a[returnLabel].localeCompare(b[returnLabel]))
		.map((i: Record<string, any>) => ({
			name:  i[returnLabel],
			value: i[idField],
		}));
}

export function formatCardOutput(this: IExecuteFunctions, rawData: any, itemIndex: number ): Array<Record<string, any>> {

  const output = this.getNodeParameter('output', itemIndex) as 'simplified' | 'raw' | 'selected';

  const outputFields =
    output === 'selected'
      ? (this.getNodeParameter('output_fields', itemIndex) as string[])
      : [];

  let cards: Array<Record<string, any>> = [];

  if (
    typeof rawData === 'object' &&
    !Array.isArray(rawData) &&
    rawData?.data?.data &&
    Array.isArray(rawData.data.data)
  ) {
    cards = rawData.data.data;
  } else if (Array.isArray(rawData)) {
    cards = rawData;
  } else {
    throw new Error('Invalid response format: expected array or paginated object');
  }

  return cards.map(card => {
    if (output === 'raw') {
      return card;
    }

    if (output === 'simplified') {
      return {
        card_id: card.card_id,
        custom_id: card.custom_id,
				board_id: card.board_id,
				column_id: card.column_id,
				lane_id: card.lane_id,
				title: card.title,
      };
    }

    if (output === 'selected') {
      const selected: Record<string, any> = {};
      for (const field of outputFields) {
        if (field in card) {
          selected[field] = card[field];
        }
      }
      return selected;
    }

    return {};
  });
}

export function getSelectedFields(
  this: IExecuteFunctions,
  itemIndex: number,
): { fields: string; expand: string } {
  const output = this.getNodeParameter('output', itemIndex) as 'simplified' | 'raw' | 'selected';

  if (output !== 'selected') {
		return { fields: '', expand: '' };
  }

  const outputFields = this.getNodeParameter('output_fields', itemIndex) as string[];

  // Reference arrays
  const fieldList = [
		"card_id",
		"title",
		"description",
		"custom_id",
		"owner_user_id",
		"type_id",
		"size",
		"priority",
		"color",
		"deadline",
		"reporter",
		"created_at",
		"revision",
		"last_modified",
		"in_current_position_since",
		"board_id",
		"workflow_id",
		"column_id",
		"lane_id",
		"section",
		"position",
		"last_column_id",
		"last_lane_id",
		"version_id",
		"archived_at",
		"reason_id",
		"discard_comment",
		"discarded_at",
		"is_blocked",
		"block_reason",
		"current_block_time",
		"current_logged_time",
		"current_cycle_time",
		"child_card_stats",
		"finished_subtask_count",
		"unfinished_subtask_count",
		"comment_count",
		"first_request_time",
		"first_start_time",
		"first_end_time",
		"last_request_time",
		"last_start_time",
		"last_end_time"
	];

  const expandList = [
		'custom_fields',
		'stickers',
		'tag_ids',
		'co_owner_ids',
		'watcher_ids',
		'attachments',
		'checked_column_checklist_items',
		'initiative_details',
		'annotations',
		'subtasks',
		'linked_cards',
		'transitions',
		'block_times',
		'logged_times',
		'logged_times_for_child_cards'
  ];

  const selectedFields = outputFields.filter(field => fieldList.includes(field));
  const selectedExpand = outputFields.filter(field => expandList.includes(field));

  return {
    fields: selectedFields.join(','),
    expand: selectedExpand.join(','),
  };
}

