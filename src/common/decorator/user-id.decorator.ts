import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

interface UserIdParamDecoratorParams {
  isPublic?: boolean;
}

export const UserId = createParamDecorator(
  (params: UserIdParamDecoratorParams, context: ExecutionContext) => {
    const { isPublic } = params ?? {};

    const req = context.switchToHttp().getRequest();

    const userId = req?.user?.sub;

    if (!userId && !isPublic) {
      throw new UnauthorizedException('잘못된 접근입니다.');
    }

    return userId;
  },
);
