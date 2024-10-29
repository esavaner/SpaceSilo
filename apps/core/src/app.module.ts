import { Module } from '@nestjs/common';
import { GalleryModule } from './gallery/gallery.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [GalleryModule, CommonModule, UsersModule, AuthModule, FilesModule, NotesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
