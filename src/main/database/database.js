import dotenv from 'dotenv';
import { MongoClient, GridFSBucket } from 'mongodb';
import argon2 from '@node-rs/argon2';
import jwt from 'jsonwebtoken';
import store from '../utils/store.js';
import fs from 'fs'

dotenv.config();
let isConnected = false
const client = new MongoClient(process.env.MONGO_URI)
//All games will be stored as ids
const Mod = {
    name: String,
    author: String,
    game: Number,
    file: File
}

//General functions
async function connectDB() {
    if (!isConnected) {
        await client.connect()
        isConnected = true
        console.log('Connected to MongoDB')
    }
    return client
}

async function disconnectDB() {
    if (isConnected) {
        await client.close()
        isConnected = false
        console.log('Disconnected from MongoDB')
    }
}

async function startQuery(collection) {
    await connectDB()
    
    const database = client.db("modmngr")
    return database.collection(collection)
}

//User functions
async function addUser(username, email, password) {
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

async function removeUser(email, password) {
    if (!email || !password) {
        return false
    }

    const logins = await startQuery("logins")

    const userData = await logins.findOne({
        email: email
    })

    if (!userData) {
        return false
    }

    const isValid = await argon2.verify(userData.password, password)
    
    if (isValid) {
        await logins.deleteOne({
            email: email
        })

        if (store.has('auth_token')) {
            store.delete('auth_token')
        }

        return true
    }
    
    return false
}

async function getUser(username=null, email=null) {
    const logins = await startQuery("logins")
    
    let userData = null

    if (username != null) {
        userData = await logins.findOne({
            username: username
        })
    } else if (email != null) {
        userData = await logins.findOne({
            email: email
        })
    }

    if (!userData) {
        return null
    }

    return {_id: userData._id, username: userData.username, email: userData.email, password: userData.password}
}

async function validateUser(username, password) {
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
        }, process.env.JWT_SECRET_KEY, {
            expiresIn: '1h',
        });

        store.set('authToken', token)
        return true;
    }
}

function validateWebToken(token) {
    console.log(`Token: ${token}`)

    if (!token) {
        return false;
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET_KEY);
        return true;
    } catch (error) {
        console.log(`Token not valid: ${error.message}`)
        if (store.has('authToken')) {
            store.delete('authToken')
        }
        
        return false;
    }
}

function getUsernameFromToken() {
    const token = store.get('authToken');
    
    if (!token) {
        return null;
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        return decoded.username;
    } catch (error) {
        console.log(`Failed to extract username from token: ${error.message}`);
        return null;
    }
}

//Modpack functions

//Mod functions
async function uploadMod(username, password, mod) {
    if (!username || !password) {
        return false
    }

    if (await validateUser(username, password) != null) {
        return false
    }

    //upload mod logic
    const db = client.db('modmngr')
    const bucket = new GridFSBucket(db, {bucketName: 'mods'})

    return new Promise((resolve, reject) => {
        fs.createReadStream(mod.filePath)
            .pipe(bucket.openUploadStream(mod.name)) 
            .on('finish', () => resolve(true))
            .on('error', (error) => reject(error))
    })
}

export { connectDB, disconnectDB, addUser, getUser, validateUser, removeUser, Mod, validateWebToken, getUsernameFromToken };