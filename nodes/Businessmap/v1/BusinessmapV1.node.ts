import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { resourceOperations, resourceFields } from './ResourceDescriptions';
import { resourceHandlers } from './ResourceHandler';
import { listSearch, loadOptions, resourceMapping } from './methods';

export class BusinessmapV1 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Businessmap',
		name: 'businessmap',
		icon: 'file:../businessmap.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Use Businessmap API v2',
		defaults: {
			name: 'Businessmap',
		},
		usableAsTool: true,
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'businessmapApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{
						name: 'Main Card',
						value: 'mainCard',
						action: 'main card actions',
						description: 'Main actions - create, update, move, get'
					},
					{
						name: 'Card',
						value: 'cards',
						action: 'additional card actions',
						description: 'All other card actions'
					},
					{
						name: 'Attachment',
						value: 'attachments',
						description: 'Card attachments actions'
					},
					{
						name: 'Workspace',
						value: 'workspaces',
						description: 'All workspace related actions'
					},
					{
						name: 'Board',
						value: 'boards',
						description: 'All boards related actions'
					},
					{
						name: 'Tag',
						value: 'tags',
						description: 'All tag related actions'
					},
					{
						name: 'Sticker',
						value: 'stickers',
						description: 'All sticker related actions'
					},
				],
				default: 'mainCard',
			},
			...resourceOperations,
			...resourceFields,
		],
	};

	methods = {
		listSearch,
		loadOptions,
		resourceMapping,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const length = items.length;

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < length; i++) {
        try {
            // Get the appropriate handler for the resource and operation
            const handler = resourceHandlers[resource]?.[operation];

            if (!handler) {
                throw new NodeApiError(
                    this.getNode(),
                    {},
                    {
                        message: `Operation "${operation}" for resource "${resource}" is not supported`,
                        description: 'Check that the resource and operation combination exists',
                        httpCode: '400',
                    }
                );
            }

            // Execute the handler
            const responseData = await handler.call(this, i);

            const executionData = this.helpers.constructExecutionMetaData(
                this.helpers.returnJsonArray(responseData as IDataObject[]),
                { itemData: { item: i } },
            );
            returnData.push(...executionData);
        } catch (error) {
            if (this.continueOnFail()) {
                const executionErrorData = this.helpers.constructExecutionMetaData(
                    this.helpers.returnJsonArray({ error: error.message }),
                    { itemData: { item: i } },
                );
                returnData.push(...executionErrorData);
                continue;
            }

            if (error instanceof NodeApiError) {
                throw error;
            }
            throw new NodeApiError(this.getNode(), error);
        }
    }

    return this.prepareOutputData(returnData);
	}
}
