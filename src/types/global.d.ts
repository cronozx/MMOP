/// <reference types="node" />

import { ObjectId } from "mongodb";
import { NotifiactionType } from "./sharedTypes";

interface DbAPI {
  validateUser: (username: string, password: string) => Promise<boolean>;
  addUser: (username: string, email: string, password: string) => Promise<void>;
  getAllUsers: (token: string) => Promise<UserData[] | null>;
  getAuthToken: () => Promise<string | undefined>;
  getUserDataFromToken: () => Promise<{username: string, _id: string} | null>;
  validateAuthToken: (token: string) => Promise<boolean>;
  clearLogin: () => Promise<void>;
  uploadMod: (token: string, mod: ModType) => Promise<void>;
  getAllGames: (token: string) => Promise<Game[]>;
  createModpack: (token: string, modpackinfo: ModpackType) => Promise<boolean>;
  getAllModpacks: (token: string) => Promise<ModpackType[]>;
  updateModpack: (token: string, updatedModpack: ModpackType) => Promise<boolean>;
  getAllModsForGame: (token: string, gameId: number) => Promise<ModType[]>;
  getNotifications: (token: string, _id: string) => Promise<NotifiactionType[]>;
  removeNotification: (token: string, notificationId) => Promise<void>;
  sendNotification: (token: string, _id: string, notification: NotifiactionType) => Promise<boolean>;
  markNotificationsAsRead: (token: string) => Promise<void>;
  handleRequestAction: (token: string, modpack_Id: string, accepted: boolean) => Promise<void>;
  randUUID: () => Promise<string>;
}

declare global {
  interface Window {
    db: DbAPI;
  }
}

export {};