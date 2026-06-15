import { NextResponse, type NextRequest } from 'next/server';

// ─── In-memory OTP store (dev only; use Redis/Firestore in prod) ──
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, type } = body as {
      email?: string;
      phone?: string;
      type?: 'register' | 'reset';
    };

    const target = email || phone;

    if (!target) {
      return NextResponse.json(
        { error: 'Email ya phone number chahiye' },
        { status: 400 },
      );
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(target, { code: otp, expiresAt });

    // ── Development: log to console ────────────────────
    console.log(`\n🔐 OTP for ${target}: ${otp} (type: ${type})\n`);

    let sentViaEmail = false;

    // ── Resend Email Sending ──────────────────────────
    if (email) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(apiKey);
          await resend.emails.send({
            from: 'Patr Mail <onboarding@resend.dev>',
            to: email,
            subject: `${otp} - Aapka Patr-Mail OTP Code`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; padding: 40px 20px; text-align: center;">
                <div style="max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #E9ECEF; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); text-align: left;">
                  <!-- Orange Header -->
                  <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C60 100%); padding: 32px 20px; text-align: center; color: #FFFFFF;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">पत्र <span style="font-size: 20px; font-weight: 300; opacity: 0.9;">Patr Mail</span></h1>
                    <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; opacity: 0.85; letter-spacing: 0.5px; text-transform: uppercase;">India Ka Apna Inbox</p>
                  </div>
                  
                  <!-- Main Body -->
                  <div style="padding: 40px 32px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #212529;">Verify Your Account</h2>
                    <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 1.6; color: #495057; font-weight: 500;">
                      Patr ID register karne ke liye aapka verification OTP code neeche diya gaya hai. Kripya ise registration page par enter karein.
                    </p>
                    
                    <!-- OTP Code Card -->
                    <div style="background-color: #FFF3EE; border: 2px dashed #FF6B35; border-radius: 16px; padding: 20px 0; margin-bottom: 32px; text-align: center;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #FF6B35; letter-spacing: 6px; margin-left: 6px;">${otp}</span>
                    </div>
                    
                    <!-- Expiry Note -->
                    <div style="text-align: center; font-size: 12px; color: #868E96; font-weight: 600;">
                      <span>⚠️ Yeh code <strong>5 minute</strong> mein expire ho jayega.</span>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #F8F9FA; border-top: 1px solid #E9ECEF; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; font-weight: 700; color: #ADB5BD; text-transform: uppercase; letter-spacing: 1px;">
                      Made in India with ❤️ 🇮🇳
                    </p>
                  </div>
                </div>
                
                <p style="margin: 20px 0 0 0; font-size: 11px; color: #ADB5BD; font-weight: 500;">
                  Agar aapne yeh request nahi ki thi, toh kripya is email ko ignore karein.
                </p>
              </div>
            `
          });
          sentViaEmail = true;
          console.log(`[Resend Success] Sent OTP email to ${email}`);
        } catch (mailError) {
          console.error('[Resend Error] Failed to send email via Resend:', mailError);
        }
      } else {
        console.warn('RESEND_API_KEY is not configured in .env.local. Fallback to console logs.');
      }
    }

    return NextResponse.json({
      success: true,
      message: sentViaEmail 
        ? 'OTP email par bhej diya gaya hai!' 
        : 'OTP bhej diya gaya hai',
      // Only include OTP in development if email sending is not active
      ...(process.env.NODE_ENV === 'development' && !sentViaEmail && { otp }),
    });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json(
      { error: 'OTP bhejne mein dikkat aayi' },
      { status: 500 },
    );
  }
}

// ── Verify OTP endpoint ──────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, code } = body as { target: string; code: string };

    if (!target || !code) {
      return NextResponse.json(
        { error: 'Target aur code dono chahiye' },
        { status: 400 },
      );
    }

    const stored = otpStore.get(target);

    if (!stored) {
      return NextResponse.json(
        { error: 'Koi OTP nahi mila, dobara request karo', valid: false },
        { status: 400 },
      );
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(target);
      return NextResponse.json(
        { error: 'OTP expire ho gaya, naya OTP bhejo', valid: false },
        { status: 400 },
      );
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { error: 'Galat OTP, dobara check karo', valid: false },
        { status: 400 },
      );
    }

    // OTP valid — clean up
    otpStore.delete(target);
    return NextResponse.json({ valid: true, message: 'OTP sahi hai!' });
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { error: 'Verification mein dikkat aayi' },
      { status: 500 },
    );
  }
}
