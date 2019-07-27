const log = console.log

const sgMail = require('@sendgrid/mail')

const senderEmail = ''      // The email we will be sending from

sgMail.setApiKey(process.env.SENDGRID_API_KEY)                  // sendgrid email API Key

/**
 * Description:
 *      Sends a welcome email to the user
 * 
 * Parameters:
 *      @param email: The email we want to send an email to 
 *      @param name: The name of the user 
 */
const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: senderEmail,
        subject: 'Welcome to the Task App',
        text: `Welcome to the app, ${name}. Let me know if you require any assistance.`
    })
}

/**
 * Description:
 *      Sends an email when the user requests to delete their account.
 *      This happens in the userRouter.js:router.delete('/users/me')
 * 
 * @param email : The email of the user that just cancelled
 * @param name : The name of the user that just cancelled
 *      This are both acquired from the request the user makes 
 */
const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: senderEmail,
        subject: 'Task App cancellation',
        text: `We are sorry to see you go, ${name}. If there was any particular reason you chose to cancel, please feel free to give me any feedback you\'d like to provide.Hope you reconsider!`
    })
}
module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}