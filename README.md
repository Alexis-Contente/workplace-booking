# QuantCube Workplace Booking 🏢

A modern workplace desk booking system built with Next.js and Supabase, designed to streamline office desk reservations for hybrid work environments.

## 🌟 Features

- **🪑 Desk Booking**: Reserve desks for specific dates with visual availability indicators
- **🏃‍♂️ Real-time Status**: Live updates on desk availability and booking status
- **🏢 Multi-Room Support**: Manage bookings across different office zones (DS Room, OP Room, IT Room)
- **👤 User Profiles**: Personal profile management and booking history
- **🔒 Secure Authentication**: Powered by Supabase Auth with Row Level Security
- **📱 Responsive Design**: Mobile-friendly interface with modern UI/UX
- **⚡ Instant Notifications**: Real-time feedback for booking actions
- **🎯 Assigned Desks**: Support for permanently assigned desks
- **📊 Global Overview**: View all bookings across the organization

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Notifications**: Sonner
- **Icons**: Lucide React
- **UI Components**: Radix UI

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/workplace-booking.git
cd workplace-booking
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

1. Create a new Supabase project
2. Run the SQL script from `supabase-schema.sql` in your Supabase SQL Editor
3. This will create all necessary tables, policies, and sample data

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Database Schema

The application uses a PostgreSQL database with the following main tables:

- **users**: User profiles and authentication data
- **desks**: Office desk information and locations
- **bookings**: Desk reservations and booking history

### Desk Organization

- **Zone A (DS Room)**: 50 desks (A01-A50) - 4 blocks of 6 desks each
- **Zone B (OP Room)**: 16 desks (B01-B16) - Special U-shaped layout
- **Zone C (IT Room)**: 14 desks (C01-C14) - Two-column layout

## 🎨 UI/UX Features

### Desk Status Indicators

- 🟢 **Available**: Click to book
- 🔴 **Booked**: Reserved by colleague
- 🔵 **Your Booking**: Click to cancel
- 🟠 **Assigned**: Permanently assigned to colleague
- 🟣 **Your Assigned**: Your permanent desk

### Interactive Elements

- Visual feedback for booking actions
- Loading states and animations
- Responsive grid layouts
- Room switching tabs

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Authentication**: Secure user login/registration
- **Data Protection**: Users can only modify their own bookings
- **Real-time Validation**: Prevents double-bookings and conflicts

## 📱 Pages & Components

### Main Pages

- **Home (`/`)**: Main booking interface with desk grid
- **Reservations (`/reservations`)**: Personal booking history
- **Global Bookings (`/global-bookings`)**: Organization-wide view
- **Profile (`/profile`)**: User profile management
- **Login (`/login`)**: Authentication page
- **About (`/about`)**: Application information

### Key Components

- **DeskGrid**: Interactive desk booking interface
- **DateSelector**: Date picker for reservations
- **GlobalBookingsTable**: Administrative booking overview
- **ProtectedRoute**: Authentication wrapper

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please create an issue on GitHub or contact the development team.

## 🙏 Acknowledgments

- Built with ❤️ using Next.js and Supabase
- UI components powered by Radix UI
- Icons by Lucide React
- Styling with Tailwind CSS

---

**Made with ❤️ for QuantCube Office**
