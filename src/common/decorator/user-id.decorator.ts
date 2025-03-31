import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

export const UserId = createParamDecorator((_, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest();

  const userId = req?.user?.sub;

  if (!userId) {
    throw new UnauthorizedException('잘못된 접근입니다.');
  }

  return userId;
});
