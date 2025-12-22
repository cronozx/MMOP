import dotenv from 'dotenv';
import { MongoClient, GridFSBucket } from 'mongodb';
import { connectDB, disconnectDB, addUser, removeUser, getUser, validateUser, uploadMod, getAllGames, validateWebToken } from '../main/database/database.js';
import argon2 from '@node-rs/argon2';
import fs from 'fs';
import path from 'path';
import os from 'os';
import jwt from 'jsonwebtoken';

dotenv.config();

describe('Database Functions - Integration Tests', () => {
  let client
  let database
  let collection

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGO_URI)
    await client.connect()
    database = client.db('modmngr')
    collection = database.collection('logins')
  })

  afterAll(async () => {
    await client.close()
    await disconnectDB() // Close the connection from database.js module
  })

  afterEach(async () => {
    // Clean up test data after each test
    await collection.deleteMany({ 
      $or: [
        { username: { $regex: /^testuser/ } },
        { email: { $regex: /^test.*@test\.com$/ } }
      ]
    })
  })

  describe('addUser', () => {
    it('should add user to database with hashed password', async () => {
      await addUser('testuser', 'test@test.com', 'testpassword')
      
      // Verify the user was added
      const user = await collection.findOne({ username: 'testuser' })
      expect(user).toBeTruthy()
      expect(user.username).toBe('testuser')
      expect(user.email).toBe('test@test.com')
      expect(user.password).toBeTruthy()
      expect(user.password).not.toBe('testpassword') // Should be hashed

      // Verify password was properly hashed with argon2
      const isValid = await argon2.verify(user.password, 'testpassword')
      expect(isValid).toBe(true)
    })

    it('should hash different passwords differently', async () => {
      await addUser('testuser1', 'test1@test.com', 'password1')
      await addUser('testuser2', 'test2@test.com', 'password2')
      
      const user1 = await collection.findOne({ username: 'testuser1' })
      const user2 = await collection.findOne({ username: 'testuser2' })
      
      expect(user1.password).not.toBe(user2.password)
    })

    it('should throw error when username is null or empty', async () => {
      await expect(addUser(null, 'test@test.com', 'password'))
        .rejects.toThrow('Username, email, and password are required')
      
      await expect(addUser('', 'test@test.com', 'password'))
        .rejects.toThrow('Username, email, and password are required')
    })

    it('should throw error when email is null or empty', async () => {
      await expect(addUser('testuser', null, 'password'))
        .rejects.toThrow('Username, email, and password are required')
      
      await expect(addUser('testuser', '', 'password'))
        .rejects.toThrow('Username, email, and password are required')
    })

    it('should throw error when password is null or empty', async () => {
      await expect(addUser('testuser', 'test@test.com', null))
        .rejects.toThrow('Username, email, and password are required')
      
      await expect(addUser('testuser', 'test@test.com', ''))
        .rejects.toThrow('Username, email, and password are required')
    })

    it('should throw error when all parameters are missing', async () => {
      await expect(addUser(null, null, null))
        .rejects.toThrow('Username, email, and password are required')
    })
  })

  describe('getUser', () => {
    beforeEach(async () => {
      // Add test users before each test
      await addUser('testuser', 'test@test.com', 'testpassword')
    })

    it('should get user by username', async () => {
      const user = await getUser('testuser')
      
      expect(user).toBeTruthy()
      expect(user.username).toBe('testuser')
      expect(user.email).toBe('test@test.com')
      expect(user.password).toBeTruthy()
    })

    it('should get user by email', async () => {
      const user = await getUser(null, 'test@test.com')
      
      expect(user).toBeTruthy()
      expect(user.username).toBe('testuser')
      expect(user.email).toBe('test@test.com')
      expect(user.password).toBeTruthy()
    })

    it('should return null if user not found by username', async () => {
      const user = await getUser('nonexistentuser')
      
      expect(user).toBeNull()
    })

    it('should return null if user not found by email', async () => {
      const user = await getUser(null, 'nonexistent@test.com')
      
      expect(user).toBeNull()
    })

    it('should prioritize username over email when both provided', async () => {
      const user = await getUser('testuser', 'wrong@test.com')
      
      expect(user).toBeTruthy()
      expect(user.email).toBe('test@test.com')
    })
  })

  describe('validateUser', () => {
    beforeEach(async () => {
      // Add test user before each test
      await addUser('testuser', 'test@test.com', 'correctpassword')
    })

    it('should return true for correct username and password', async () => {
      const isValid = await validateUser('testuser', 'correctpassword')
      
      expect(isValid).toBe(true)
    })

    it('should return false for correct username but wrong password', async () => {
      const isValid = await validateUser('testuser', 'wrongpassword')
      
      expect(isValid).toBe(false)
    })

    it('should return false for non-existent username', async () => {
      const isValid = await validateUser('nonexistentuser', 'anypassword')
      
      expect(isValid).toBe(false)
    })

    it('should return false for empty password', async () => {
      const isValid = await validateUser('testuser', '')
      
      expect(isValid).toBe(false)
    })

    it('should return false when username is null or undefined', async () => {
      const isValidNull = await validateUser(null, 'password')
      expect(isValidNull).toBe(false)
      
      const isValidUndefined = await validateUser(undefined, 'password')
      expect(isValidUndefined).toBe(false)
    })

    it('should return false when password is null or undefined', async () => {
      const isValidNull = await validateUser('testuser', null)
      expect(isValidNull).toBe(false)
      
      const isValidUndefined = await validateUser('testuser', undefined)
      expect(isValidUndefined).toBe(false)
    })

    it('should return false when both username and password are null', async () => {
      const isValid = await validateUser(null, null)
      expect(isValid).toBe(false)
    })
  })

  describe('removeUser', () => {
    beforeEach(async () => {
      // Add test user before each test
      await addUser('testuser', 'test@test.com', 'testpassword')
    })

    it('should remove user with correct email and password', async () => {
      const result = await removeUser('test@test.com', 'testpassword')
      
      expect(result).toBe(true)
      
      // Verify user was actually removed
      const user = await collection.findOne({ email: 'test@test.com' })
      expect(user).toBeNull()
    })

    it('should not remove user with wrong password', async () => {
      const result = await removeUser('test@test.com', 'wrongpassword')
      
      expect(result).toBe(false)
      
      // Verify user still exists
      const user = await collection.findOne({ email: 'test@test.com' })
      expect(user).toBeTruthy()
    })

    it('should return false for non-existent email', async () => {
      const result = await removeUser('nonexistent@test.com', 'anypassword')
      
      expect(result).toBe(false)
    })

    it('should not remove user with empty password', async () => {
      const result = await removeUser('test@test.com', '')
      
      expect(result).toBe(false)
      
      // Verify user still exists
      const user = await collection.findOne({ email: 'test@test.com' })
      expect(user).toBeTruthy()
    })

    it('should return false when email is null or undefined', async () => {
      const resultNull = await removeUser(null, 'password')
      expect(resultNull).toBe(false)
      
      const resultUndefined = await removeUser(undefined, 'password')
      expect(resultUndefined).toBe(false)
    })

    it('should return false when password is null or undefined', async () => {
      const resultNull = await removeUser('test@test.com', null)
      expect(resultNull).toBe(false)
      
      const resultUndefined = await removeUser('test@test.com', undefined)
      expect(resultUndefined).toBe(false)
      
      // Verify user still exists
      const user = await collection.findOne({ email: 'test@test.com' })
      expect(user).toBeTruthy()
    })

    it('should return false when both email and password are null', async () => {
      const result = await removeUser(null, null)
      expect(result).toBe(false)
    })
  })

  describe('connectDB and disconnectDB', () => {
    it('should connect to database', async () => {
      // Note: connectDB is likely already called by other tests
      // This test verifies it can be called without errors
      await expect(connectDB()).resolves.toBeTruthy()
    })

    it('should disconnect from database and reconnect', async () => {
      await disconnectDB()
      await expect(connectDB()).resolves.toBeTruthy()
    })
  })

  describe('uploadMod', () => {
    let bucket
    let testFilePath
    let testFileContent = 'This is a test mod file content'

    beforeAll(() => {
      // Create GridFSBucket instance
      bucket = new GridFSBucket(database, { bucketName: 'mods' })
    })

    beforeEach(async () => {
      // Add test user before each test
      await addUser('testmodder', 'modder@test.com', 'modpassword')

      // Create a temporary test file
      testFilePath = path.join(os.tmpdir(), 'test-mod.zip')
      fs.writeFileSync(testFilePath, testFileContent)
    })

    afterEach(async () => {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }

      // Clean up uploaded mods from GridFS
      const files = await bucket.find({ filename: { $regex: /^testmod/ } }).toArray()
      for (const file of files) {
        await bucket.delete(file._id)
      }
    })

    it('should upload mod file with valid credentials', async () => {
      const mod = {
        name: 'testmod.zip',
        filePath: testFilePath
      }

      const result = await uploadMod('testmodder', 'modpassword', mod)
      
      expect(result).toBe(true)

      // Verify the file was uploaded to GridFS
      const files = await bucket.find({ filename: 'testmod.zip' }).toArray()
      expect(files).toHaveLength(1)
      expect(files[0].filename).toBe('testmod.zip')
    })

    it('should upload file content correctly', async () => {
      const mod = {
        name: 'testmod-content.zip',
        filePath: testFilePath
      }

      await uploadMod('testmodder', 'modpassword', mod)

      // Download and verify file content
      const files = await bucket.find({ filename: 'testmod-content.zip' }).toArray()
      expect(files).toHaveLength(1)

      const downloadStream = bucket.openDownloadStream(files[0]._id)
      const chunks = []
      
      await new Promise((resolve, reject) => {
        downloadStream.on('data', (chunk) => chunks.push(chunk))
        downloadStream.on('end', resolve)
        downloadStream.on('error', reject)
      })

      const downloadedContent = Buffer.concat(chunks).toString()
      expect(downloadedContent).toBe(testFileContent)
    })

    it('should return false when username is missing', async () => {
      const mod = {
        name: 'testmod.zip',
        filePath: testFilePath
      }

      const result = await uploadMod(null, 'modpassword', mod)
      
      expect(result).toBe(false)

      // Verify no file was uploaded
      const files = await bucket.find({ filename: 'testmod.zip' }).toArray()
      expect(files).toHaveLength(0)
    })

    it('should return false when password is missing', async () => {
      const mod = {
        name: 'testmod.zip',
        filePath: testFilePath
      }

      const result = await uploadMod('testmodder', null, mod)
      
      expect(result).toBe(false)

      // Verify no file was uploaded
      const files = await bucket.find({ filename: 'testmod.zip' }).toArray()
      expect(files).toHaveLength(0)
    })

    it('should return false with wrong password', async () => {
      const mod = {
        name: 'testmod.zip',
        filePath: testFilePath
      }

      const result = await uploadMod('testmodder', 'wrongpassword', mod)
      
      expect(result).toBe(false)

      // Verify no file was uploaded
      const files = await bucket.find({ filename: 'testmod.zip' }).toArray()
      expect(files).toHaveLength(0)
    })

    it('should return false with non-existent username', async () => {
      const mod = {
        name: 'testmod.zip',
        filePath: testFilePath
      }

      const result = await uploadMod('nonexistentuser', 'anypassword', mod)
      
      expect(result).toBe(false)

      // Verify no file was uploaded
      const files = await bucket.find({ filename: 'testmod.zip' }).toArray()
      expect(files).toHaveLength(0)
    })

    it('should handle file read errors gracefully', async () => {
      const mod = {
        name: 'testmod-error.zip',
        filePath: '/nonexistent/path/to/file.zip'
      }

      await expect(uploadMod('testmodder', 'modpassword', mod))
        .rejects.toThrow()
    })

    it('should handle multiple file uploads from same user', async () => {
      const mod1 = {
        name: 'testmod-1.zip',
        filePath: testFilePath
      }

      const mod2 = {
        name: 'testmod-2.zip',
        filePath: testFilePath
      }

      const result1 = await uploadMod('testmodder', 'modpassword', mod1)
      const result2 = await uploadMod('testmodder', 'modpassword', mod2)
      
      expect(result1).toBe(true)
      expect(result2).toBe(true)

      // Verify both files were uploaded
      const files = await bucket.find({ filename: { $regex: /^testmod-/ } }).toArray()
      expect(files).toHaveLength(2)
    })
  })

  describe('getAllGames', () => {
    let gamesCollection
    let validToken
    let invalidToken

    beforeAll(async () => {
      gamesCollection = database.collection('games')
      
      // Create a valid token
      validToken = jwt.sign({ 
        userId: 'testuser123',
        username: 'testgamer' 
      }, process.env.JWT_SECRET_KEY, {
        expiresIn: '1h',
      })
      
      // Create an invalid token with wrong secret
      invalidToken = jwt.sign({ 
        userId: 'testuser123',
        username: 'testgamer' 
      }, 'wrong-secret', {
        expiresIn: '1h',
      })
    })

    beforeEach(async () => {
      // Clean up any existing test games first
      await gamesCollection.deleteMany({ 
        $or: [
          { name: { $regex: /^Test Game/ } },
          { name: { $regex: /^Minecraft$/ } }
        ]
      })

      // Insert test games before each test
      await gamesCollection.insertMany([
        {
          id: 1,
          name: 'Test Game 1',
          modCount: 10,
          imagePath: '/images/game1.png',
          allowedTypes: { jar: true, zip: false },
          extensions: '.jar',
          description: 'First test game'
        },
        {
          id: 2,
          name: 'Test Game 2',
          modCount: 25,
          imagePath: '/images/game2.png',
          allowedTypes: { jar: true, zip: true },
          extensions: '.jar,.zip',
          description: 'Second test game'
        },
        {
          id: 3,
          name: 'Test Game 3',
          modCount: 0,
          imagePath: '/images/game3.png',
          allowedTypes: { jar: false, zip: true },
          extensions: '.zip',
          description: 'Third test game'
        }
      ])
    })

    afterEach(async () => {
      // Clean up test games after each test
      await gamesCollection.deleteMany({ 
        name: { $regex: /^Test Game/ }
      })
    })

    it('should return all games with valid token', async () => {
      const games = await getAllGames(validToken)
      
      expect(games).toHaveLength(3)
      expect(games[0]).toMatchObject({
        id: 1,
        name: 'Test Game 1',
        modCount: 10,
        imagePath: '/images/game1.png',
        extensions: '.jar',
        description: 'First test game'
      })
      expect(games[0].allowedTypes).toEqual({ jar: true, zip: false })
    })

    it('should return games in correct order', async () => {
      const games = await getAllGames(validToken)
      
      expect(games[0].name).toBe('Test Game 1')
      expect(games[1].name).toBe('Test Game 2')
      expect(games[2].name).toBe('Test Game 3')
    })

    it('should return all game properties correctly', async () => {
      const games = await getAllGames(validToken)
      
      games.forEach(game => {
        expect(game).toHaveProperty('id')
        expect(game).toHaveProperty('name')
        expect(game).toHaveProperty('modCount')
        expect(game).toHaveProperty('imagePath')
        expect(game).toHaveProperty('allowedTypes')
        expect(game).toHaveProperty('extensions')
        expect(game).toHaveProperty('description')
      })
    })

    it('should return empty array with invalid token', async () => {
      const games = await getAllGames(invalidToken)
      
      expect(games).toEqual([])
    })

    it('should return empty array with null token', async () => {
      const games = await getAllGames(null)
      
      expect(games).toEqual([])
    })

    it('should return empty array with undefined token', async () => {
      const games = await getAllGames(undefined)
      
      expect(games).toEqual([])
    })

    it('should return empty array with empty string token', async () => {
      const games = await getAllGames('')
      
      expect(games).toEqual([])
    })

    it('should return empty array with malformed token', async () => {
      const games = await getAllGames('not-a-valid-jwt-token')
      
      expect(games).toEqual([])
    })

    it('should return empty array when games collection is empty', async () => {
      // Remove all test games and any other games
      await gamesCollection.deleteMany({})
      
      const games = await getAllGames(validToken)
      
      expect(games).toEqual([])
    })

    it('should handle games with different allowedTypes structures', async () => {
      await gamesCollection.insertOne({
        id: 4,
        name: 'Test Game 4',
        modCount: 5,
        imagePath: '/images/game4.png',
        allowedTypes: { jar: true, zip: true, pak: true },
        extensions: '.jar,.zip,.pak',
        description: 'Game with multiple types'
      })
      
      const games = await getAllGames(validToken)
      
      const game4 = games.find(g => g.id === 4)
      expect(game4).toBeTruthy()
      expect(game4.allowedTypes).toEqual({ jar: true, zip: true, pak: true })
    })

    it('should handle games with zero mod count', async () => {
      const games = await getAllGames(validToken)
      
      const gameWithNoMods = games.find(g => g.id === 3)
      expect(gameWithNoMods).toBeTruthy()
      expect(gameWithNoMods.modCount).toBe(0)
    })

    it('should not expose database-specific fields like _id', async () => {
      const games = await getAllGames(validToken)
      
      games.forEach(game => {
        expect(game).not.toHaveProperty('_id')
      })
    })

    it('should return consistent data structure for all games', async () => {
      const games = await getAllGames(validToken)
      
      const firstGameKeys = Object.keys(games[0]).sort()
      
      games.forEach(game => {
        const gameKeys = Object.keys(game).sort()
        expect(gameKeys).toEqual(firstGameKeys)
      })
    })
  })
})