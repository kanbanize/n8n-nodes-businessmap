import { attachmentHandlers } from '../../../v1/resources/attachments';
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

describe('attachmentHandlers.get', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch attachments by card ID', async () => {
    mockThis.getNodeParameter = jest.fn(() => 123) as any;
    const mockResponse = { data: [{ id: 1, name: 'file.pdf' }] };
    mockedApiRequest.mockResolvedValue(mockResponse);

    const result = await attachmentHandlers.get.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalledWith('GET', '/cards/123/attachments');
    expect(result).toEqual(mockResponse.data);
  });

  it('should throw an error for card ID 0', async () => {
    mockThis.getNodeParameter = jest.fn(() => 0) as any;
    await expect(attachmentHandlers.get.call(mockThis, 0)).rejects.toThrow('Card ID must be a positive number');
  });
});
