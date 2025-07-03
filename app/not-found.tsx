import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-blue-500 mb-4">404</h1>
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Page not found{" "}
            </h2>
            <p className="text-gray-600 mb-8">
              Sorry, the page you are looking for does not exist or has been
              moved.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Return to the home page
            </Link>

            <div className="text-sm text-gray-500">
              <p>Or try:</p>
              <ul className="mt-2 space-y-1">
                <li>• Check the URL</li>
                <li>• Use the navigation menu</li>
                <li>• Contact the administrator</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
