import dotenv from 'dotenv';
import { MongoClient, GridFSBucket, Collection, Db, ObjectId } from 'mongodb';
import argon2 from '@node-rs/argon2';
import jwt from 'jsonwebtoken';
import store from '../utils/store';
import { Readable } from 'stream';
import { GameType, JWTPayload, ModpackType, ModType, NotifiactionType, UserData } from '../../types/sharedTypes';

dotenv.config();

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

    if (await logins.findOne({ username: username }) || await logins.findOne({ email: email })) {
        throw new Error('Username or email already exists')
    }

    const passwordHash = await argon2.hash(password)

    await logins.insertOne({
        username: username, 
        email: email,
        password: passwordHash,
        notifications: []
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

    if (!userData || !userData.password) {
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

    return {_id: userData._id, username: userData.username, email: userData.email, password: userData.password, notifications: userData.notifications}
}

async function getAllUsers(token: string): Promise<UserData[] | null> {
    if (!validateWebToken(token)) {
        return null;
    }

    const users = await startQuery('logins');
    const userData = await users.find().toArray()

    return userData.map(data => ({
        _id: data._id.toString(),
        username: data.username,
        email: data.email,
        notifications: data.notifications
    }))
} 

async function validateUser(username: string, password: string): Promise<boolean> {
    if (!username || !password) {
        return false
    }

    const userData = await getUser(username)
    
    if (!userData || !userData.password) {
        return false
    }

    if (await argon2.verify(userData.password, password)) {
        const token = jwt.sign({ 
            userId: userData._id,
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

function getUserDataFromToken(): {username: string, _id: string} | null {
    const token = store.get('authToken');
    
    if (!token) {
        return null;
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JWTPayload;
        return { username: decoded.username, _id: decoded.userId };
    } catch (error: any) {
        console.log(`Failed to extract username from token: ${error.message}`);
        return null;
    }
}


//Notification functions
async function getNotifications(token: string, _id: string): Promise<NotifiactionType[]> {
    if (!validateWebToken(token)) {
        return [];
    }

    const objId = new ObjectId(_id)

    try {
        const users = await startQuery('logins');
        const user = await users.findOne({ _id: objId });

        if (!user) {
            return [];
        }

        return user.notifications;
    } catch (e) {
        console.log(`Error getting notifications ${e}`)
        return [];
    }
}

async function removeNotification(token: string, notificationId: string): Promise<void> {
    if (!validateWebToken(token)) {
        return;
    }

    const objId = new ObjectId(getUserDataFromToken()?._id);

    try {
        const users = await startQuery('logins');
        const user = await users.findOne({ _id: objId });

        if (!user) {
            return;
        }

        let notifications: NotifiactionType[] = user.notifications;
        notifications = notifications.filter(notification => notification.id !== notificationId);
        
        await users.updateOne({ _id: objId }, {$set: { notifications: notifications }})
    } catch (e) {
        console.log(`Error deleting notification ${e}`)
    }
}

async function sendNotification(token: string, _id: string, notification: NotifiactionType): Promise<boolean> {
    if (!validateWebToken(token)) {
        return false;
    }

    return new Promise(async (resolve, reject) => {
        try {
            const objId = new ObjectId(_id)
            const users = await startQuery('logins');
            const user = await users.findOne({ _id: objId });
            
            if (!user) {
                resolve(false);
                return;
            }

            const notifications = [notification, ...user.notifications];
            users.updateOne({ _id: objId }, { $set: { notifications: notifications } });
            
            resolve(true);
        } catch (e) {
            reject(`Could not send notification ${e}`)
        }
    });
}

async function markNotificationsAsRead(token: string): Promise<void> {
    if (!validateWebToken(token)) {
        return;
    }

    const user_Id = new ObjectId(getUserDataFromToken()?._id);

    const users = await startQuery('logins');
    const user = await users.findOne({ _id: user_Id });

    if (!user) {
        return;
    }

    const notifications: NotifiactionType[] = user.notifications.map((n: NotifiactionType) => ({ ...n, unread: false }));
    await users.updateOne({ _id: user_Id }, { $set: {notifications: notifications} })
}

async function handleRequestAction(token: string, modpack_Id: string, accepted: boolean): Promise<void> {
    console.log(`[handleRequestAction] Called with token: ${token ? '[REDACTED]' : '[EMPTY]'}, modpack_Id: ${modpack_Id}, accepted: ${accepted}`);

    if (!validateWebToken(token)) {
        console.log('[handleRequestAction] Invalid token.');
        return;
    }

    const user_Id = getUserDataFromToken()?._id;
    const objId = new ObjectId(modpack_Id);
    const modpack = await getModpack(objId);

    if (!modpack) {
        console.log(`[handleRequestAction] Modpack not found for id: ${modpack_Id}`);
        return;
    }
    if (!modpack.contributers) {
        console.log('[handleRequestAction] Modpack has no contributers object.');
        return;
    }
    if (!user_Id) {
        console.log('[handleRequestAction] No user_Id found from token.');
        return;
    }

    if (accepted) {
        modpack.contributers[user_Id] = accepted;
        console.log(`[handleRequestAction] User ${user_Id} accepted. Updating contributers:`, modpack.contributers);
        await updateModpack(token, modpack);
    } else {
        delete modpack.contributers[user_Id];
        console.log(`[handleRequestAction] User ${user_Id} rejected/removed. Updating contributers:`, modpack.contributers);
        await updateModpack(token, modpack);
    }
}

//Modpack functions
async function createModpack(token: string, modPackInfo: ModpackType): Promise<boolean> {
    if (!validateWebToken(token)) {
        return false;
    }

    return new Promise(async (resolve, reject) => {
        try {
            const modpacks = await startQuery('modpacks');
            const { _id, ...modpackData } = modPackInfo;

            if (modpackData.contributers instanceof Map) {
                modpackData.contributers = Object.fromEntries(
                    Array.from(modpackData.contributers.entries()).map(([user, value]) => [user._id, value])
                );
            }
            modpacks.insertOne(modpackData);
            resolve(true)
        } catch {
            reject('Failed to create modpack')
        }
    })
}

async function getUsersModpacks(token: string): Promise<ModpackType[]> {
    if (!validateWebToken(token)) {
        return [];
    }

    try {
        const modpacks = await startQuery('modpacks');
        const userData = getUserDataFromToken();
        const username = userData?.username;
        const userId = userData?._id;
        const docs = await modpacks.find({
            $or: [
                { author: username },
                { [`contributers.${userId}`]: true }
            ]
        }).toArray();

        const modpacksList = await Promise.all(docs.map(async doc => getModpack(doc._id)));
        return modpacksList.filter((modpack): modpack is ModpackType => modpack !== null);
    } catch (error) {
        console.error('Failed to retrieve modpacks:', error);
        return [];
    }
}

async function getModpack(_id: ObjectId): Promise<ModpackType | null> {
    const modpacks = await startQuery('modpacks');
    const doc = await modpacks.findOne({ _id: _id });

    if (!doc) {
        return null;
    }

    const contributers: { [userId: string]: boolean } = Object.fromEntries(Object.entries(doc.contributers));

    return {
        _id: doc._id.toString(),
        name: doc.name,
        description: doc.description,
        gameID: doc.gameID,
        author: doc.author,
        contributers: contributers,
        mods: doc.mods
    }
}

async function updateModpack(token: string, updatedModpack: ModpackType): Promise<boolean> {
    if (!validateWebToken(token)) {
        return false;
    }

    try {
        const modpacks = await startQuery('modpacks');
        const { _id: modpackId, ...updatedModpackData } = updatedModpack;
        updatedModpackData.contributers = updatedModpack.contributers;
        const res = await modpacks.updateOne({ _id: new ObjectId(modpackId) }, { $set: updatedModpackData });
        return res.modifiedCount > 0;
    } catch (error) {
        console.error('Failed to update modpack:', error);
        return false;
    }
}

//Mod functions
async function getAllModsForGame(token: string, gameId: number): Promise<Array<{_id: string, name: string, author: string}>> {
    if (!validateWebToken(token)) {
        return [];
    }

    try {
        const db = client.db('modmngr');
        const bucket = new GridFSBucket(db, {bucketName: 'mods'});
        
        const files = await bucket.find({ 'metadata.game': gameId }).toArray();
        
        return files.map(file => ({
            _id: file._id.toString(),
            name: file.filename,
            author: file.metadata?.author || 'Unknown'
        }));
    } catch (error) {
        console.error('Error fetching mods:', error);
        return [];
    }
}

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


export { connectDB, disconnectDB, addUser, getUser, getAllUsers, validateUser, removeUser, validateWebToken, getUserDataFromToken, uploadMod, getAllGames, createModpack, getUsersModpacks, updateModpack, getAllModsForGame, getNotifications, removeNotification, sendNotification, markNotificationsAsRead, handleRequestAction };