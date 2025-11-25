import { NestFactory } from '@nestjs/core';
import { apiReference } from '@scalar/nestjs-api-reference';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger/OpenAPI configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nest Multi-Tenancy API')
    .setDescription('API documentation for the Nest Multi-Tenancy application')
    .setVersion('1.0')
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);

  // Scalar API Reference documentation
  const scalarApiReference = apiReference({
    spec: {
      content: openApiDocument,
    },
  });

  app.use('/api-docs', scalarApiReference);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API documentation available at: http://localhost:${port}/api-docs`);
}

bootstrap();
