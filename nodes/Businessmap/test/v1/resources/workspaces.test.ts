import { workspaceHandlers } from '../../../v1/resources/workspaces';
import { businessmapApiRequest } from '../../../v1/transport';
import { IExecuteFunctions } from 'n8n-workflow';

jest.mock('../../../v1/transport', () => ({
	businessmapApiRequest: jest.fn(),
}));

const mockedApiRequest = businessmapApiRequest as jest.MockedFunction<typeof businessmapApiRequest>;

const mockThis = {
	getNodeParameter: jest.fn(),
	getNode: jest.fn(() => ({})),
	helpers: {
		returnJsonArray: jest.fn((data) => data),
	},
} as unknown as IExecuteFunctions;

const workspacesApiResponse = {
	data: {
		data: [
			{ workspace_id: 1, name: 'Workspace 1', type: 1, is_archived: 0 },
			{ workspace_id: 2, name: 'Workspace 2', type: 2, is_archived: 0 },
		],
	}
};

const singleWorkspaceResponse = {
	data: { workspace_id: 1, name: 'Workspace 1', type: 1, is_archived: 0 },
};

describe('workspaceHandlers.getAllWorkspaces', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should get all workspaces with query parameters and return JSON array', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'type') return { value: 2 };
			if (param === 'is_archived') return { value: 0 };
			return '';
		}) as any;

		mockedApiRequest.mockResolvedValue(workspacesApiResponse);

		const result = await workspaceHandlers.getAllWorkspaces.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('GET', '/workspaces/', undefined, {
			type: 2,
			is_archived: 0,
			expand: 'boards',
		});
		expect(result).toEqual(workspacesApiResponse.data);
	});
});

describe('workspaceHandlers.get', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should get workspace by ID and return JSON array', async () => {
		mockThis.getNodeParameter = jest.fn(() => '1') as any;

		mockedApiRequest.mockResolvedValue(singleWorkspaceResponse);

		const result = await workspaceHandlers.get.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('GET', '/workspaces/1');
		expect(result).toEqual(singleWorkspaceResponse.data);
	});
});

describe('workspaceHandlers.create', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should create a workspace with name and type', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'name') return 'New Workspace';
			if (param === 'type') return 2;
			return '';
		}) as any;

		mockedApiRequest.mockResolvedValue(singleWorkspaceResponse);

		const result = await workspaceHandlers.create.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('POST', '/workspaces', {
			name: 'New Workspace',
			type: 2,
		});
		expect(result).toEqual(singleWorkspaceResponse.data);
	});
});

describe('workspaceHandlers.update', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should update workspace with valid workspace_id and fields', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'workspace_id') return 456;
			if (param === 'name') return 'Updated Workspace';
			if (param === 'is_archived') return { value: 1 };
			return '';
		}) as any;

		mockedApiRequest.mockResolvedValue(singleWorkspaceResponse);

		const result = await workspaceHandlers.update.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('PATCH', '/workspaces/456', {
			name: 'Updated Workspace',
			is_archived: 1,
		});
		expect(result).toEqual(singleWorkspaceResponse.data);
	});

	it('should throw error if workspace_id is invalid', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'workspace_id') return 0;
			if (param === 'name') return 'X';
			if (param === 'is_archived') return { value: 0 };
			return '';
		}) as any;

		await expect(workspaceHandlers.update.call(mockThis, 0)).rejects.toThrow(
			'Workspace ID must be a positive number'
		);

		expect(mockedApiRequest).not.toHaveBeenCalled();
	});
});
