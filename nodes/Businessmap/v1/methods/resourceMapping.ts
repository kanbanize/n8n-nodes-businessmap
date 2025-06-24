import type {
	FieldType,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	ResourceMapperField,
	ResourceMapperFields,
} from 'n8n-workflow';

import { businessmapApiRequest } from '../transport';
import { checkApiResponse } from '../helpers/utils';

type BusinessmapSchema = {
	field_id: number;
  type: string;
  allowed_values?: Array<{
    value: string;
    value_id: number;
  }>;
};

type TypesMap = Partial<Record<FieldType, string[]>>;

const businessmapTypesMap: TypesMap = {
	string: ['single_line_text', 'multi_line_text', 'link'],
	number: ['number'],
	dateTime: ['date'],
	time: [],
	object: [],
	options: ['dropdown'],
	array: [],
};

const unsupportedBusinessmapTypes = [
  'contributor',
  'file',
  'vote',
  'card_picker',
  'calculated_number',
  'calculated_date',
];

function matchBmapType(foreignType: string, typesMap: TypesMap): FieldType {
	let type: FieldType = 'string';

	for (const nativeType of Object.keys(typesMap)) {
		const mappedForeignTypes = typesMap[nativeType as FieldType];

		if (mappedForeignTypes?.includes(foreignType)) {
			type = nativeType as FieldType;
			break;
		}
	}

	return type;
}

export async function getBoardCustomFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
	const boardId = this.getNodeParameter('board_id',	undefined, { extractValue: true },) as number;

	const fields: ResourceMapperField[] = [];

	// If the user hasn’t picked a board yet, return an empty list
	if (!boardId) {
		return { fields };
	}

	// 2) fetch the list of reason IDs for this board
	const idResponse = await businessmapApiRequest.call(
		this,
		'GET',
		`/boards/${boardId}/customFields`,
	);

	const idData = idResponse.data?.data;
	checkApiResponse(this.getNode(), idResponse, idData, 'Custom Fields');

	// 3) build comma-separated list
	const itemIds = idData.map((i: Record<string, any>) => i.field_id).join(',');

	if (!itemIds) {
		return { fields };
	}

	// 4) fetch full reason objects
	const fullResponse = await businessmapApiRequest.call(
		this,
		'GET',
		`/customFields`,
		undefined,
		{ field_ids: itemIds, 'expand': 'allowed_values' },
	);

	const customFields = fullResponse.data?.data;
	checkApiResponse(this.getNode(), fullResponse, customFields, 'Custom Fields details');

	const constructOptions = (field: BusinessmapSchema): INodePropertyOptions[] | undefined => {
		if (Array.isArray(field.allowed_values)) {
			return field.allowed_values.map(av => ({
				name:  av.value,
				value: av.value_id,
			}));
		}

		return undefined;
	};

	for (const field of customFields) {
		// If this field’s raw type is in the unsupported list, skip it
		if (unsupportedBusinessmapTypes.includes(field.type)) {
			continue;
		}
		const type = matchBmapType(field.type, businessmapTypesMap);
		const options = field.type === 'dropdown' ? constructOptions(field) : undefined;
			fields.push({
				id: field.field_id.toString(),
				displayName: field.name,
				required: false,
				defaultMatch: false,
				canBeUsedToMatch: false,
				display: true,
				type,
				options,
			});
	}

	return { fields };
}


