export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Forge</h1>
          <p className="text-muted-foreground text-sm">Your accountability tracker</p>
        </div>
        {children}
      </div>
    </main>
  );
}
