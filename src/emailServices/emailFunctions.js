import brevo from '@getbrevo/brevo';
const apiClient = brevo.ApiClient.instance;
apiClient.authentications['api-key'].apiKey = import.meta.env.VITE_BREVO_API_KEY;
const apiInstance = new brevo.TransactionalEmailsApi();

export const sendBrevoEmail = async (recipients, subject, htmlContent) => {
  try {
    const emailData = {
      sender: {
        name: import.meta.env.VITE_BREVO_SENDER_NAME,
        email: import.meta.env.VITE_BREVO_SENDER_EMAIL
      },
      to: recipients.map(email => ({ email })),
      subject,
      htmlContent,
      replyTo: {
        email: import.meta.env.VITE_BREVO_REPLY_TO,
        name: import.meta.env.VITE_BREVO_SENDER_NAME
      },
    };
    const response = await apiInstance.sendTransacEmail(emailData);
    return { 
      success: true, 
      messageId: response.body?.messageId || response.messageId 
    };
    
  } catch (error) {
    const errorDetails = {
      status: error.status,
      message: error.message,
      response: error.response?.text || error.response?.body
    };
    console.error("Brevo API Error:", errorDetails);
    return { 
      success: false, 
      error: errorDetails 
    };
  }
};