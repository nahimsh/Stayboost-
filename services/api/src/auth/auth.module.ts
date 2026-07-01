import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TokensService } from "./tokens.service";
import { AuditService } from "./audit.service";
import { GoogleService } from "./google.service";
import { CookieService } from "./cookies";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { CsrfGuard } from "./guards/csrf.guard";
import { PasswordResetThrottlerGuard } from "./guards/password-reset.guard";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: { issuer: "stayboost", audience: "stayboost-api" },
        verifyOptions: { issuer: "stayboost", audience: "stayboost-api" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    AuditService,
    GoogleService,
    CookieService,
    JwtAuthGuard,
    RolesGuard,
    CsrfGuard,
    PasswordResetThrottlerGuard,
  ],
  exports: [AuthService, TokensService, AuditService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
