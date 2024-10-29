import { Module } from "@nestjs/common";
import { AuthGuard } from "./guards/auth.guard";
import { APP_GUARD } from "@nestjs/core";
import { RolesGuard } from "./guards/roles.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { AccessGuard } from "./guards/access.guard";
import { UsersService } from "src/users/users.service";
import { CommonModule } from "src/common/common.module";

@Module({
  imports: [
    CommonModule,
    JwtModule.register({
      secret: "123",
      signOptions: { expiresIn: "30m" },
    }),
  ],
  exports: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    UsersService,
    AccessGuard,
    AuthService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
