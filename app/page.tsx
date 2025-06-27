import Header from "./components/header";
import Footer from "./components/footer";
import ProtectedRoute from "../components/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {/* Main content of your application */}
          <h1 className="text-2xl font-bold">
            Welcome to Workplace Booking Dashboard
          </h1>
          <p className="mt-4">Here you can book your desk spaces.</p>

          {/* TODO: Dashboard content will go here */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              🚧 Dashboard Coming Soon
            </h2>
            <p className="text-gray-600">
              The booking interface is being developed. You&apos;ll soon be able
              to:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• 📅 Select booking dates</li>
              <li>• 🪑 Choose from 64 available desks (Zone A & B)</li>
              <li>• ✅ Make and manage reservations</li>
              <li>• 📊 View your booking history</li>
            </ul>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
