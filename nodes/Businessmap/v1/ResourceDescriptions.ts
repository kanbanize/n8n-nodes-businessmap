
import type { INodeProperties } from 'n8n-workflow';
import { mainCardOperations, mainCardFields } from './resources/mainCard';
import { cardsOperations, cardsFields } from './resources/cards';
import { attachmentsOperations, attachmentsFields } from './resources/attachments'
import { workspacesOperations, workspacesFields } from './resources/workspaces';
import { boardsOperations, boardsFields } from './resources/boards';
import { tagsOperations, tagsFields } from './resources/tags';
import { stickersOperations, stickersFields } from './resources/stickers';

export const resourceOperations: INodeProperties[] = [
	...mainCardOperations,
	...cardsOperations,
	...attachmentsOperations,
	...workspacesOperations,
	...boardsOperations,
	...tagsOperations,
	...stickersOperations,
];

export const resourceFields: INodeProperties[] = [
	...mainCardFields,
	...cardsFields,
	...attachmentsFields,
	...workspacesFields,
	...boardsFields,
	...tagsFields,
	...stickersFields,
];

