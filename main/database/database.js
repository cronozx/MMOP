require('dotenv').config()
const { MongoClient } = require('mongodb')
const argon2 = require('@node-rs/argon2')

const client = new MongoClient(process.env.MONGO_URI)
let isConnected = false

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
//TODO: Implement jwt
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

    return {username: userData.username, email: userData.email, password: userData.password}
}

async function validateUser(username, password) {
    if (!username || !password) {
        return false
    }

    const user = await getUser(username)
    
    if (!user) {
        return false
    }

    return await argon2.verify(user.password, password)
}

//Modpack functions

//Mod functions
async function uploadMod(username, password, mod) {
    if (!username || !password) {
        return false
    }

    if (!(await validateUser(username, password))) {
        return false
    }

    //upload mod logic
}

module.exports = { connectDB, disconnectDB, addUser, getUser, validateUser, removeUser }