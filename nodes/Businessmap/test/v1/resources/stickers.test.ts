import { stickerHandlers } from '../../../v1/resources/stickers';
import { businessmapApiRequest } from '../../../v1/transport';
import { IExecuteFunctions } from 'n8n-workflow';

jest.mock('../../../v1/transport', () => ({
	businessmapApiRequest: jest.fn(),
}));

const mockedApiRequest = businessmapApiRequest as jest.MockedFunction<typeof businessmapApiRequest>;

const mockThis = {
	getNodeParameter: jest.fn(),
	getNode: jest.fn(() => ({})),
} as unknown as IExecuteFunctions;

const manyStickersApiResponse = {
	data: {
		data: [
			{ sticker_id: 1, label: 'Sticker 1', color: 'ffffff', availability: 1, is_enabled: 1 },
			{ sticker_id: 2, label: 'Sticker 2', color: 'ff5555', availability: 0, is_enabled: 1 },
		],
	},
};

const singleStickerApiResponse = {
	data: { sticker_id: 1, label: 'Sticker 1', color: 'ffffff', availability: 1, is_enabled: 1 },
};

describe('stickerHandlers.getAllStickers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should get all stickers and return the data array', async () => {
		mockedApiRequest.mockResolvedValue(manyStickersApiResponse);

		const result = await stickerHandlers.getAllStickers.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('GET', '/stickers');
		expect(result).toEqual(manyStickersApiResponse.data);
	});
});

describe('stickerHandlers.get', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call /stickers with label query if stickerType is "label"', async () => {
		mockThis.getNodeParameter = jest
			.fn()
			.mockImplementationOnce(() => 'label')
			.mockImplementationOnce(() => 'Urgent');

		mockedApiRequest.mockResolvedValue(singleStickerApiResponse);

		const result = await stickerHandlers.get.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			'GET',
			'/stickers/',
			{},
			{ label: 'Urgent' }
		);

		expect(result).toEqual(singleStickerApiResponse.data);
	});

	it('should call /stickers/:id and return response.data.data if stickerType is "stickerId"', async () => {
		mockThis.getNodeParameter = jest
			.fn()
			.mockImplementationOnce(() => 'stickerId')
			.mockImplementationOnce(() => '321');

		mockedApiRequest.mockResolvedValue(singleStickerApiResponse);

		const result = await stickerHandlers.get.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('GET', '/stickers/321');
		expect(result).toEqual(singleStickerApiResponse.data);
	});
});

describe('stickerHandlers.create', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should create a sticker and return the response data', async () => {
		mockThis.getNodeParameter = jest
			.fn()
			.mockImplementationOnce(() => 'Urgent')
			.mockImplementationOnce(() => 'FF0000');

		mockedApiRequest.mockResolvedValue(singleStickerApiResponse);

		const result = await stickerHandlers.create.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('POST', '/stickers', {
			label: 'Urgent',
			color: 'FF0000',
		});

		expect(result).toEqual(singleStickerApiResponse.data);
	});
});

describe('stickerHandlers.update', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should update sticker with cleaned color and return response data', async () => {
		mockThis.getNodeParameter = jest
			.fn()
			.mockImplementationOnce(() => '321')       // sticker_id
			.mockImplementationOnce(() => 'Urgent')    // label
			.mockImplementationOnce(() => '#FF0000');  // color

		mockedApiRequest.mockResolvedValue(singleStickerApiResponse);

		const result = await stickerHandlers.update.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('PATCH', '/stickers/321', {
			label: 'Urgent',
			color: 'FF0000',
		});

		expect(result).toEqual(singleStickerApiResponse.data);
	});

	it('should throw error if color format is invalid', async () => {
		mockThis.getNodeParameter = jest
			.fn()
			.mockImplementationOnce(() => '321')
			.mockImplementationOnce(() => 'Urgent')
			.mockImplementationOnce(() => '#GGGGGG');

		await expect(stickerHandlers.update.call(mockThis, 0)).rejects.toThrow(
			'Invalid color format. Color must be a 6-digit hexadecimal value.'
		);

		expect(mockedApiRequest).not.toHaveBeenCalled();
	});
});

describe('stickerHandlers.delete', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should delete a sticker and return success', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'sticker_id') return '456';
			return '';
		}) as any;

		mockedApiRequest.mockResolvedValue(undefined);

		const result = await stickerHandlers.delete.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('DELETE', '/stickers/456');
		expect(result).toEqual({ success: true });
	});
});

describe('stickerHandlers.assign', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should assign a sticker to a board and return status code', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'sticker_id') return { value: 123 };
			if (param === 'board_id') return { value: 456 };
			return '';
		}) as any;

		mockedApiRequest.mockResolvedValue({ statusCode: 204 });

		const result = await stickerHandlers.assign.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			'PUT',
			'/boards/456/stickers/123'
		);

		expect(result).toEqual({ status: 204 });
	});

	it('should throw an error if sticker ID is invalid', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'sticker_id') return { value: 0 };
			if (param === 'board_id') return { value: 456 };
			return '';
		}) as any;

		await expect(stickerHandlers.assign.call(mockThis, 0)).rejects.toThrow(
			'Sticker ID must be a positive number'
		);

		expect(mockedApiRequest).not.toHaveBeenCalled();
	});

	it('should throw an error if board ID is invalid', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'sticker_id') return { value: 123 };
			if (param === 'board_id') return { value: NaN };
			return '';
		}) as any;

		await expect(stickerHandlers.assign.call(mockThis, 0)).rejects.toThrow(
			'Board ID must be a positive number'
		);

		expect(mockedApiRequest).not.toHaveBeenCalled();
	});
});
