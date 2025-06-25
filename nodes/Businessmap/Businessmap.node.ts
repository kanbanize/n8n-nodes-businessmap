import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { BusinessmapV1 } from './v1/BusinessmapV1.node';

export class Businessmap extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Businessmap',
			name: 'businessmap',
			icon: 'file:businessmap.svg',
			group: ['input'],
			description: 'Read, write, update and delete data from Businessmap',
			defaultVersion: 1.0,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1.0: new BusinessmapV1(),
		};

		super(nodeVersions, baseDescription);
	}
}
