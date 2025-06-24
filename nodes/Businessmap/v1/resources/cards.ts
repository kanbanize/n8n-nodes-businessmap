import type {
	IDataObject,
	ResourceMapperValue,
	ResourceMapperField,
	INodeProperties
} from 'n8n-workflow';
import { NodeOperationError, } from 'n8n-workflow';
import { IResourceHandler } from '../types';

import { businessmapApiRequest } from '../transport';
import { formatCardOutput } from '../helpers/utils';

export const cardsOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['cards'],
      },
    },
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
    options: [
      {
        name: 'Link',
        value: 'link',
				description: 'Link a card',
        action: 'Link card',
      },
      {
        name: 'Unlink',
        value: 'unlink',
				description: 'Unlink a card',
        action: 'Unlink card',
      },
      {
        name: 'Set Custom Fields',
        value: 'setCustomFields',
				description: 'Set card custom fields',
        action: 'Set card custom fields',
      },
      {
        name: 'Block',
        value: 'block',
				description: 'Block a card',
        action: 'Block card',
      },
      {
        name: 'Unblock',
        value: 'unblock',
				description: 'Unblock a card',
        action: 'Unblock card',
      },
      {
        name: 'Archive',
        value: 'archive',
				description: 'Archive a card',
        action: 'Archive card',
      },
      {
        name: 'Unarchive',
        value: 'unarchive',
				description: 'Unarchive a card',
        action: 'Unarchive card',
      },
      {
        name: 'Discard',
        value: 'discard',
				description: 'Discard a card',
        action: 'Discard card',
      },
      {
        name: 'Restore',
        value: 'restore',
				description: 'Restore a Card',
        action: 'Restore card',
      },
      {
        name: 'Add Comment',
        value: 'comment',
				description: 'Add Comment to a Card',
        action: 'Add comment to a card',
      },
      {
        name: 'Create Subtask',
        value: 'subtask',
				description: 'Add Subtask to a Card',
        action: 'Add subtask to a card',
      },
      {
        name: 'Log Time',
        value: 'logtime',
				description: 'Log time to a Card',
        action: 'Log time to a card',
      },
    ],
    default: 'block',
  },
];

