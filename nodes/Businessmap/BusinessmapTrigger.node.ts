import type {
	IDataObject,
	JsonObject,
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionType, NodeApiError, } from 'n8n-workflow';

import { businessmapApiRequest } from './v1/transport';
import { loadOptions } from './v1/methods';

interface BusinessmapWebhook {
	webhook_id: number;
	url: string;
	board_id: number;
	is_enabled: number;
	secret?: string;
};

export class BusinessmapTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Businessmap Trigger',
		name: 'businessmapTrigger',
		icon: 'file:businessmap.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when Businessmap events occur',
		defaults: {
			name: 'Businessmap Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				displayName: 'Credentials to Connect to Businessmap',
				name: 'businessmapApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Board Name or ID',
				name: 'board_id',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getBoards',
				},
				options: [],
				default: '',
				required: true,
				description: 'Selected board to attach the webhook to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
      {
        displayName: 'Authenticate Incoming Webhook',
        name: 'authenticate_webhook',
        type: 'boolean',
        default: true,
        description: 'Whether authentication should be activated for incoming webhooks',
      },
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				/* eslint-disable n8n-nodes-base/node-param-multi-options-type-unsorted-items */
				options: [
					{ name: 'All Events', value: 'All' },
					{ name: 'Card Created', value: 'Card Created' },
					{ name: 'Card Details Changed', value: 'Card Details Changed' },
					{ name: 'Card Discarded', value: 'Card Discarded' },
					{ name: 'Card Restored', value: 'Card Restored' },
					{ name: 'Card Moved', value: 'Card Moved' },
					{ name: 'Card Archived', value: 'Card Archived' },
					{ name: 'Card Is Unarchived', value: 'Card Is Unarchived' },
					{ name: 'Comment Created', value: 'Comment Created' },
					{ name: 'Comment Updated', value: 'Comment Updated' },
					{ name: 'Comment Deleted', value: 'Comment Deleted' },
					{ name: 'Subtask Created', value: 'Subtask Created' },
					{ name: 'Subtask Updated', value: 'Subtask Updated' },
					{ name: 'Subtask Deleted', value: 'Subtask Deleted' },
					{ name: 'Board Renamed', value: 'Board Renamed' },
					{ name: 'Board Archived', value: 'Board Archived' },
					{ name: 'Board Unarchived', value: 'Board Unarchived' },
					{ name: 'Board Deleted', value: 'Board Deleted' },
					{ name: 'Board Structure Changed', value: 'Board Structure Changed' },
				],
				/* eslint-enable n8n-nodes-base/node-param-multi-options-type-unsorted-items */
				required: true,
				default: [],
				description: 'The events to listen to',
			},
		],
	};

	methods = {
		loadOptions,
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {

				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const webhookData = this.getWorkflowStaticData('node');

				const response = await businessmapApiRequest.call(
					this,
					'GET',
					`/webhooks`,
				);

				const webhooks = response.data.data as BusinessmapWebhook[];

				for (const webhook of webhooks) {
					if (webhook.url === webhookUrl) {
						webhookData.webhookId = webhook.webhook_id;
						return true;
					}
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const boardId = this.getNodeParameter('board_id') as number;
				const authenticateWebhook = this.getNodeParameter('authenticate_webhook') as boolean;

        const body: IDataObject = {
          url: webhookUrl,
					board_id: boardId,
        };

				let response;
				try {
					response = await businessmapApiRequest.call(
						this,
						'POST',
						'/webhooks',
						body,
					);
        } catch (error) {
          throw new NodeApiError(this.getNode(), {message: `Unexpected response: ${error.description}`});
        }

				let createdWebhook: BusinessmapWebhook;
				createdWebhook = response.data.data as BusinessmapWebhook;

        const webhookData = this.getWorkflowStaticData('node') as {
          webhookId?: number;
          secret?: string;
					authenticateWebhook?: boolean;
        };

        webhookData.webhookId = createdWebhook.webhook_id;
        webhookData.secret = createdWebhook.secret;
				webhookData.authenticateWebhook = authenticateWebhook;

        return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {

        const webhookData = this.getWorkflowStaticData('node') as {
          webhookId?: number;
          secret?: string;
        };

        if (!webhookData.webhookId) {
          return false;
        }

        const webhookId = webhookData.webhookId as number;
        try {
          await businessmapApiRequest.call(
            this,
            'DELETE',
            `/webhooks/${webhookId}`,
            {}
          );
        } catch (err) {
          const error = err as any;
          if (error.response && typeof error.response.data === 'object') {
            throw new NodeApiError(this.getNode(), error.response.data as JsonObject);
          }

          throw new NodeApiError(this.getNode(), {
            message: error.message ?? 'Unknown error during webhook deletion',
          } as JsonObject);
        }

        delete webhookData.webhookId;
        delete webhookData.secret;

        return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const webhookData = this.getWorkflowStaticData('node') as {
			secret?: string;
			authenticateWebhook?: boolean;
		};

  	if (webhookData.authenticateWebhook) {
			const headers = this.getHeaderData() as Record<string, string>;
			const incomingSecret = headers['x-kanbanize-secret'];

			if (!webhookData.secret || incomingSecret !== webhookData.secret) {
				const response = this.getResponseObject();
				response.status(403).json({ message: 'Forbidden: invalid or missing secret' });
				return {
					noWebhookResponse: true,
				};
			}
		}

		const bodyData = this.getBodyData() as IDataObject;
		const incomingEvent = (bodyData.event as string) || '';

		let selectedEvents = this.getNodeParameter('events', []) as string[];
		selectedEvents = selectedEvents.map((ev) => ev.toLowerCase());

		if (selectedEvents.includes('all') || selectedEvents.includes(incomingEvent.toLowerCase())) {
			const items = this.helpers.returnJsonArray([bodyData]);
			return {
				workflowData: [items],
			};
		}

		return {
			workflowData: [[]],
		};
	}
}
