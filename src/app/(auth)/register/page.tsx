import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Register · Patr पत्र',
  description: 'Apna naya Patr account banao',
};

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white">Naya Patr ID Banao</h2>
        <p className="mt-1.5 text-sm text-white/50">
          Kuch hi steps mein apna email ready ho jayega ✨
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
