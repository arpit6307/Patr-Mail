import { RegisterForm } from '@/components/auth/RegisterForm';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export const metadata = {
  title: 'Register · Patr पत्र',
  description: 'Apna naya Patr account banao',
};

export default function RegisterPage({ searchParams }: PageProps) {
  const redirectUri = (searchParams?.redirect_uri as string) || 
                      (searchParams?.return_to as string) ||
                      (searchParams?.redirect as string) ||
                      (searchParams?.callbackUrl as string) ||
                      (searchParams?.next as string) ||
                      (searchParams?.continue as string);

  const getButtonText = (url: string) => {
    try {
      if (url.startsWith('/')) {
        return 'Go Back to Patr';
      }
      const hostname = new URL(url).hostname;
      if (hostname.includes('indivibe')) return 'Go Back to IndiVibe';
      const parts = hostname.split('.');
      const firstPart = parts[0] === 'www' ? parts[1] : parts[0];
      if (firstPart) {
        return `Go Back to ${firstPart.charAt(0).toUpperCase() + firstPart.slice(1)}`;
      }
      return 'Go Back to App';
    } catch (e) {
      return 'Go Back to IndiVibe';
    }
  };

  const buttonText = redirectUri ? getButtonText(redirectUri) : '';

  return (
    <div>
      {redirectUri && (
        <div className="w-full max-w-sm mx-auto mb-6 text-center animate-fade-in">
          <a
            href={redirectUri}
            className="inline-flex items-center justify-center gap-2 w-full bg-[#FFE834] text-[#111111] border-2 border-[#111111] px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-[3px_3px_0px_#111111] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_#111111] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-100"
          >
            &larr; {buttonText}
          </a>
        </div>
      )}
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
