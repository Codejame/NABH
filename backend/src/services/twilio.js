import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Checks if Twilio is configured with real credentials.
 */
export const isTwilioConfigured = () => {
  return (
    TWILIO_ACCOUNT_SID &&
    TWILIO_ACCOUNT_SID !== 'your_twilio_sid' &&
    TWILIO_AUTH_TOKEN &&
    TWILIO_AUTH_TOKEN !== 'your_twilio_token' &&
    TWILIO_PHONE_NUMBER &&
    TWILIO_PHONE_NUMBER !== 'your_twilio_phone'
  );
};

/**
 * Sends an SMS message to a mobile number.
 * @param {string} to - Destination mobile number (should include country code, e.g. +91)
 * @param {string} body - Text message content
 */
export const sendSMS = async (to, body) => {
  const isConfigured = isTwilioConfigured();
  
  // Format destination number (ensure country code is set, default to +91 for India)
  let formattedTo = to.trim();
  if (!formattedTo.startsWith('+')) {
    formattedTo = `+91${formattedTo}`;
  }

  console.log(`[SMS Service] Sending message to ${formattedTo}. Configured: ${isConfigured}`);

  if (!isConfigured) {
    console.log(`[SMS Service] [MOCK MODE] SMS Text Body: \n"${body}"`);
    return {
      success: true,
      mode: 'MOCK',
      messageId: `SM-MOCK-${Math.floor(Math.random() * 1000000)}`,
      message: 'SMS logged to console successfully'
    };
  }

  try {
    const authString = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    
    // Twilio expects url-encoded body parameters
    const params = new URLSearchParams();
    params.append('From', TWILIO_PHONE_NUMBER);
    params.append('To', formattedTo);
    params.append('Body', body);

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      params.toString(),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data && response.data.sid) {
      console.log(`[SMS Service] SMS dispatched successfully. SID: ${response.data.sid}`);
      return {
        success: true,
        mode: 'LIVE',
        messageId: response.data.sid
      };
    } else {
      return {
        success: false,
        message: 'Empty response from Twilio'
      };
    }
  } catch (error) {
    console.error('[SMS Service] Live SMS Dispatch Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
};
