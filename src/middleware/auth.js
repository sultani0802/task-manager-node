const log = console.log

const jwt = require('jsonwebtoken')
const User = require('../models/user')


const auth = async (req, res, next) => {
    log('\nAuth middleware starting...')
    
    log('\nUser\'s request:')
    log('\tRequest type:  ' + req.method + '\n\tURL Path:  ' + req.path)

    try {
        // Get the token in the header from the user's request
        const token = req.header('Authorization').replace('Bearer ', '')                // DON'T FORGET THE SPACE AFTER Bearer
        const decoded = jwt.verify(token, process.env.JWT_SECRET)                              // Check if token is valid
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })    // Find the user based on the _id AND token
        
        if (!user) {                                                                    // If the _id or token doesn't exist
            throw new Error()                                                               // throw error
        }
        
        req.user = user                                                                 // Add the User Document into the req so that it can be passed to the router
        req.token = token                                                               // Add the token into the req so that it can be passed to the router
        next()
    } catch (e) {
        res.status(401).send( { error:'Authentication failed' } )
    }

    
    log('\nAuth middleware ending...')
}


module.exports = auth