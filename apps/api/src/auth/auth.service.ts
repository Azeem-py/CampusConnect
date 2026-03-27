import { Injectable, BadRequestException } from '@nestjs/common';

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
   */
  validateRegistration(email: string, role: 'STUDENT' | 'BUSINESS'): void {
    // Currently allowing any valid email domain for both roles.
    // .edu check can be used later for verification badges rather than blocking registration.
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || emailParts[0].length === 0 || emailParts[1].length === 0) {
      throw new BadRequestException('Invalid email address.');
    }
  }
}
