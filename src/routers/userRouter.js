const log = console.log

const express = require('express')
const router = new express.Router()

const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')                            // Used for file transfers on the server
const sharp = require('sharp')                              // Used to modify images
const { sendWelcomeEmail, 
        sendCancelEmail } = require('../emails/account')   // Using desctructuring to get the email methods 

        
/**
 * Description:
 *      Returns the user's profile back to the user once they
 *      are authenticated.
 * 
 * Parameters:
 *      URL: the endpoint
 *      auth: the auth middleware
 */
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)          // Send a response with the user object that was passed in from the auth middleware
})

/**
 * Description:
 *      Return the user's avatar by the object_id
 * 
 * Parameters:
 *      id: The user's ID from the mongoDB  
 */
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)             // Fetch the User Document from the DB
        
        if (!user || !user.avatar) {                                // If the User or image is null
            throw new Error('User or avatar doesn\'t exist')            // Respond with an error
        }

        // Set header and respond with avatar's binary data
        res.set('Content-Type', 'image/png')                                             // Setting the response header
        res.send(user.avatar)                                                               // The good thing with express is that                                                                                       if we don't supply a header then it will                                                                                        automatically set the Content-Type to                                                                                        'application/json'
    } catch (e) {
        res.status(404).send(e)
    }
})



 /**
  * Description: Updates the User Document using the request's body
  * 
  * Parameters:
  *         :id - the _id of the User Document we want to update
  *         body - contains the an object with key-value pairs of the properties we want to update
  * 
  * EXAMPLE:
  *     localhost:3000/users/j1hk2jeh1jk2hk
  *     body:   { 
  *                 name : "new name"
  *             }
  */
 router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)                           // An array of all the key's from the body of the request
    const allowedUpdates = ['name', 'email', 'password', 'age']     // All the properties we are allowing to be updated by the user
    // Goes through every element, does the conditional, returns false if 1 or more is false
    const isValidOperation = updates.every((key) => {
        return allowedUpdates.includes(key)
    })
    
    if (!isValidOperation) {
        return res.status(400).send({error : 'You are trying to update a User property that is not allowed or doesn\'t exist'})
    }
    
    try {
        const user = req.user                                       // Get the user
        
        // Go through each element in the array
        updates.forEach((update) => {                               // For each key in the array
            user[update] = req.body[update]                             // access that property in the user model and set it equal to the value of that key
        })

        await user.save()

        res.send(req.user)                                              // Otherwise, send the respond to the request
     } catch (e) {
        res.status(400).send(e)
     }
 })

/**
 * Description: Endpoint for creating a User and saving it to the DB
 * 
 * Parameters:
 *      A JSON object that contains essential properties to create a new User
 */
router.post('/users', async (req, res) => {
    const user = new User(req.body)     // Create User object
    log(req.body)
    
    try {
        await user.save()                               // Save the User Document
        //sendWelcomeEmail(user.email, user.name)         // Send welcome email
        const newToken = await user.generateAuthToken() // Generate new auth token

        res.status(201).send( {user, newToken} )        // Respond with the User Document and the auth token
    } catch (e) {
        res.status(400).send(e)
    }
})


/**
 * Description: 
 *      Logs the user in
 * 
 * Parameters (in the body):
 *      email: The user's email
 *      password: The user's password
*/
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)    // Find the User and check if details match
        const newToken = await user.generateAuthToken()                                    // Generate a token for the user

        
        res.send( { user, newToken} )
    } catch (e) {
        res.status(400).send(e)
    }
})

/**
 * Description:
 *      Logs the user out of their current session
 * 
 * Parameters:
 *      These are both provided through the middleware in auth.js
 *      token: The current session's token
 *      user: The User Document (aka the current user)
 */
router.post('/users/logout', auth, async (req, res) => {
    try {
        // In this try block, we will modify the value of the tokens array in the User Document
        // We'll modify it by filtering the array and removing the token that they just used
        // to make the request
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        
        await req.user.save()                                   // Save the User Document

        res.send('You have been succesfully logged out')        // Send response to the user
    } catch (e) {
        res.status(500).send(e)
    }
})

/**
 * Description:
 *      Logs the user out of all sessions
 * 
 * Parameters:
 *      user: The User Document (aka the user)
 */
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []                                    // Remove all the tokens from the User Document (our db)

        await req.user.save()                                   // Save the User Document in our DB
        
        res.send('Succesfully logged out of all sessions.')     // Send a response back to the request
    } catch(e) {
        res.status(500).send(e)
    }
})


// Multer options object
const upload = multer({     // Options object for upload
    limits: {
        fileSize: 1000000       // File can't be bigger than 1MB
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {                
            return callback(new Error('File must be a jpg, jpeg, or png.'))
        }
        
        callback(undefined, true)
        callback(undefined, false)
    }
})

/**
 * Desctiption:
 *      User uploads an image using form data
 * 
 * Parameters:
 *      upload.single('avatarUpload'): multer middleware; 'avatarUpload' is the name of the file that we should be               receiving
 */

router.post('/users/me/avatar', auth, upload.single('avatarUpload'), async (req, res) => {
    const buffer = await sharp(req.file.buffer)         // Store the modified output from sharp
    .resize( {width: 250, height: 250} )                // resize the image (we wouldn't do this if we had a front-end, we would do                                                         the resizing on the app itself)
    .png()                                              // Convert the image to a .png format
    .toBuffer()                                         //  Convert it back to the binary data

    req.user.avatar = buffer                            // Set the user's avatar property to the request's file binary data
    await req.user.save()                               // Save the changes

    res.send('Avatar image uploaded')                   // Respond with success message
}, (error, req, res, next) => {
    res.status(400).send( {error: error.message} )      // Respond with failure and JSON containing the error's message
})


/**
 * Description:
 *      Deletes/clears the data that was in the user's avatar property
 */
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined                     // Delete the binary data from the user's object
    await req.user.save()                           // Save the changes

    res.send('Successfully deleted your avatar')    // Send response to user
})

/**
 * Description: 
 *      Deletes your User Document from the database (as well as all their Tasks using the User model middleware)
 */
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()                                         // Delete the User Document from the database
        //sendCancelEmail(req.user.email, req.user.name)
        res.send(req.user)                                                  // Success, send User Document back in the response
    } catch (e) {
        res.status(500).send()
    }
})


module.exports = router