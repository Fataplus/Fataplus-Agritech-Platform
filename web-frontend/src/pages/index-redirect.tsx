import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to admin dashboard
    router.push('/admin-simple');
  }, [router]);

  return (
    <>
      <Head>
        <title>Fataplus Admin - Redirection...</title>
        <meta name="description" content="Redirection vers le tableau de bord admin" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Redirection vers l'administration...</p>
        </div>
      </main>
    </>
  );
}