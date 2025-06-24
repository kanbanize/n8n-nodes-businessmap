import { mainCardHandlers } from '../../../v1/resources/mainCard';
import { businessmapApiRequest } from '../../../v1/transport';
import { IExecuteFunctions } from 'n8n-workflow';

jest.mock('../../../v1/transport', () => ({
  businessmapApiRequest: jest.fn(),
}));

const mockedApiRequest = businessmapApiRequest as jest.MockedFunction<typeof businessmapApiRequest>;

let mockThis: IExecuteFunctions;

beforeEach(() => {
  jest.clearAllMocks();
  mockThis = {
    getNodeParameter: jest.fn(),
    getNode: jest.fn(() => ({})),
  } as unknown as IExecuteFunctions;
});

describe('mainCardHandlers.get', () => {
  it('should fetch a card by ID and return the first item', async () => {
    mockThis.getNodeParameter = jest.fn(() => 123) as any;

    const mockResponse = {
      data: {
        data: {
          data: [
            { card_id: 123, title: 'Test Card' },
            { card_id: 124, title: 'Other Card' },
          ],
        },
      },
    };

    mockedApiRequest.mockResolvedValue(mockResponse);

    const result = await mainCardHandlers.get.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      'GET',
      '/cards/',
      undefined,
      expect.objectContaining({
        card_ids: 123,
        fields: expect.any(String),
        expand: expect.any(String),
      })
    );

    expect(result).toEqual({ card_id: 123, title: 'Test Card' });
  });

  it('should return "Card not found" status if no cards are returned', async () => {
    mockThis.getNodeParameter = jest.fn(() => 999) as any;

    mockedApiRequest.mockResolvedValue({
      data: {
        data: {
          data: [],
        },
      },
    });

    const result = await mainCardHandlers.get.call(mockThis, 0);

    expect(result).toEqual({ status: 'Card not found' });
  });

  it('should throw an error if card_id is 0', async () => {
    mockThis.getNodeParameter = jest.fn(() => 0) as any;

    await expect(mainCardHandlers.get.call(mockThis, 0)).rejects.toThrow(
      'Card ID must be a positive number'
    );
  });
});

describe('mainCardHandlers.getCustom', () => {
  it('should fetch a card by custom ID and return the first item', async () => {
    mockThis.getNodeParameter = jest.fn(() => 'custom-abc') as any;

    const mockResponse = {
      data: {
        data: {
          data: [
            { card_id: 123, custom_id: 'custom-abc', title: 'Custom Card' },
          ],
        },
      },
    };

    mockedApiRequest.mockResolvedValue(mockResponse);

    const result = await mainCardHandlers.getCustom.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      'GET',
      '/cards/',
      undefined,
      expect.objectContaining({
        custom_ids: 'custom-abc',
        fields: expect.any(String),
        expand: expect.any(String),
      })
    );

    expect(result).toEqual({ card_id: 123, custom_id: 'custom-abc', title: 'Custom Card' });
  });

  it('should return "Card not found" if no cards match the custom ID', async () => {
    mockThis.getNodeParameter = jest.fn(() => 'missing-id') as any;

    mockedApiRequest.mockResolvedValue({
      data: {
        data: {
          data: [],
        },
      },
    });

    const result = await mainCardHandlers.getCustom.call(mockThis, 0);
    expect(result).toEqual({ status: 'Card not found' });
  });

  it('should throw an error if custom card ID is empty', async () => {
    mockThis.getNodeParameter = jest.fn(() => '') as any;

    await expect(mainCardHandlers.getCustom.call(mockThis, 0)).rejects.toThrow(
      'Custom Card ID must not be empty'
    );
  });
});

