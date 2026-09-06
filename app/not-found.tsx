import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="field-label">404</p>
        <h1 className="mt-2 font-serif text-4xl">That page isn’t in the vestry.</h1>
        <Link href="/" className="btn btn-primary mt-6">
          Back to the door
        </Link>
      </div>
    </div>
  );
}
