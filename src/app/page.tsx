import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 justify-center items-center w-full">
      <Link className="text-blue-500" href="/chat">
        Start a chat session
      </Link>
    </div>
  );
}
