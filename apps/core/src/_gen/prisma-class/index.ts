import { UserRelations as _UserRelations } from './user_relations';
import { PhotoRelations as _PhotoRelations } from './photo_relations';
import { AlbumRelations as _AlbumRelations } from './album_relations';
import { GroupRelations as _GroupRelations } from './group_relations';
import { GroupMemberRelations as _GroupMemberRelations } from './group_member_relations';
import { User as _User } from './user';
import { Photo as _Photo } from './photo';
import { Album as _Album } from './album';
import { Group as _Group } from './group';
import { GroupMember as _GroupMember } from './group_member';

export namespace PrismaModel {
  export class UserRelations extends _UserRelations {}
  export class PhotoRelations extends _PhotoRelations {}
  export class AlbumRelations extends _AlbumRelations {}
  export class GroupRelations extends _GroupRelations {}
  export class GroupMemberRelations extends _GroupMemberRelations {}
  export class User extends _User {}
  export class Photo extends _Photo {}
  export class Album extends _Album {}
  export class Group extends _Group {}
  export class GroupMember extends _GroupMember {}

  export const extraModels = [
    UserRelations,
    PhotoRelations,
    AlbumRelations,
    GroupRelations,
    GroupMemberRelations,
    User,
    Photo,
    Album,
    Group,
    GroupMember,
  ];
}
