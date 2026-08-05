import DashboardCards from "@/components/dashboard/DashboardCards";
import PropertyForm from "@/components/forms/PropertyForm";
import MeterForm from "@/components/forms/MeterForm";
import ReadingForm from "@/components/forms/ReadingForm";
import ReadingTable from "@/components/dashboard/ReadingTable";
import MeterList from "@/components/dashboard/MeterList";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8">
        <header id="dashboard" className="rounded-3xl bg-slate-900 px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300">MeterMate</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Meter readings first</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Capture monthly readings quickly, review recent usage, and keep the dashboard in sync automatically.
          </p>
        </header>

        <DashboardCards />

        <section id="readings" className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <ReadingForm />
            <ReadingTable />
            <MeterList />
          </div>

          <aside id="settings" className="space-y-6">
            <div id="setup" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Setup</h2>
              <p className="mt-1 text-sm text-slate-500">
                Use these only when you need to add properties or meters.
              </p>
            </div>

            <PropertyForm />
            <MeterForm />
          </aside>
        </section>
      </div>

      <MobileBottomNav />
    </main>
  );
}