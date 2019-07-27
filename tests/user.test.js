/**
 * This test class is used to test all User endpoints in our server. 
 * 
 * It uses the 'jest' testing library in conjunction with the 'supertest' request testing library.
 * 
 * The good thing about 'supertest' is that we don't need the express server to be running (i.e. app.listen)
 */

const log = console.log

/******* LIBRARIES **********/
const request = require('supertest')        // Get the nodeJS testing library
const app = require('../src/app')           // Get our server express app
const jwt = require('jsonwebtoken')         // Used for authentication
const mongoose = require('mongoose')        // Used to create our own Object Id
const User = require('../src/models/user')  // Tests will require User database

/******* PROPERTIES **********/
const userOneId = new mongoose.Types.ObjectId()     // Create an object id for the User Document that is going to be saved in the DB

const userOne = {
    _id: userOneId,                 // Set the object id from above
    name : 'User One',
    email : 'userOne@gmail.com',
    password: 'nodejs!72',
    tokens: [{                      // Set the token ourselves
        token: jwt.sign({_id: userOneId}, process.env.JWT_SECRET)
    }]
}

// Runs once before all tests
beforeAll(() => {

})

//Runs before each test case
beforeEach(async () => {
    await User.deleteMany()         // Clear the DB before any requests

    // async create a new test user and save to DB
    await new User(userOne).save()
})

// Runs after each test case
afterEach(() => {

})

// Runs once after all tests
afterAll( () => {

})

/**
 * Description:
 *      Sends a test POST request to the user creation endpoint
 */
test('Test new user creation', async () => {
    await request(app).post('/users')           // Send 
        .send({
            name: "Test User",
            email: "haamed.sultani@gmail.com",
            password: "hhahahah123"
        })
        .set('Accept', 'application/json')
        .expect(201)
})

/**
 * Description:
 *      Sends a test POST request to the user login endpoint
 */
test('Should login existing user', async () => {
    await request(app).post('/users/login')
        .send({
            email: userOne.email,
            password: userOne.password
        })
        .set('Accept', 'application/json')
        .expect(200)
})

/**
 * Description:
 *      Sends a test POST request to the user login endpoint but with incorrect login information.
 * 
 */
test('Login should fail with existing user', async () => {
    await request(app).post('/users/login')
        .send({
            email: userOne.email,
            password : userOne.password + 'wrong'
        })
        .set('Accept', 'application/json')
        .expect(400)
})

/**
 * Description:
 *      Sends a test GET request to the endpoint that returns the user document if it is authenticated properly
 */
test('Get user profile with authentication', async () => {
    await request(app).get('/users/me')
        .send()
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`) // remember this is a template string (aka not an apostraphe)
        .set('Accept', 'application/json')
        .expect(200)
})

/**
 * Description:
 *      Sends a test GET request to the endpoint that returns the user document but without an auth token
 */
test('Getting user profile should fail authentication', async () => {
    await request(app).get('/users/me')
        .send()
        .set('Accept', 'application/json')
        .expect(401)            // Not authorized response
})

/**
 * Description:
 *      Sends a test DELETE request to the user deletion endpoint
 */
test('Testing user account deletion', async () => {
    await request(app).delete('/users/me')
        .send()
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .set('Accept', 'application/json')
        .expect(200)
})

/**
 * Description:
 *      Sends a test DELETE request to the user deletion endpoint which should fail since we aren't passing an auth token
 */
test('Testing user account deletion failure', async () => {
    await request(app).delete('/users/me')
        .send()
        .set('Accept', 'application/json')
        .expect(401)            // Not authorized response
})