import Header from "../components/header";
import Footer from "../components/footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">About Workplace Booking</h1>

          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-semibold mb-4">
                🏢 What is Workplace Booking?
              </h2>
              <p className="text-gray-700 mb-6">
                Workplace Booking is an internal application designed
                specifically for Quant Cube employees to reserve desk spaces in
                our open office environment. Say goodbye to the hassle of
                finding an available desk when you come to the office!
              </p>

              <h2 className="text-2xl font-semibold mb-4">✨ Features</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>
                  🪑 Reserve from 64 available desks across Zone A and Zone B
                </li>
                <li>📅 Book desks for future dates</li>
                <li>📊 View real-time desk availability</li>
                <li>📋 Manage your reservations easily</li>
                <li>🔒 Secure access with your @quant-cube.com email</li>
              </ul>

              <h2 className="text-2xl font-semibold mb-4">
                🚀 How to Get Started
              </h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
                <li>Sign up using your @quant-cube.com email address</li>
                <li>Confirm your email address</li>
                <li>Log in and start booking your desk spaces!</li>
              </ol>

              <h2 className="text-2xl font-semibold mb-4">📞 Support</h2>
              <p className="text-gray-700 mb-4">
                This application was developed by Alexis Contente as a personal
                project to improve the workplace experience at Quant Cube.
              </p>
              <p className="text-gray-700">
                For questions, suggestions, or issues, please reach out
                internally.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
