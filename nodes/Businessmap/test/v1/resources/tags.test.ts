import { tagHandlers } from '../../../v1/resources/tags';
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

const manyTagsApiResponse =
{
	data: {
		data: [
			{ tag_id: 1, label: 'Tag 1', color: 'ffffff', availability: 1, is_enabled: 1 },
			{ tag_id: 2, label: 'Tag 2', color: 'ff5555', availability: 0, is_enabled: 1 },
		]
	}
};

const singleTagApiResponse =
{
  data: { tag_id: 1, label: 'Tag 1', color: 'ffffff', availability: 1, is_enabled: 1 },
};

describe('tagHandlers.getAllTags', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should get all tags and return the data array', async () => {

		mockedApiRequest.mockResolvedValue(manyTagsApiResponse);

		const result = await tagHandlers.getAllTags.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			'GET',
			'/tags',
		);

		expect(result).toEqual(manyTagsApiResponse.data);
	});
});

describe('tagHandlers.get', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call /tags with label query if tagType is "label"', async () => {
		mockThis.getNodeParameter = jest
			.fn()
			.mockImplementationOnce(() => 'label')
			.mockImplementationOnce(() => 'Check');

		mockedApiRequest.mockResolvedValue(singleTagApiResponse);

		const result = await tagHandlers.get.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			'GET',
			'/tags/',
			{},
			{ label: 'Check' }
		);

		expect(result).toEqual(singleTagApiResponse.data);
	});

	it('should call /tags/:id and return response.data.data if tagType is "tagId"', async () => {
		mockThis.getNodeParameter = jest
			.fn()
			.mockImplementationOnce(() => 'tagId')   // tag_type
			.mockImplementationOnce(() => '123');    // tag_id

		mockedApiRequest.mockResolvedValue(singleTagApiResponse);

		const result = await tagHandlers.get.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith('GET', '/tags/123');
		expect(result).toEqual(singleTagApiResponse.data);
	});
});

describe('tagHandlers.create', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should create a tag and return the response data', async () => {
		mockThis.getNodeParameter = jest
			.fn()
			.mockImplementationOnce(() => 'Check')
			.mockImplementationOnce(() => 'FF0000');

		mockedApiRequest.mockResolvedValue(singleTagApiResponse);

		const result = await tagHandlers.create.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			'POST',
			'/tags',
			{ label: 'Check', color: 'FF0000' }
		);

		expect(result).toEqual(singleTagApiResponse.data);
	});
});

describe('tagHandlers.update', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should update tag with cleaned color and return response data', async () => {
		mockThis.getNodeParameter = jest
			.fn()
			.mockImplementationOnce(() => '123')
			.mockImplementationOnce(() => 'Check')
			.mockImplementationOnce(() => 'FF0000');

		mockedApiRequest.mockResolvedValue(singleTagApiResponse);

		const result = await tagHandlers.update.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			'PATCH',
			'/tags/123',
			{ label: 'Check', color: 'FF0000' }
		);

		expect(result).toEqual(singleTagApiResponse.data);
	});

	it('should throw error if color format is invalid', async () => {
		mockThis.getNodeParameter = jest
			.fn()
			.mockImplementationOnce(() => '123')
			.mockImplementationOnce(() => 'Check')
			.mockImplementationOnce(() => '#GGGGGG');

		await expect(tagHandlers.update.call(mockThis, 0)).rejects.toThrow(
			'Invalid color format. Color must be a 6-digit hexadecimal value.'
		);

		expect(mockedApiRequest).not.toHaveBeenCalled();
	});
});

describe('tagHandlers.delete', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should delete a tag and return success', async () => {
		mockThis.getNodeParameter = jest.fn((paramName: string) => {
			if (paramName === 'tag_id') return '456';
			return '';
		}) as any;

		mockedApiRequest.mockResolvedValue(undefined);

		const result = await tagHandlers.delete.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			'DELETE',
			'/tags/456'
		);

		expect(result).toEqual({ success: true });
	});
});

describe('tagHandlers.assign', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should assign a tag to a board and return status code', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'tag_id') return { value: 123 };
			if (param === 'board_id') return { value: 456 };
			return '';
		}) as any;

		mockedApiRequest.mockResolvedValue({ statusCode: 204 });

		const result = await tagHandlers.assign.call(mockThis, 0);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			'PUT',
			'/boards/456/tags/123'
		);

		expect(result).toEqual({ status: 204 });
	});

	it('should throw an error if tag ID is invalid', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'tag_id') return { value: 0 };
			if (param === 'board_id') return { value: 456 };
			return '';
		}) as any;

		await expect(tagHandlers.assign.call(mockThis, 0)).rejects.toThrow(
			'Tag ID must be a positive number'
		);

		expect(mockedApiRequest).not.toHaveBeenCalled();
	});

	it('should throw an error if board ID is invalid', async () => {
		mockThis.getNodeParameter = jest.fn((param: string) => {
			if (param === 'tag_id') return { value: 123 };
			if (param === 'board_id') return { value: NaN };
			return '';
		}) as any;

		await expect(tagHandlers.assign.call(mockThis, 0)).rejects.toThrow(
			'Board ID must be a positive number'
		);

		expect(mockedApiRequest).not.toHaveBeenCalled();
	});
});
