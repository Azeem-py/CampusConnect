import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: any;

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function makeClient(overrides: any = {}) {
    return {
      handshake: {
        auth: { token: undefined },
        headers: {},
        ...overrides,
      },
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      data: {},
      ...overrides,
    } as any;
  }

  describe('handleConnection', () => {
    it('allows connection with valid auth token from handshake.auth', async () => {
      const client = makeClient({
        handshake: { auth: { token: 'valid-jwt' }, headers: {} },
      });
      mockJwtService.verify.mockReturnValue({ id: 'user1' });

      await gateway.handleConnection(client);

      expect(client.join).toHaveBeenCalledWith('user:user1');
      expect(client.data.userId).toBe('user1');
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('allows connection with valid token from Authorization header', async () => {
      const client = makeClient({
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer bearer-jwt' },
        },
      });
      mockJwtService.verify.mockReturnValue({ id: 'user2' });

      await gateway.handleConnection(client);

      expect(client.join).toHaveBeenCalledWith('user:user2');
      expect(client.data.userId).toBe('user2');
    });

    it('allows connection with valid token from cookie', async () => {
      const client = makeClient({
        handshake: {
          auth: {},
          headers: { cookie: 'token=cookie-jwt; other=val' },
        },
      });
      mockJwtService.verify.mockReturnValue({ id: 'user3' });

      await gateway.handleConnection(client);

      expect(client.join).toHaveBeenCalledWith('user:user3');
      expect(client.data.userId).toBe('user3');
    });

    it('rejects connection when no token is provided', async () => {
      const client = makeClient({
        handshake: { auth: {}, headers: {} },
      });

      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith('error', 'Authentication failed');
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('rejects connection when token is invalid', async () => {
      const client = makeClient({
        handshake: { auth: { token: 'bad-token' }, headers: {} },
      });
      mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });

      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith('error', 'Authentication failed');
      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('emitToUser', () => {
    it('emits event to the correct user room', () => {
      const serverSpy = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
      (gateway as any).server = serverSpy;

      gateway.emitToUser('user1', 'notification:new', { id: 'notif1' });

      expect(serverSpy.to).toHaveBeenCalledWith('user:user1');
    });
  });
});
