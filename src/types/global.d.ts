/// <reference types="node" />

interface DbAPI {
  validateUser: (username: string, password: string) => Promise<boolean>;
  addUser: (username: string, email: string, password: string) => Promise<void>;
  getAllUsers: (token: string) => Promise<UserData[] | null>;
  getAuthToken: () => Promise<string | undefined>;
  getUsername: () => Promise<string | null>;
  validateAuthToken: (token: string) => Promise<boolean>;
  clearLogin: () => Promise<void>;
  uploadMod: (token: string, mod: ModType) => Promise<void>;
  getAllGames: (token: string) => Promise<Game[]>;
  createModpack: (token: string, modpackinfo: ModpackType) => Promise<boolean>;
  getAllModpacks: (token: string) => Promise<ModpackType[]>;
  updateModpack: (token: string, modpackName: string, updatedModpack: ModpackType) => Promise<boolean>;
  getAllModsForGame: (token: string, gameId: number) => Promise<ModType[]>;
}

declare global {
  interface Window {
    db: DbAPI;
  }
}

export {};