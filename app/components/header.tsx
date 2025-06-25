"use client";

export default function Header() {
  return (
    <header className="bg-blue-500 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-4xl font-bold uppercase">
          Workplace Booking
        </h1>
        <div className="flex gap-4">
          <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
            Home
          </button>
          <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
            Profil
          </button>
          <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
            Réservation
          </button>
          <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
            À propos
          </button>
        </div>
      </div>
    </header>
  );
}
