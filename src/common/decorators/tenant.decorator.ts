import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const TenantSchema = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantSchema = request['tenantSchema'];
    
    // This decorator is optional (returns undefined if not tenant context)
    // Or strict (throws if not tenant context) - let's make it optional to support dual mode
    return tenantSchema;
  },
);

