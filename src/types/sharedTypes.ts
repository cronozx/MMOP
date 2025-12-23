export interface ModType {
  id?: string;
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
  name: string;
  description: string;
  gameID: number;
  author: string;
  contributers: UserData[];
  mods: string[];
}

export interface UserData {
  _id?: any;
  username: string;
  email: string;
  password?: string;
}

export interface JWTPayload {
  userId: any;
  username: string;
}