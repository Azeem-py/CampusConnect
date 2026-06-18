import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AuthService {
  /**
   * Validates if the email belongs to a university domain.
   */
  isEduEmail(email: string): boolean {
    const eduPattern = /\.edu$/i;
    const parts = email.split('@');

    return parts.length === 2 && parts[0].length > 0 && eduPattern.test(parts[1]);
  }

  /**
   * Validates registration data based on the user's role.
   * Admin accounts CANNOT be created via HTTP. Only STUDENT and BUSINESS roles allowed.
   */
  validateRegistration(email: string, role: 'STUDENT' | 'BUSINESS'): void {
    if (role === ('ADMIN' as any)) {
      throw new ForbiddenException('Admin accounts cannot be created via registration.');
    }

    const emailParts = email.split('@');
    if (emailParts.length !== 2 || emailParts[0].length === 0 || emailParts[1].length === 0) {
      throw new BadRequestException('Invalid email address.');
    }
  }
}