export const cardsFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /* card:unblock, archive, unarchive, discard, restore, link, comment, subtask, logtime, setCustomFields */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Card ID',
    name: 'card_id',
    type: 'number',
		default: 0,
    required: true,
		placeholder: 'Enter Card ID',
		description: 'If board is required on the selected action, make sure that card is from the selected board',
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['unblock', 'archive', 'unarchive', 'discard', 'restore', 'link', 'comment', 'subtask', 'logtime', 'setCustomFields'],
      },
    },
  },
  /* -------------------------------------------------------------------------- */
  /*                                 card:block                                 */
  /* -------------------------------------------------------------------------- */
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
				resource: ['cards'],
				operation: ['block', 'subtask', 'setCustomFields'],
			},
		},
	},
	{
		displayName: 'Block Reason Name or ID',
		name: 'reason_id',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		description: 'Select a block reason by ID, pick from the list, or click the AI button to choose one',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchBlockReasons',
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'Block Reason ID',
				name: 'id',
				type: 'string',
				hint: 'Enter the block Reason ID (or ⭐ to have AI pick one)',
				placeholder: '456',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9]+$',
							errorMessage: 'Block Reason ID must be numeric',
						},
					},
				],
				url: '={{ `https://${$credentials.subdomain}.businessmap.io/boards/${$parameters.board_id}/blockReasons/${$value}` }}',
			},
		],
		displayOptions: {
			show: {
        resource: ['cards'],
        operation: ['block'],
			},
		},
	},
  {
    displayName: 'Card ID',
    name: 'card_id',
    type: 'number',
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['block'],
      },
    },
  },
  {
    displayName: 'Comment',
    name: 'comment',
    type: 'string',
    default: '',
		required: true,
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['block'],
      },
    },
  },
  /* -------------------------------------------------------------------------- */
  /*                                 card:link                                  */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Will Be Linked As',
    name: 'link_type',
    type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: 'Child',
				value: 'parents',
			},
			{
				name: 'Parent',
				value: 'children',
			},
			{
				name: 'Relative',
				value: 'relatives',
			},
			{
				name: 'Predecessor',
				value: 'successors',
			},
			{
				name: 'Successor',
				value: 'predecessors',
			},
		],
    default: 'relatives',
    required: true,
		placeholder: 'Select Link Type',
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['link'],
      },
    },
  },
  {
    displayName: 'To Card ID',
    name: 'linked_card_id',
    type: 'number',
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['link'],
      },
    },
  },
  /* -------------------------------------------------------------------------- */
  /*                                 card:unlink                                */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Unlink Card ID',
    name: 'card_id',
    type: 'number',
		default: 0,
    required: true,
		placeholder: 'Enter Card ID',
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['unlink'],
      },
    },
  },
  {
    displayName: 'Linked As',
    name: 'link_type',
    type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: 'Child',
				value: 'parents',
			},
			{
				name: 'Parent',
				value: 'children',
			},
			{
				name: 'Relative',
				value: 'relatives',
			},
			{
				name: 'Predecessor',
				value: 'successors',
			},
			{
				name: 'Successor',
				value: 'predecessors',
			},
		],
    default: 'relatives',
    required: true,
		placeholder: 'Select Link Type',
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['unlink'],
      },
    },
  },
  {
    displayName: 'From Card ID',
    name: 'linked_card_id',
    type: 'number',
    default: '',
    required: true,
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['unlink'],
      },
    },
  },
  /* -------------------------------------------------------------------------- */
  /*																	card: comment     								        */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Comment',
    name: 'text',
    type: 'string',
		typeOptions: {
			rows: 4,
		},
    default: '',
		required: true,
		placeholder: 'Enter card comment as text or HTML',
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['comment'],
      },
    },
  },
  /* -------------------------------------------------------------------------- */
  /*																	card: subtask     								        */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Description',
    name: 'text',
    type: 'string',
		typeOptions: {
			rows: 4,
		},
    default: '',
		required: true,
		placeholder: 'Enter card comment as text or HTML',
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['subtask'],
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
				resource: ['cards'],
				operation: ['subtask'],
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
				resource: ['cards'],
				operation: ['subtask'],
			},
		},
	},
  {
    displayName: 'Subtask Status',
    name: 'is_finished',
    type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: 'Not Completed',
				value: '0',
			},
			{
				name: 'Completed',
				value: '1',
			},
		],
    default: '0',
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['subtask'],
      },
    },
  },
  /* -------------------------------------------------------------------------- */
  /*																	card: logtime     								        */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Time Unit',
    name: 'time_unit',
    type: 'options',
		options: [
			{
				name: 'Minutes',
				value: 'minutes',
			},
			{
				name: 'Hours',
				value: 'hours',
			},
			{
				name: 'Days',
				value: 'days',
			},
		],
    default: 'hours',
    required: true,
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['logtime'],
      },
    },
  },
  {
    displayName: 'Duration',
    name: 'duration',
    type: 'number',
    default: 0,
		required: true,
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['logtime'],
      },
    },
  },
	{
		displayName: 'Date',
		name: 'date',
		type: 'dateTime',
		typeOptions: {
			enableTime: false,
			dateFormat: 'yyyy-MM-dd',
		},
		default: '={{ new Date().toISOString().substring(0,10) }}',
		required: true,
		displayOptions: {
			show: {
				resource: ['cards'],
				operation: ['logtime'],
			},
		},
	},
  {
    displayName: 'Comment',
    name: 'comment',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['cards'],
        operation: ['logtime'],
      },
    },
  },
	/* -------------------------------------------------------------------------- */
  /*	 	  				  						card: setCustomFields			       		        */
  /* -------------------------------------------------------------------------- */
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
				resource: ['cards'],
				operation: ['setCustomFields'],
			},
			hide: {
				board_id: [''],
			}
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
        resource: ['cards'],
				operation: ['block', 'unblock', 'archive', 'unarchive', 'discard', 'restore', 'setCustomFields'],
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
        resource: ['cards'],
				operation: ['block', 'unblock', 'archive', 'unarchive', 'discard', 'restore', 'setCustomFields'],
				output: ['selected'],
      },
    },
  },
];


