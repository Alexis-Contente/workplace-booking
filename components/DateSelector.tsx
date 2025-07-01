"use client";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  // Helper functions for dates
  const today = new Date().toISOString().split("T")[0];

  // Calculate the limit date (15 days after d-day)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 15);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00"); // Avoid timezone problems
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("fr-FR", options);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        📅 Select the reservation date
      </h2>

      {/* Date display */}
      <div className="mb-6">
        <p className="text-lg text-gray-700">
          <span className="font-medium">Selected date :</span>{" "}
          {formatDisplayDate(selectedDate)}
        </p>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-4">
        <label
          htmlFor="date-picker"
          className="text-sm font-medium text-gray-700"
        >
          Select a date :
        </label>
        <input
          id="date-picker"
          type="date"
          value={selectedDate}
          min={today} // Prevent selecting past dates
          max={maxDateStr} // Limit to 15 days in the future
          onChange={(e) => onDateChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tip section */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip :</strong> You can book up to 15 days in advance. Past
          dates are not available for booking.
        </p>
      </div>
    </div>
  );
}
