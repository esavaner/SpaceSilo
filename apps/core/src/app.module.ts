import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './common/logger.middleware';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AlbumController } from './controllers/album.controller';
import { GalleryController } from './controllers/gallery.controller';
import { GroupsController } from './controllers/groups.controller';
import { NotesController } from './controllers/notes.controller';
import { PhotoController } from './controllers/photo.controller';
import { AuthController } from './controllers/auth.controller';
import { FilesController } from './controllers/files.controller';
import { UsersController } from './controllers/users.controller';
import { AuthService } from './services/auth.service';
import { AlbumService } from './services/album.service';
import { FilesService } from './services/files.service';
import { GalleryService } from './services/gallery.service';
import { GroupsService } from './services/groups.service';
import { NotesService } from './services/notes.service';
import { PhotoService } from './services/photo.service';
import { UsersService } from './services/users.service';
import { AccessGuard } from './guards/access.guard';
import { CommonModule } from './common/common.module';

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
