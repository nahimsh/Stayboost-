import "reflect-metadata";
import { Logger, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { ProblemDetailsFilter } from "./common/problem-details.filter";
import { loadEnv } from "./config/env";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  // We own body parsing so we can pin a strict size limit (DoS guard).
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(json({ limit: env.MAX_BODY_SIZE }));
  app.use(urlencoded({ extended: true, limit: env.MAX_BODY_SIZE }));

  app.use(
    helmet({
      // This is a JSON API: lock the CSP down hard; HSTS forces TLS.
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      hsts: { maxAge: 63_072_000, includeSubDomains: true, preload: true },
      crossOriginResourcePolicy: { policy: "same-site" },
    }),
  );
  app.enableCors({
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  app.enableVersioning({ type: VersioningType.URI, prefix: "v" });
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.enableShutdownHooks();

  await app.listen(env.API_PORT);
  new Logger("Bootstrap").log(`StayBoost API listening on :${env.API_PORT}`);
}

void bootstrap();
