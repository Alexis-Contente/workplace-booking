"use client";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  // Helper functions pour les dates
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00"); // Éviter les problèmes de timezone
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const isToday = selectedDate === today;
  const isTomorrow = selectedDate === tomorrowStr;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        📅 Select Booking Date
      </h2>

      {/* Date display */}
      <div className="mb-4">
        <p className="text-lg text-gray-700">
          <span className="font-medium">Selected date:</span>{" "}
          {formatDisplayDate(selectedDate)}
        </p>
        {isToday && (
          <span className="text-blue-600 text-sm font-medium">• Today</span>
        )}
        {isTomorrow && (
          <span className="text-green-600 text-sm font-medium">• Tomorrow</span>
        )}
      </div>

      {/* Quick selection buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => onDateChange(today)}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            isToday
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Today
        </button>

        <button
          onClick={() => onDateChange(tomorrowStr)}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            isTomorrow
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tomorrow
        </button>

        <button
          onClick={() => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            onDateChange(nextWeek.toISOString().split("T")[0]);
          }}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md font-medium transition-colors"
        >
          Next Week
        </button>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-4">
        <label
          htmlFor="date-picker"
          className="text-sm font-medium text-gray-700"
        >
          Or pick a specific date:
        </label>
        <input
          id="date-picker"
          type="date"
          value={selectedDate}
          min={today} // Empêcher de sélectionner des dates passées
          onChange={(e) => onDateChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Info message */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> You can book up to 30 days in advance. Past
          dates are not available for booking.
        </p>
      </div>
    </div>
  );
}
