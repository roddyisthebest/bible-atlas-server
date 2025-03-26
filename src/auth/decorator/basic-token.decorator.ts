import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

export const BasicToken = createParamDecorator(
  (_, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    const basicToken = req.headers['authorization'];
    if (!basicToken) {
      throw new UnauthorizedException();
    }

    return basicToken;
  },
);
