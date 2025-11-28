import Image from "next/image";
import { auth } from "~/auth/config";
import SignIn from "~/components/auth/authButtons/signIn";
import SignOut from "~/components/auth/authButtons/signOut";

export default async function Home() {
  const session = await auth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {session?.user ? (
          <div>
            <h1>Welcome, {session?.user?.name}!</h1>
            <Image
              src={session?.user?.image || ""}
              alt="Profile Picture"
              width={100}
              height={100}
            />
            <SignOut />
          </div>
        ) : (
          <div>
            <h1>Welcome!</h1>
            <p>Please sign in to continue.</p>
            <SignIn />
          </div>
        )}
      </main>
    </div>
  );
}
