import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold tracking-tight">SignBoard</h1>
      <p className="mt-3 text-lg text-neutral-600">
        Hand-drawn guestbook widget for your website.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
