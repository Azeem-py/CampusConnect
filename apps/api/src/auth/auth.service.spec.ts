import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('isEduEmail', () => {
    it('should return true for valid .edu emails', () => {
      const validEmails = [
        'student@harvard.edu',
        'user@mit.edu',
        'test.name@stanford.edu',
      ];
      
      const results = validEmails.map(email => service.isEduEmail(email));
      expect(results.every(res => res === true)).toBe(true);
    });

    it('should return false for non-.edu emails', () => {
      const invalidEmails = [
        'student@gmail.com',
        'user@outlook.com',
        'edu@not-really-edu.com',
        'hacker@university.edu.com',
      ];

      const results = invalidEmails.map(email => service.isEduEmail(email));
      expect(results.every(res => res === false)).toBe(true);
    });

    it('should handle edge cases like empty strings or malformed emails', () => {
      expect(service.isEduEmail('')).toBe(false);
      expect(service.isEduEmail('no-at-sign.edu')).toBe(false);
      expect(service.isEduEmail('@only-domain.edu')).toBe(false);
    });
  });

  describe('validateRegistration', () => {
    it('should NOT throw for STUDENT with non-.edu email', () => {
      expect(() => 
        service.validateRegistration('test@gmail.com', 'STUDENT')
      ).not.toThrow();
    });

    it('should NOT throw for STUDENT with valid .edu email', () => {
      expect(() => 
        service.validateRegistration('test@university.edu', 'STUDENT')
      ).not.toThrow();
    });

    it('should throw BadRequestException for malformed emails', () => {
      expect(() => 
        service.validateRegistration('invalid-email', 'STUDENT')
      ).toThrow(BadRequestException);
      expect(() => 
        service.validateRegistration('@no-local.com', 'STUDENT')
      ).toThrow(BadRequestException);
    });

    it('should NOT throw for BUSINESS with any valid email', () => {
      expect(() => 
        service.validateRegistration('business@company.com', 'BUSINESS')
      ).not.toThrow();
    });
  });
});
