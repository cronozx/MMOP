import dotenv from 'dotenv';
import { MongoClient, GridFSBucket, Collection, Db } from 'mongodb';
import argon2 from '@node-rs/argon2';
import jwt from 'jsonwebtoken';
import store from '../utils/store';
import { Readable } from 'stream';

dotenv.config();

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

interface GameType {
    id: number;
    name: string;
    modCount: number;
    imagePath: string;
    acceptedTypes: Record<string, unknown>;
    extensions: string;
    description: string;
}

interface ModpackType {
    name: string,
    description: string,
    gameID: number,
    author: string,
    contributers: string[],
    mods: string[]
}

interface UserData {
    _id?: any;
    username: string;
    email: string;
    password: string;
}

interface JWTPayload {
    userId: any;
    username: string;
}

let isConnected = false;
const client = new MongoClient(process.env.MONGO_URI as string);

//General functions
async function connectDB(): Promise<MongoClient> {
    if (!isConnected) {
        await client.connect()
        isConnected = true
        console.log('Connected to MongoDB')
    }
    return client
}

async function disconnectDB(): Promise<void> {
    if (isConnected) {
        await client.close()
        isConnected = false
        console.log('Disconnected from MongoDB')
    }
}

async function startQuery(collection: string): Promise<Collection> {
    await connectDB()
    
    const database: Db = client.db("modmngr")
    return database.collection(collection)
}

//User functions
async function addUser(username: string, email: string, password: string): Promise<void> {
    if (!username || !email || !password) {
        throw new Error('Username, email, and password are required')
    }

    const logins = await startQuery("logins")

    const passwordHash = await argon2.hash(password)

    await logins.insertOne({
        username: username, 
        email: email,
        password: passwordHash,
    })
}

async function removeUser(email: string, password: string): Promise<boolean> {
    if (!email || !password) {
        return false
    }

    const logins = await startQuery("logins")

    const userData = await logins.findOne({
        email: email
    }) as UserData | null

    if (!userData) {
        return false
    }

    const isValid = await argon2.verify(userData.password, password)
    
    if (isValid) {
        await logins.deleteOne({
            email: email
        })

        if (store.has('authToken')) {
            store.delete('authToken')
        }

        return true
    }
    
    return false
}

async function getUser(username: string | null = null, email: string | null = null): Promise<UserData | null> {
    const logins = await startQuery("logins")
    
    let userData: UserData | null = null

    if (username != null) {
        userData = await logins.findOne({
            username: username
        }) as UserData | null
    } else if (email != null) {
        userData = await logins.findOne({
            email: email
        }) as UserData | null
    }

    if (!userData) {
        return null
    }

    return {_id: userData._id, username: userData.username, email: userData.email, password: userData.password}
}

async function validateUser(username: string, password: string): Promise<boolean> {
    if (!username || !password) {
        return false
    }

    const user = await getUser(username)
    
    if (!user) {
        return false
    }

    if (await argon2.verify(user.password, password)) {
        const token = jwt.sign({ 
            userId: user._id,
            username: username 
        } as JWTPayload, process.env.JWT_SECRET_KEY as string, {
            expiresIn: '1h',
        });

        store.set('authToken', token)
        return true;
    } else {
        return false
    }
}

function validateWebToken(token: string): boolean {
    console.log(`Token: ${token}`)

    if (!token) {
        return false;
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET_KEY as string);
        return true;
    } catch (error: any) {
        console.log(`Token not valid: ${error.message}`)
        if (store.has('authToken')) {
            store.delete('authToken')
        }
        
        return false;
    }
}

function getUsernameFromToken(): string | null {
    const token = store.get('authToken');
    
    if (!token) {
        return null;
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JWTPayload;
        return decoded.username;
    } catch (error: any) {
        console.log(`Failed to extract username from token: ${error.message}`);
        return null;
    }
}

//Modpack functions

//Mod functions
function isJarBuffer(buffer: Buffer): boolean {
    if (buffer.length < 2) {
        return false;
    }
    
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        return false;
    }

    return true;
}

async function uploadMod(token: string, mod: ModType): Promise<boolean> {
    if (!validateWebToken(token)) {
        throw new Error('Invalid authentication token');
    }

    if (!mod || !mod.file || !mod.file.buffer) {
        throw new Error('Missing mod file or file buffer');
    }

    const fileBuffer = Buffer.from(mod.file.buffer);
    
    console.log('Attempting to upload mod:', mod.name);
    console.log('Buffer size:', fileBuffer.length);
    
    if (!isJarBuffer(fileBuffer)) {
        throw new Error('File is not a valid JAR file');
    }

    const db = client.db('modmngr')
    const bucket = new GridFSBucket(db, {bucketName: 'mods'})

    return new Promise((resolve, reject) => {
        const readStream = Readable.from(fileBuffer);
        const uploadStream = bucket.openUploadStream(mod.name, {
            metadata: {
                author: mod.author,
                game: mod.game
            }
        });
        
        readStream
            .on('error', (error) => {
                console.error('Read stream error:', error);
                reject(error);
            })
            .pipe(uploadStream)
            .on('error', (error) => {
                console.error('Upload stream error:', error);
                reject(error);
            })
            .on('finish', async () => {
                console.log('Upload finished successfully');

                try {
                    const gamesCollection = db.collection('games');
                    const result = await gamesCollection.updateOne(
                        { id: mod.game },
                        { $inc: { modCount: 1 } }
                    );
                    
                    if (result.matchedCount === 0) {
                        console.warn(`No game found with id ${mod.game}`);
                    } else {
                        console.log(`Incremented mod count for game ${mod.game}`);
                    }
                } catch (error) {
                    console.error('Failed to increment mod count:', error);
                }

                resolve(true);
            });
    })
}

//Game functions
async function getAllGames(token: string): Promise<GameType[]> {
    if (!validateWebToken(token)) {
        return [];
    }

    const collection = await startQuery('games');

    console.log(await collection.find().toArray())

    const games: GameType[] = (await collection.find().toArray()).map((doc): GameType => {
        return {
            id: doc.id,
            name: doc.name,
            modCount: doc.modCount,
            imagePath: doc.imagePath,
            acceptedTypes: doc.acceptedTypes,
            extensions: doc.extensions,
            description: doc.description
        }
    });

    return games;
}


export { connectDB, disconnectDB, addUser, getUser, validateUser, removeUser, validateWebToken, getUsernameFromToken, uploadMod, getAllGames };
export type { GameType };