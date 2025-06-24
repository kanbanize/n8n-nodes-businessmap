import { boardHandlers } from '../../../v1/resources/boards';
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

const apiResponse = {
	data: {
		data: [
			{ board_id: 1, workspace_id: 1, name: 'Board 1', is_archived: 0, description: 'Board description' },
			{ board_id: 2, workspace_id: 1, name: 'Board 2', is_archived: 0, description: 'Board description' },
		],
	}
}

const singleBoardResponse = {
	data: { board_id: 1, workspace_id: 1, name: 'Board 1', is_archived: 0, description: 'Board description' },
};

describe('boardHandlers.getAllBoards', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should get all boards with query parameters and return JSON array', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'workspace_id') return { value: 123 };
			if (param === 'is_archived') return { value: 0 };
			return '';
		}) as any;

		mockedApiRequest.mockResolvedValue(apiResponse);

		const result = await boardHandlers.getAllBoards.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('GET', '/boards', undefined, {
			workspace_ids: 123,
			is_archived: 0,
		});
		expect(result).toEqual(apiResponse.data);
	});
});

describe('boardHandlers.get', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should get board by ID and return JSON array', async () => {
		mockThis.getNodeParameter = jest.fn(() => '1') as any;

		mockedApiRequest.mockResolvedValue(singleBoardResponse);

		const result = await boardHandlers.get.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('GET', '/boards/1');
		expect(result).toEqual(singleBoardResponse.data);
	});
});

describe('boardHandlers.create', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should create a board with workspace_id and name', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'workspace_id') return { value: 321 };
			if (param === 'name') return 'New Board';
			return '';
		}) as any;

		mockedApiRequest.mockResolvedValue(singleBoardResponse);

		const result = await boardHandlers.create.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('POST', '/boards', {
			workspace_id: 321,
			name: 'New Board',
		});
		expect(result).toEqual(singleBoardResponse.data);
	});
});

describe('boardHandlers.update', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should update board with valid board_id and fields', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'board_id') return 456;
			if (param === 'name') return 'Updated Board';
			if (param === 'is_archived') return { value: 1 };
			return '';
		}) as any;

		mockedApiRequest.mockResolvedValue(singleBoardResponse);

		const result = await boardHandlers.update.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('PATCH', '/boards/456', {
			name: 'Updated Board',
			is_archived: 1,
		});
		expect(result).toEqual(singleBoardResponse.data);
	});

	it('should throw error if board_id is invalid', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'board_id') return 0;
			if (param === 'name') return 'X';
			if (param === 'is_archived') return { value: 0 };
			return '';
		}) as any;

		await expect(boardHandlers.update.call(mockThis, 0)).rejects.toThrow(
			'Board ID must be a positive number'
		);

		expect(mockedApiRequest).not.toHaveBeenCalled();
	});
});
