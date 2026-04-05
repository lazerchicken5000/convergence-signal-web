import Link from 'next/link';

export default function TipSuccessPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full border border-zinc-800 rounded-lg p-8 text-center">
        <h1 className="text-xl font-bold tracking-tight">
          Thank you for supporting Verg
        </h1>
        <p className="text-sm text-muted-foreground mt-2 mb-8">
          Your contribution helps keep independent intelligence curation alive.
        </p>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          &larr; Back to dashboard
        </Link>
      </div>
    </main>
  );
}
