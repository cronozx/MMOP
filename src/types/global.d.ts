/// <reference types="node" />

interface DbAPI {
  validateUser: (username: string, password: string) => Promise<boolean>;
  addUser: (username: string, email: string, password: string) => Promise<void>;
  getAuthToken: () => Promise<string | undefined>;
  getUsername: () => Promise<string | null>;
  validateAuthToken: (token: string) => Promise<boolean>;
  clearLogin: () => Promise<void>;
  uploadMod: (token: string, mod: ModType) => Promise<void>;
  getAllGames: (token: string) => Promise<Game[]>;
}

interface ModType {
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

interface Game {
  id: number;
  name: string;
  modCount: number;
  imagePath: string;
  acceptedTypes: Record<string, unknown>;
  extensions: string;
  description: string;
}

declare global {
  interface Window {
    db: DbAPI;
  }
}

export {};