import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const UserId = createParamDecorator((_, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest();
  return req?.user?.sub;
});