export const cardHandlers: IResourceHandler = {
  link: async function (this, itemIndex) {
    let cardId = this.getNodeParameter('card_id', itemIndex) as number;
    const linkType = this.getNodeParameter('link_type', itemIndex) as string;
		let linkedCardId = this.getNodeParameter('linked_card_id', itemIndex) as number;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

		linkedCardId = Number(linkedCardId);
		if (Number.isNaN(linkedCardId) || linkedCardId === 0) {
			throw new NodeOperationError(this.getNode(), `Linked Card ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'PUT',
      `/cards/${cardId}/${linkType}/${linkedCardId}`,
    );

		return { status: response.statusCode };
  },

  unlink: async function (this, itemIndex) {
    let cardId = this.getNodeParameter('card_id', itemIndex) as number;
    const linkType = this.getNodeParameter('link_type', itemIndex) as string;
		let linkedCardId = this.getNodeParameter('linked_card_id', itemIndex) as number;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Unlink Card ID must be a positive number`, {level: 'warning',});
		}

		linkedCardId = Number(linkedCardId);
		if (Number.isNaN(linkedCardId) || linkedCardId === 0) {
			throw new NodeOperationError(this.getNode(), `Linked Card ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'DELETE',
      `/cards/${cardId}/${linkType}/${linkedCardId}`,
    );

		return { status: response.statusCode };
  },

  block: async function (this, itemIndex) {
    let cardId = this.getNodeParameter('card_id', itemIndex) as number;
		const reason = this.getNodeParameter('reason_id', itemIndex) as { value: number };
		const reasonId = reason?.value;
		const comment = this.getNodeParameter('comment', itemIndex) as string;
		const blockReason = { reason_id: reasonId, comment: comment}

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'PATCH',
      `/cards/${cardId}`,
      { block_reason: blockReason },
    );

		const items = response.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, items, itemIndex);
		}

		if (Array.isArray(items) && items.length === 0) {
			// nothing to be updated
			return { status: 'Card already blocked' };
		}

		// return error if card was not blocked
		return {status: 'Unable to block card', details: response.data};

  },

  unblock: async function (this, itemIndex) {
    let cardId = this.getNodeParameter('card_id', itemIndex) as number;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'PATCH',
      `/cards/${cardId}`,
      { block_reason: null },
    );

		const items = response.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, items, itemIndex);
		}

		if (Array.isArray(items) && items.length === 0) {
			// nothing to be updated
			return { status: 'Card is not blocked' };
		}

		// return error if card was not unblocked
		return {status: 'Unable to unblock card', details: response.data};
  },

  archive: async function (this, itemIndex) {
    let cardId = this.getNodeParameter('card_id', itemIndex) as number;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'PATCH',
      `/cards/${cardId}`,
      { is_archived: 1 },
    );

		const items = response.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, items, itemIndex);
		}

		if (Array.isArray(items) && items.length === 0) {
			// nothing to be updated
			return { status: 'Card already archived' };
		}

		// return error if card was not archived
		return {status: 'Unable to move card to archive.', details: response.data};
  },

  unarchive: async function (this, itemIndex) {
    let cardId = this.getNodeParameter('card_id', itemIndex) as number;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'PATCH',
      `/cards/${cardId}`,
      { is_archived: 0 },
    );

		const items = response.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, items, itemIndex);
		}

		if (Array.isArray(items) && items.length === 0) {
			// nothing to be updated
			return { status: 'Card already active' };
		}

		// return error if card was not archived
		return {status: 'Unable to move card from archive', details: response.data};
  },

  discard: async function (this, itemIndex) {
    let cardId = this.getNodeParameter('card_id', itemIndex) as number;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'PATCH',
      `/cards/${cardId}`,
      { is_discarded: 1 },
    );

		const items = response.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, items, itemIndex);
		}

		if (Array.isArray(items) && items.length === 0) {
			return { status: 'Card already discarded' };
		}

		return {status: 'Unable to discard card', details: response.data};
  },

  restore: async function (this, itemIndex) {
    let cardId = this.getNodeParameter('card_id', itemIndex) as number;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'PATCH',
      `/cards/${cardId}`,
      { is_discarded: 0 },
    );

		const items = response.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, items, itemIndex);
		}

		if (Array.isArray(items) && items.length === 0) {
			return { status: 'Card is already active' };
		}

		return {status: 'Unable to restore card', details: response.data};
  },

  comment: async function (this, itemIndex) {
    let cardId = this.getNodeParameter('card_id', itemIndex) as number;
		const comment = this.getNodeParameter('text', itemIndex) as string;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'POST',
      `/cards/${cardId}/comments`,
      { text: comment.replace(/\r?\n/g, '<br>') },
    );

		return response.data;
  },

  subtask: async function (this, itemIndex) {
    let cardId = this.getNodeParameter('card_id', itemIndex) as number;
		const description = this.getNodeParameter('text', itemIndex) as string;
		const deadline = this.getNodeParameter('deadline', itemIndex) as string;
		const isFinished = this.getNodeParameter('is_finished', itemIndex)  as number;
		const owner = this.getNodeParameter('owner_id', itemIndex) as { value: string };
		const ownerId = owner?.value;

		const body: IDataObject = {};

		if (description) body.description   = description.replace(/\r?\n/g, '<br>');
		if (deadline)    body.deadline      = deadline + 'Z';
		if (ownerId)     body.owner_user_id = ownerId;
		if (isFinished)  body.is_finished   = isFinished;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

    const response = await businessmapApiRequest.call(
      this,
      'POST',
      `/cards/${cardId}/subtasks`,
      body,
    );

		return response.data;
  },

  logtime: async function (this, itemIndex) {
    let cardId   = this.getNodeParameter('card_id', itemIndex)   as number;
		const timeUnit = this.getNodeParameter('time_unit', itemIndex) as string;
		let duration = this.getNodeParameter('duration', itemIndex)  as number;
		const date 		 = this.getNodeParameter('date', itemIndex)  		 as string;
		const comment  = this.getNodeParameter('comment', itemIndex)   as string;

		const logDate = new Date(date);
		// Check if the logdate is a valid date
		if (isNaN(logDate.getTime())) {
				throw new Error('Invalid deadline format. Deadline must be a valid date.');
		}

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

		duration = Number(duration);
		if (Number.isNaN(duration) || duration === 0) {
			throw new NodeOperationError(this.getNode(), `Duration must be bigger than 0`, {level: 'warning',});
		}

    // 3) Convert to seconds
    let seconds: number;
    switch (timeUnit) {
      case 'minutes':
        seconds = duration * 60;
        break;
      case 'hours':
        seconds = duration * 3600;
        break;
      case 'days':
        seconds = duration * 8 * 3600;  // 1 day = 8 hours
        break;
      default:
				throw new NodeOperationError(this.getNode(), `Unsupported time unit: ${timeUnit}`, {level: 'warning',});
    }

    // 4) Build request body
    const body: IDataObject = {
			card_id: cardId,
      time: seconds,
      date: logDate.toISOString().slice(0, 10),
    };
    if (comment) {
      body.comment = comment;
    }

    const response = await businessmapApiRequest.call(
      this,
      'POST',
      `/loggedTime`,
      body,
    );

		return response.data;
  },

  setCustomFields: async function (this, itemIndex) {
    let cardId  = this.getNodeParameter('card_id', itemIndex)  as number;

		cardId = Number(cardId);
		if (Number.isNaN(cardId) || cardId === 0) {
			throw new NodeOperationError(this.getNode(), `Card ID must be a positive number`, {level: 'warning',});
		}

		const body: IDataObject = {};
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

		const response = await businessmapApiRequest.call(
			this,
			'PATCH',
			`/cards/${cardId}`,
			body,
		);

		const items = response.data?.data;
		if (Array.isArray(items) && items.length > 0) {
			return formatCardOutput.call(this, items, itemIndex);
		}

		if (Array.isArray(items) && items.length === 0) {
			return { status: 'No update applied — request contained no changes.' };
		}

		return {status: 'Card not updated', details: response.data};
  },
};
