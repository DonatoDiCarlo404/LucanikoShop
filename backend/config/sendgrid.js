import sgMailPkg from '@sendgrid/mail';

const sgMail = sgMailPkg;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default sgMail;