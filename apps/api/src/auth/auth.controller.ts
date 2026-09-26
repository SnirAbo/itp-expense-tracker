import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';

const signupSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(72) });
const loginSchema = signupSchema;
const resetSchema = z.object({ token: z.string(), password: z.string().min(8).max(72) });

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  private setAuthCookies(res: Response, access: string, refresh: string) {
    const domain = process.env.COOKIE_DOMAIN || 'localhost';
    const secure = process.env.NODE_ENV !== 'development';
    const common = { httpOnly: true, sameSite: 'lax' as const, secure, domain };
    res.cookie('access_token', access, { ...common, path: '/', maxAge: 10 * 60 * 1000 });
    res.cookie('refresh_token', refresh, { ...common, path: '/auth/refresh', maxAge: 30 * 24 * 60 * 60 * 1000 });
  }

  @Post('signup')
  async signup(@Body() body: unknown, @Res() res: Response) {
    const data = signupSchema.parse(body);
    const { access, refresh } = await this.auth.signup(data.email, data.password);
    this.setAuthCookies(res, access, refresh);
    res.status(201).send({ ok: true });
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Res() res: Response) {
    const data = loginSchema.parse(body);
    const { access, refresh } = await this.auth.login(data.email, data.password);
    this.setAuthCookies(res, access, refresh);
    res.send({ ok: true });
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res() res: Response) {
    const refresh = req.cookies?.['refresh_token'] as string | undefined;
    if (refresh) await this.auth.logout(refresh);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    res.send({ ok: true });
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.['refresh_token'];
    const { access, refresh } = await this.auth.refresh(token);
    this.setAuthCookies(res, access, refresh);
    res.send({ ok: true });
  }

  @Post('forgot')
  @HttpCode(202)
  async forgot(@Body() body: { email?: string }) {
    // Always 202 to avoid user enumeration
    if (body?.email) await this.auth.forgot(body.email);
    return { ok: true };
  }

  @Post('reset')
  async reset(@Body() body: unknown) {
    const data = resetSchema.parse(body);
    await this.auth.reset(data.token, data.password);
    return { ok: true };
  }
}
