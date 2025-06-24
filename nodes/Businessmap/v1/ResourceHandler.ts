import { IResourceHandlers } from './types';
import { mainCardHandlers } from './resources/mainCard';
import { cardHandlers } from './resources/cards';
import { attachmentHandlers } from './resources/attachments';
import { workspaceHandlers } from './resources/workspaces';
import { boardHandlers } from './resources/boards';
import { tagHandlers } from './resources/tags';
import { stickerHandlers } from './resources/stickers';

export const resourceHandlers: IResourceHandlers = {
	mainCard: mainCardHandlers,
	cards: cardHandlers,
	attachments: attachmentHandlers,
	workspaces: workspaceHandlers,
	boards: boardHandlers,
	tags: tagHandlers,
	stickers: stickerHandlers,
};
