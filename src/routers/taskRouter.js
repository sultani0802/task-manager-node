const log = console.log

const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Task = require('../models/task')

/**
 * Description: 
 *      Fetches all the Tasks owned by the User (based on auth token) and returns it to the user 
 * 
 * Parameters:
 *      Auth token: Used to determine which user's Tasks are requested
 *      completed: A URL query that determines if the user wants either completed, incomplete, or all tasks in the response
 *      limit: A URL query that determines how many items are shown in each page
 *      skip: A URL query that determines which page to show
 * 
 * Example: 
 *      localhost:3000/tasks
 *          or
 *      localhost:3000/tasks?completed=true or false
 *          or
 *          localhost:3000/limit=10&skip=10     <---- skips 10 items and shows the next 10
 *          or
 *      localhost:3000/tasks?completed=true&limit=10&skip=10
 *          or
 *      localhost:3000/tasks?sortBy=createdAt_asc       <---- sorts by the created at property in ascending pattern
 *          or
 *      localhost:3000/tasks?sortBy=createdAt_desc      <---- sorts by the created at property in descending pattern
 */
router.get('/tasks', auth, async (req, res) => {
    const match = { }                                   // Object used for filtering in queries
    const sort = { }                                    // Object used for sorting in queries

    if (req.query.completed) {                          // If the user provided the completed url query
        match.completed = req.query.completed === 'true'    // If string they typed is equal to 'true' then match.completed = true
                                                            // Otherwise, match.completed = false
    }


    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')       // Split up the sort string by the "_" which will give us "createdAt" and ("asc" or "desc")
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1   // Use Ternary operator to determine asc or descending pattern 
    }
    try {
        const user = req.user                           // Get the User Document from the request (through the middleware)
        await user.populate({
            path: 'tasks',                              // Name of the collection in MongoDB
            match: match,                               // The object used to filter MongoDB results from the query
            options: {
                limit: parseInt(req.query.limit),       // How many items to return in the response
                skip: parseInt(req.query.skip),         // Which page to show
                sort: sort                              // Sort by createdAt property of Task in ascending or descending
            }
        }).execPopulate()     // Fetch the tasks related to the User

        res.send(user.tasks)                            // Respond with the Tasks
    } catch (e) {
        res.status(500).send()
    }
})

/**
 * Description:
 *      Searches the DB for a Task by the Task's _id and if it is owned by the User (based on the request's auth token)
 * 
 * Parameters:
 *      id: Passed in through the URL, the _id we want to search for
 *      owner: The object id of the User Document that owns the Task Document
 * 
 * Example: localhost:3000/tasks/1ljk12h41842k
 */
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id: _id, owner: req.user._id })  // Find the Task Document based on the task's _id & the User Document's _id (owner property of the Task)

        if (!task) {                                                        // If the search for the Task does not find any matches
            res.status(404).send()                                              // Send response with 404
        }

        res.send(task)                                                      // Send response with Task 
    } catch {
        res.status(404).send()
    }
})


  /**
  * Description: 
  *         Updates the Task Document using the request's body
  * 
  * Parameters:
  *         :id - the _id of the User Document we want to update
  *         body - contains the an object with key-value pairs of the properties we want to update
  * 
  * EXAMPLE:
  *     localhost:3000/tasks/j1hk2jeh1jk2hk
  *     body:   { 
  *                 description : "new name",
  *                 completed: true
  *             }
  */
 router.patch('/tasks/:id', auth, async (req, res) => {
     const updates = Object.keys(req.body)                      // An array of all the keys in the request's body
     const allowedUpdates = ['description', 'completed']        // An array of the keys in the Task Document we want to allow to be updated
     
     // Goes through every element in 'updates' and does the conditional, returns false if at least 1 is false
     const isValidOperation = updates.every((key) => {          // If we find a property that isn't allowed to be updated is in
         return allowedUpdates.includes(key)                    // the request, then we return false and the request isn't completed
     })


     if (!isValidOperation) {
         return res.status(400).send({error : 'You are trying to update a Task property that is not allowed or doesn\'t exist'})
     }

     try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })   // Get the task based on the Task id and Task owner property (User _id)
        
        if (!task) {                                                        // If the search for the Task did not find a match
            log('Task not found')

            return res.status(404).send({error : 'User not found'})         // Respond to user with error
        }

        // Go through each element in the array
        updates.forEach((update) => {                                   // For each element
            task[update] = req.body[update]                                 // Access the property that matches the key and set it equal to the key's value
        })

        await task.save()                                               // Save the task

        res.send(task)                                                  // Otherwise, send a response to the request
     } catch (e) {
         res.status(400).send(e)
     }
 })


/**
 * Description: Endpoint for creating a new Task and saving it to the DB
 * 
 * Parameters:
 *      A JSON object that contains essential properties to create a new Task
 */
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,                        // Copy the req.body object into this object
        owner: req.user._id                 // The ObjectId of the owner
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})



/**
 * Description: Deletes a Task Document with a matching _id
 * 
 * EXAMPLE:
 *      localhost:3000/tasks/<_id>
 */
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        // const task = await Task.findByIdAndDelete(req.params.id)        // Get the Task Document that is to be deleted
        const task = await Task.findOneAndDelete( {_id: req.params.id, owner: req.user._id } )

        if (!task) {                                                    // If there is no matching _id
            return res.status(404).send()                                   // Respond with 404
        }

        res.send(task)                                                  // Success
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router