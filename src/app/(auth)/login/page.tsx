import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login · Patr पत्र',
  description: 'Apne Patr account mein login karo',
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white">
          Patr mein Login Karo
        </h2>
        <p className="mt-1.5 text-sm text-white/50">
          Apne inbox mein wapas aao 🚀
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