describe('mainCardHandlers.getAllCardsPerBoard', () => {
  it('should fetch all cards for a valid board and return response data', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'board_id') return { value: 22 };
      return '';
    }) as any;

    const mockResponse = {
      data: {
        data: [
          { card_id: 1, title: 'Card A' },
          { card_id: 2, title: 'Card B' },
        ],
      },
    };

    mockedApiRequest.mockResolvedValue(mockResponse);

    const result = await mainCardHandlers.getAllCardsPerBoard.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      'GET',
      '/cards/',
      undefined,
      expect.objectContaining({
        board_ids: 22,
        fields: expect.any(String),
        expand: expect.any(String),
      })
    );

    expect(result).toEqual(mockResponse.data);
  });

  it('should throw if board_id is 0 or invalid', async () => {
    mockThis.getNodeParameter = jest.fn(() => ({ value: 0 })) as any;

    await expect(mainCardHandlers.getAllCardsPerBoard.call(mockThis, 0)).rejects.toThrow(
      'Board ID must be a positive number'
    );
  });
});

describe('mainCardHandlers.move', () => {
  it('should move the card to the specified column and lane', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 123;
      if (param === 'column_id') return { value: 10 };
      if (param === 'lane_id') return { value: 20 };
      return '';
    }) as any;

    const mockResponse = { data: { card_id: 123, column_id: 10, lane_id: 20 } };
    mockedApiRequest.mockResolvedValue(mockResponse);

    const result = await mainCardHandlers.move.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      'PATCH',
      '/cards/123',
      { column_id: 10, lane_id: 20 }
    );

    expect(result).toEqual(mockResponse.data);
  });

  it('should throw if card_id is invalid', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 0;
      if (param === 'column_id') return { value: 10 };
      if (param === 'lane_id') return { value: 20 };
      return '';
    }) as any;

    await expect(mainCardHandlers.move.call(mockThis, 0)).rejects.toThrow(
      'Card ID must be a positive number'
    );
  });

  it('should throw if column_id is invalid', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 123;
      if (param === 'column_id') return { value: 0 };
      if (param === 'lane_id') return { value: 20 };
      return '';
    }) as any;

    await expect(mainCardHandlers.move.call(mockThis, 0)).rejects.toThrow(
      'Column ID must be a positive number'
    );
  });

  it('should throw if lane_id is invalid', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 123;
      if (param === 'column_id') return { value: 10 };
      if (param === 'lane_id') return { value: 0 };
      return '';
    }) as any;

    await expect(mainCardHandlers.move.call(mockThis, 0)).rejects.toThrow(
      'Lane ID must be a positive number'
    );
  });
});

describe('mainCardHandlers.create', () => {
  it('should create a card with required and optional fields', async () => {
    // Setup: getNodeParameter returns based on param name
    mockThis.getNodeParameter = jest.fn((param: string) => {
      const inputs: Record<string, any> = {
        'column_id': { value: 10 },
        'lane_id': { value: 20 },
        'custom_id': 'CUST-001',
        'title': 'New Card',
        'description': 'Line 1<br>Line 2',
        'priority': 3,
        'owner_id': { value: 123 },
        'color': '#ff00ff',
        'deadline': '2025-06-18',
        'size': 'M',
        'additionalFields': {
          type_id: { value: 5 },
          tag_id: { value: 7 },
          sticker_id: { value: 8 },
        },
        'customFields.value': {
          field1: 'Alpha',
          field2: 100,
        },
        'customFields.schema': [
          { id: 'field1', type: 'text' },
          { id: 'field2', type: 'number' },
        ],
      };
      return inputs[param];
    }) as any;

    const response = { data: { card_id: 123, title: 'New Card' } };
    mockedApiRequest.mockResolvedValue(response);

    const result = await mainCardHandlers.create.call(mockThis, 0);

    const expectedDeadline = new Date('2025-06-18');
    expectedDeadline.setHours(0, 0, 0, 0);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      'POST',
      '/cards',
      expect.objectContaining({
        column_id: 10,
        lane_id: 20,
        custom_id: 'CUST-001',
        title: 'New Card',
        description: 'Line 1<br>Line 2',
        priority: 3,
        owner_user_id: 123,
        color: 'ff00ff',
        deadline: expectedDeadline.toISOString(),
        size: 'M',
        type_id: 5,
        tag_ids_to_add: [7],
        stickers_to_add: [{ sticker_id: 8 }],
        custom_fields_to_add_or_update: [
          { field_id: 'field1', value: 'Alpha' },
          { field_id: 'field2', value: 100 },
        ],
      })
    );

    expect(result).toEqual(response.data);
  });

  it('should throw on invalid color', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'column_id') return { value: 10 };
      if (param === 'lane_id') return { value: 20 };
      if (param === 'color') return 'ZZZZZZ';
      return '';
    }) as any;

    await expect(mainCardHandlers.create.call(mockThis, 0)).rejects.toThrow(
      'Invalid color format. Color must be a 6-digit hexadecimal value.'
    );
  });

  it('should throw on invalid deadline', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'column_id') return { value: 10 };
      if (param === 'lane_id') return { value: 20 };
      if (param === 'deadline') return 'not-a-date';
      return '';
    }) as any;

    await expect(mainCardHandlers.create.call(mockThis, 0)).rejects.toThrow(
      'Invalid deadline format. Deadline must be a valid date.'
    );
  });
});

