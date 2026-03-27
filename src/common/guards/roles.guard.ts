import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    const hasRole = requiredRoles.some(
      (role) => role.toUpperCase() === user.role?.toUpperCase(),
    );

    if (!hasRole) {
      throw new ForbiddenException("Sizda ushbu amal uchun huquq yoq");
    }

    return true;
  }
}
