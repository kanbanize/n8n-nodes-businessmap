import { cardHandlers } from '../../../v1/resources/cards';
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
    helpers: {
      returnJsonArray: jest.fn((data) => data),
    },
  } as unknown as IExecuteFunctions;
});

describe('cardHandlers.link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should link two cards with a link type and return status code', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'link_type') return 'relatives';
      if (param === 'linked_card_id') return 202;
      return '';
    }) as any;

    const response = { statusCode: 200 };
    mockedApiRequest.mockResolvedValue(response);

    const result = await cardHandlers.link.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      'PUT',
      '/cards/101/relatives/202'
    );
    expect(result).toEqual({ status: 200 });
  });

  it('should throw if card_id is 0', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 0;
      if (param === 'link_type') return 'relatives';
      if (param === 'linked_card_id') return 202;
      return '';
    }) as any;

    await expect(cardHandlers.link.call(mockThis, 0)).rejects.toThrow(
      'Card ID must be a positive number'
    );
  });

  it('should throw if linked_card_id is 0', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'link_type') return 'relatives';
      if (param === 'linked_card_id') return 0;
      return '';
    }) as any;

    await expect(cardHandlers.link.call(mockThis, 0)).rejects.toThrow(
      'Linked Card ID must be a positive number'
    );
  });
});

describe('cardHandlers.unlink', () => {
  it('should unlink two cards', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'link_type') return 'relatesTo';
      if (param === 'linked_card_id') return 202;
			return '';
    }) as any;

    await cardHandlers.unlink.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalledWith(
      'DELETE',
      '/cards/101/relatesTo/202'
    );
  });

  it('should throw if card_id is 0', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 0;
      if (param === 'link_type') return 'relatesTo';
      if (param === 'linked_card_id') return 202;
			return '';
    }) as any;

    await expect(cardHandlers.unlink.call(mockThis, 0)).rejects.toThrow(
      'Unlink Card ID must be a positive number'
    );
  });

  it('should throw if linked_card_id is 0', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'link_type') return 'relatesTo';
      if (param === 'linked_card_id') return 0;
			return '';
    }) as any;

    await expect(cardHandlers.unlink.call(mockThis, 0)).rejects.toThrow(
      'Linked Card ID must be a positive number'
    );
  });
});

describe('cardHandlers.block', () => {
  it('should call block endpoint successfully', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'reason_id') return { value: 1 };
      if (param === 'comment') return 'Blocked due to X';
			return '';
    }) as any;

    const response = { data: { success: true } };
    mockedApiRequest.mockResolvedValue(response);

    const result = await cardHandlers.block.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalled();
    expect(result).toEqual(response.data);
  });

  it('should throw if card_id is 0', async () => {
    mockThis.getNodeParameter = jest.fn(() => 0) as any;
    await expect(cardHandlers.block.call(mockThis, 0)).rejects.toThrow('Card ID must be a positive number');
  });
});

describe('cardHandlers.unblock', () => {
  it('should call unblock endpoint successfully', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
			return '';
    }) as any;

    const response = { data: { success: true } };
    mockedApiRequest.mockResolvedValue(response);

    const result = await cardHandlers.unblock.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalled();
    expect(result).toEqual(response.data);
  });
});

describe('cardHandlers.archive', () => {
  it('should call archive endpoint successfully', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
			return '';
    }) as any;

    const response = { data: { success: true } };
    mockedApiRequest.mockResolvedValue(response);

    const result = await cardHandlers.archive.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalled();
    expect(result).toEqual(response.data);
  });
});

describe('cardHandlers.unarchive', () => {
  it('should call unarchive endpoint successfully', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
			return '';
    }) as any;

    const response = { data: { success: true } };
    mockedApiRequest.mockResolvedValue(response);

    const result = await cardHandlers.unarchive.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalled();
    expect(result).toEqual(response.data);
  });
});

describe('cardHandlers.discard', () => {
  it('should call discard endpoint successfully', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
			return '';
    }) as any;

    const response = { data: { success: true } };
    mockedApiRequest.mockResolvedValue(response);

    const result = await cardHandlers.discard.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalled();
    expect(result).toEqual(response.data);
  });
});

describe('cardHandlers.restore', () => {
  it('should call restore endpoint successfully', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
			return '';
    }) as any;

    const response = { data: { success: true } };
    mockedApiRequest.mockResolvedValue(response);

    const result = await cardHandlers.restore.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalled();
    expect(result).toEqual(response.data);
  });
});

describe('cardHandlers.comment', () => {
  it('should call comment endpoint successfully', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'text') return 'A comment';
			return '';
    }) as any;

    const response = { data: { success: true } };
    mockedApiRequest.mockResolvedValue(response);

    const result = await cardHandlers.comment.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalled();
    expect(result).toEqual(response.data);
  });

  it('should throw if card_id is 0', async () => {
    mockThis.getNodeParameter = jest.fn(() => 0) as any;
    await expect(cardHandlers.comment.call(mockThis, 0)).rejects.toThrow('Card ID must be a positive number');
  });
});

describe('cardHandlers.subtask', () => {
  it('should call subtask endpoint successfully', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'text') return 'Subtask';
      if (param === 'deadline') return '2025-06-18';
      if (param === 'is_finished') return 0;
      if (param === 'owner_id') return { value: 'user123' };
			return '';
    }) as any;

    const response = { data: { success: true } };
    mockedApiRequest.mockResolvedValue(response);

    const result = await cardHandlers.subtask.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalled();
    expect(result).toEqual(response.data);
  });
});

describe('cardHandlers.logtime', () => {
  it('should call logtime endpoint successfully', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'time_unit') return 'hours';
      if (param === 'duration') return 1;
      if (param === 'date') return '2025-06-17';
      if (param === 'comment') return 'Worked on task';
			return '';
    }) as any;

    const response = { data: { success: true } };
    mockedApiRequest.mockResolvedValue(response);

    const result = await cardHandlers.logtime.call(mockThis, 0);

    expect(mockedApiRequest).toHaveBeenCalled();
    expect(result).toEqual(response.data);
  });

  it('should throw on invalid date', async () => {
    mockThis.getNodeParameter = jest.fn((param: string) => {
      if (param === 'card_id') return 101;
      if (param === 'date') return 'invalid';
      if (param === 'duration') return 1;
      if (param === 'time_unit') return 'hours';
      return '';
    }) as any;
    await expect(cardHandlers.logtime.call(mockThis, 0)).rejects.toThrow('Invalid deadline format');
  });
});
