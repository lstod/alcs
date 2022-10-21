import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as config from 'config';
import fastify from 'fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/exception.filter';
import { generateModuleGraph } from './tools/graph';

const registerSwagger = (app: NestFastifyApplication) => {
  const documentBuilderConfig = new DocumentBuilder()
    .setTitle('ALCS API')
    .setDescription('ALCS - provide explanation for ALCS')
    .setVersion('0.1')
    .addOAuth2({
      type: 'oauth2',
      flows: {
        password: {
          tokenUrl: config.get<string>('KEYCLOAK.AUTH_TOKEN_URL'),
          authorizationUrl: config.get<string>('KEYCLOAK.AUTH_SERVER_URL'),
          scopes: { openid: 'openid' },
        },
      },
    })
    .build();
  const document = SwaggerModule.createDocument(app, documentBuilderConfig);
  SwaggerModule.setup('docs', app, document);
};

const registerHelmet = async (app: NestFastifyApplication) => {
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`, config.get<string>('KEYCLOAK.AUTH_SERVER')],
        styleSrc: [
          `'self'`,
          `'unsafe-inline'`,
          'cdn.jsdelivr.net',
          'fonts.googleapis.com',
        ],
        fontSrc: [`'self'`, 'fonts.gstatic.com'],
        imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`, `cdn.jsdelivr.net`],
      },
    },
  });
};

const registerGlobalFilters = (app: NestFastifyApplication) => {
  app.useGlobalFilters(new HttpExceptionFilter(app.get(Logger)));
};

const registerCors = (app: NestFastifyApplication) => {
  app.enableCors({
    origin: [
      config.get<string>('BASE_URL'),
      config.get<string>('KEYCLOAK.AUTH_SERVER'),
      config.get<string>('FRONTEND_ROOT'),
    ],
  });
};

function registerPipes(app: NestFastifyApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
}

async function registerMultiPart(app: NestFastifyApplication) {
  await app.register(fastifyMultipart, {
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 100, // Max field value size in bytes
      fields: 10, // Max number of non-file fields
      fileSize: config.get<number>('STORAGE.MAX_FILE_SIZE'), // For multipart forms, the max file size in bytes
      files: 1, // Max number of file fields
      headerPairs: 2000, // Max number of header key=>value pairs
    },
  });
}

async function bootstrap() {
  //TODO: Security workaround for fastify, fixed in fastify 4.8.1+
  const fastifyInstance = fastify();
  // @ts-ignore
  const badNames = Object.getOwnPropertyNames({}.__proto__);
  fastifyInstance.addHook('onRequest', async (req, reply) => {
    for (const badName of badNames) {
      const contentType = req.headers['content-type'];
      if (contentType && contentType.includes(badName)) {
        reply.code(415);
        throw new Error('Content type not supported');
      }
    }
  });

  // fastify
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(fastifyInstance),
    {
      bufferLogs: true,
    },
  );
  app.useLogger(app.get(Logger));

  const isGraph = process.argv[2];
  if (isGraph === 'graph-only') {
    await generateModuleGraph(app);
    process.exit(0);
  }

  // config variables
  const port: number = config.get<number>('PORT');

  registerCors(app);
  registerSwagger(app);
  await registerHelmet(app);
  registerGlobalFilters(app);
  await registerMultiPart(app);
  registerPipes(app);

  // start app n port
  await app.listen(port, '0.0.0.0', () => {
    console.log('[WEB]', config.get<string>('BASE_URL'));
  });
}

bootstrap();