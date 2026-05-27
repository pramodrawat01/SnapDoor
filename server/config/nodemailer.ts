import {createTransport} from 'nodemailer'

// create a transporter using SMTP - 
const transporter = createTransport({
    host : 'smpt.emxample.com',
    port : 587,
    auth :{
        user : process.env.SMTP_USER,
        pass : process.env.SMTP_PASS,
    },
})

const sendEmail = async( { to, subject, body} : {to : string, subject : string, body : string}) => {
    try {
        await transporter.verify();
        const response = await transporter.sendMail({
            from : process.env.SENDER_EMAIL ,
            to,
            subject,
            html : body
        }) 

        return response

    } catch (error) {
        console.error("Verification failed: Error while sending email", error);
    }
}

export default sendEmail