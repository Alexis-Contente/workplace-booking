import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function ReservationsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My Reservations</h1>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Upcoming Bookings</h2>

              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-lg">No reservations yet</p>
                <p className="text-sm">
                  Book your first desk from the dashboard!
                </p>

                <div className="mt-6">
                  <Link
                    href="/"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors inline-block"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Booking History</h2>

              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg">No booking history</p>
                <p className="text-sm">
                  Your past reservations will appear here.
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
