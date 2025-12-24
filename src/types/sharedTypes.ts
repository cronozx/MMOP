export interface NotifiactionType {
  id: string,
  type: string;
  title: string;
  message: string;
  unread: boolean;
}

export interface ModType {
  _id?: string;
  name: string;
  author: string;
  game: number;
  file: {
    name: string;
    buffer: number[];
    size: number;
    type: string;
  };
}

export interface GameType {
  id: number;
  name: string;
  modCount: number;
  imagePath: string;
  acceptedTypes: Record<string, unknown>;
  extensions: string;
  description: string;
}

export interface ModpackType {
  _id: string;
  name: string;
  description: string;
  gameID: number;
  author: string;
  contributers: UserData[];
  mods: string[];
}

export interface UserData {
  _id?: string;
  username: string;
  email: string;
  password?: string;
  notifications: NotifiactionType[];
}

export interface JWTPayload {
  userId: any;
  username: string;
}