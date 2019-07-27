const log = console.log

const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../models/task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid format')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot have \'password\' in it.')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {                           // Property that saves the user image binary data
        type: Buffer
    },
}, {
    timestamps: true                    // Enable timestamps on User objects
})  

// This is a virtual property
// Not actual data saved in the DB, it is a relationship between 2 entities (i.e. User and Task)
// It is just a way for Mongoose to figure out how these 2 entities are related
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',              // The User's id 
    foreignField: 'owner'           // The property that is saving the id of the User that owns the Task Document
})


//The difference between 'schema.methods' and 'schema.statics'
// is that 'methods' is available to the instance of the mongoose model
// while, statics is available from the actual mongoose model 
// meaning you don't have to create an instance to use it
// kind of like a static method

// Has to be a regular function because we need the 'this' binding
/**
 * Description:
 *      Uses a regular function to be able to use the 'this' binding.
 *      Creates a new token 
 * 
 * Returns:
 *     The token that was created 
 */
userSchema.methods.generateAuthToken = async function () {
    const user = this                                                       // Reference to user instance
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)     // Generate token

    user.tokens = user.tokens.concat({ token: token})                       // Add the token to the tokens property
    await user.save()                                                       // Save user instance

    return token
}

/**
 * Description:
 *      Anytime our server sends the User Document back to the user,
 *      this method will be run.
 *      This method filters out 2 confidential properties from the User Document
 * 
 * Returns:
 *      A modified copy of the User Document
 */
userSchema.methods.toJSON = function () {
    const user = this                           // Reference to the User Document instance
    const publicUser = user.toObject()          // Create a copy and convert it to a js object

    delete publicUser.password                  // Remove the password property from the copy
    delete publicUser.tokens                    // Remove the tokens array from the copy
    delete publicUser.avatar                    // Remove the avatar binary data as it will slow down request times and the user                                                    really doesn't need that binary data, they can just request it from the server

    return publicUser                           // Return the modified copy
}

/**
 * Description: 
 *      Logs a user in
 * 
 * Parameters:
 *      email: The email in the body of the user request (example: req.body.email)
 *      pass: The password in the body of the user request (example: req.body.password)
 * 
 * Errors:
 *      Throws an error if the email or password is incorrect
 * 
 * Returns:
 *      The user object if the email and password matched our database
 */
userSchema.statics.findByCredentials = async (email, pass) => {
    const user = await User.findOne({ email : email })                  // Find the User Document by email

    if (!user) {
        throw new Error('Unable to login (email not found)')                // Throw error: email not found
    }

    const isMatch = await bcrypt.compare(pass, user.password)           // Check if the password is correct

    if (!isMatch) {
        throw new Error('Unable to login (password is incorrect)')          // Throw error: password is wrong
    }

    return user                                                         //Otherwise, success, return
}

// Hashing plain-text password before saving
userSchema.pre('save', async function (next) {
    const user = this 
    log('before saving user model')

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete tasks owned by User when the User Document is deleted
// This is triggered when the user requests to delete their profile
    // From the userRouter.js at router.delete('users/me')
userSchema.pre('remove', async function (next) {
    const user = this

    await Task.deleteMany({ owner: user._id })      // Delete all Tasks where their 'owner' property matches the User's object id
    next()
})

const User = mongoose.model('User', userSchema)


module.exports = User