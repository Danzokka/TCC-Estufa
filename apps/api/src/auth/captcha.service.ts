import { Injectable } from '@nestjs/common';

@Injectable()
export class CaptchaService {
  private captchaStore = new Map<string, { text: string; expiresAt: number }>();

  generateCaptcha(): { id: string; text: string } {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let text = '';
    for (let i = 0; i < 5; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const id = Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

    this.captchaStore.set(id, { text, expiresAt });

    // Limpar captchas expirados
    this.cleanupExpiredCaptchas();

    return { id, text };
  }

  validateCaptcha(id: string, userInput: string): boolean {
    const captcha = this.captchaStore.get(id);

    if (!captcha) {
      return false;
    }

    if (Date.now() > captcha.expiresAt) {
      this.captchaStore.delete(id);
      return false;
    }

    const isValid = captcha.text.toUpperCase() === userInput.toUpperCase();

    // Remover captcha após uso (single use)
    this.captchaStore.delete(id);

    return isValid;
  }

  private cleanupExpiredCaptchas(): void {
    const now = Date.now();
    for (const [id, captcha] of this.captchaStore.entries()) {
      if (now > captcha.expiresAt) {
        this.captchaStore.delete(id);
      }
    }
  }
}
