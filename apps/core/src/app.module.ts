import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './common/logger.middleware.js';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AlbumController } from './controllers/album.controller.js';
import { GalleryController } from './controllers/gallery.controller.js';
import { GroupsController } from './controllers/groups.controller.js';
import { NotesController } from './controllers/notes.controller.js';
import { PhotoController } from './controllers/photo.controller.js';
import { AuthController } from './controllers/auth.controller.js';
import { FilesController } from './controllers/files.controller.js';
import { UsersController } from './controllers/users.controller.js';
import { AuthService } from './services/auth.service.js';
import { AlbumService } from './services/album.service.js';
import { FilesService } from './services/files.service.js';
import { GalleryService } from './services/gallery.service.js';
import { GroupsService } from './services/groups.service.js';
import { NotesService } from './services/notes.service.js';
import { PhotoService } from './services/photo.service.js';
import { UsersService } from './services/users.service.js';
import { AccessGuard } from './guards/access.guard.js';
import { CommonModule } from './common/common.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: '123',
      signOptions: { expiresIn: '30m' },
    }),
    CommonModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AccessGuard,
    PhotoService,
    AlbumService,
    AuthService,
    FilesService,
    GalleryService,
    GroupsService,
    NotesService,
    PhotoService,
    UsersService,
  ],
  controllers: [
    AlbumController,
    AuthController,
    FilesController,
    GalleryController,
    GroupsController,
    NotesController,
    PhotoController,
    UsersController,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
