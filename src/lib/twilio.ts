import twilio from 'twilio';

/**
 * Sends a WhatsApp OTP verification code via Twilio Sandbox.
 * If credentials are not configured, it returns false (allowing fallback to console log).
 * 
 * @param phone Recipient phone number (e.g. '9876543210' or '+919876543210')
 * @param otp The 6-digit verification code
 */
export async function sendWhatsAppOTP(phone: string, otp: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn(
      `\n⚠️  [Twilio WhatsApp WARNING] Credentials are not set in .env.local.\n` +
      `Please configure:\n` +
      ` - TWILIO_ACCOUNT_SID\n` +
      ` - TWILIO_AUTH_TOKEN\n` +
      ` - TWILIO_PHONE_NUMBER\n` +
      `OTP code will be logged directly to the server terminal instead.\n`
    );
    return false;
  }

  try {
    const client = twilio(accountSid, authToken);

    // Format target phone number to E.164
    let targetPhone = phone.trim().replace(/\s+/g, '');
    if (targetPhone.startsWith('whatsapp:')) {
      targetPhone = targetPhone.substring(9);
    }
    if (!targetPhone.startsWith('+')) {
      targetPhone = `+91${targetPhone}`; // Default to India country code
    }

    // Ensure Twilio sandbox numbers are correctly prefixed
    const fromWhatsApp = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toWhatsApp = `whatsapp:${targetPhone}`;

    await client.messages.create({
      body: `Aapka Patr-Mail verification code hai: ${otp}\n\nYeh code 5 minute mein expire ho jayega.`,
      from: fromWhatsApp,
      to: toWhatsApp,
    });

    console.log(`[Twilio Success] Sent WhatsApp OTP to ${targetPhone}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp OTP via Twilio:', error);
    return false;
  }
}
