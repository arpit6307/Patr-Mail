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

    // ── Production: send via Resend ────────────────────
    // const { Resend } = await import('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'Patr <noreply@patr.in>',
    //   to: email!,
    //   subject: `Aapka OTP: ${otp}`,
    //   html: `<p>Aapka Patr verification code hai: <strong>${otp}</strong></p>
    //          <p>Yeh code 5 minute mein expire ho jayega.</p>`,
    // });

    return NextResponse.json({
      success: true,
      message: 'OTP bhej diya gaya hai',
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp }),
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
