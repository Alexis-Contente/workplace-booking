import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../components/header";
import Footer from "../components/footer";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              User Profile 👤
            </h1>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Profile Information
              </h2>

              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">👤</div>
                <p className="text-lg">Profile management</p>
                <p className="text-sm">
                  Update your personal information and preferences.
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
