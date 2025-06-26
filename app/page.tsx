import Header from "./components/header";
import Footer from "./components/footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6">
        {/* Main content of your application */}
        <h1 className="text-2xl font-bold">Welcome to Workplace Booking</h1>
        <p className="mt-4">Here you can book your desk spaces.</p>
      </main>
      <Footer />
    </div>
  );
}