describe('mainCardHandlers.update', () => {
  it('should update a card with all fields provided', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      const inputs: Record<string, any> = {
        'card_id': 101,
        'custom_id': 'CUST-101',
        'title': 'Updated Title',
        'description': 'Line A<br>Line B',
        'priority': 2,
        'owner_id': { value: 99 },
        'color': '#abc123',
        'deadline': '2025-06-20',
        'size': 10,
        'cardPositionFields': {
          column_id: { value: '3' },
          lane_id: { value: '4' },
        },
        'additionalFields': {
          type_id: { value: 2 },
          tag_id: { value: 5 },
          sticker_id: { value: 6 },
        },
        'customFields.value': {
          f1: 'Alpha',
          f2: 123,
        },
        'customFields.schema': [
          { id: 'f1', type: 'text' },
          { id: 'f2', type: 'number' },
        ],
      };
      return inputs[param];
    }) as any;

    const mockResponse = { data: { card_id: 101, title: 'Updated Title' } };
    mockedApiRequest.mockResolvedValue(mockResponse);

    const result = await mainCardHandlers.update.call(mockThis, 0);

    const expectedDeadline = new Date('2025-06-20');
    expectedDeadline.setHours(0, 0, 0, 0);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      'PATCH',
      '/cards/101',
      expect.objectContaining({
        custom_id: 'CUST-101',
        title: 'Updated Title',
        description: 'Line A<br>Line B',
        priority: 2,
        owner_user_id: 99,
        color: 'abc123',
        deadline: expectedDeadline.toISOString(),
        size: 10,
        column_id: '3',
        lane_id: '4',
        type_id: 2,
        tag_ids_to_add: [5],
        stickers_to_add: [{ sticker_id: 6 }],
        custom_fields_to_add_or_update: [
          { field_id: 'f1', value: 'Alpha' },
          { field_id: 'f2', value: 123 },
        ],
        custom_field_ids_to_remove: [],
      }),
    );

    expect(result).toEqual(mockResponse.data);
  });

  it('should throw error on invalid color', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'color') return 'badcolor';
      return '';
    }) as any;

    await expect(mainCardHandlers.update.call(mockThis, 0)).rejects.toThrow(
      'Invalid color format. Color must be a 6-digit hexadecimal value.'
    );
  });

  it('should throw error on invalid deadline', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'deadline') return 'invalid-date';
      return '';
    }) as any;

    await expect(mainCardHandlers.update.call(mockThis, 0)).rejects.toThrow(
      'Invalid deadline format. Deadline must be a valid date.'
    );
  });

  it('should throw error if card ID is invalid', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 0;
      return '';
    }) as any;

    await expect(mainCardHandlers.update.call(mockThis, 0)).rejects.toThrow(
      'Card ID must be a positive number'
    );
  });
});
