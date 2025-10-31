export default function Home() {
  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Tiko</h1>
      <p className="mt-2 text-secondary-700">ITSM for teams: categories, tickets, comments, and history.</p>

      <section className="mt-8 grid gap-4">
        <h2 className="text-xl font-semibold">Features</h2>
        <ul className="list-disc pl-6 text-secondary-800 space-y-2">
          <li>Multi-tenant: separate org data per tenant</li>
          <li>Hierarchical categories (infinite depth)</li>
          <li>Tickets with status, assignee, comments, and change history</li>
          <li>User management and invites</li>
          <li>Secure auth with JWT cookies</li>
        </ul>
      </section>

      <div className="mt-8 flex gap-3">
        <a href="/register" className="bg-primary-600 text-white px-4 py-2 rounded">Get started</a>
        <a href="/login" className="border px-4 py-2 rounded">Login</a>
      </div>
    </main>
  );
}
