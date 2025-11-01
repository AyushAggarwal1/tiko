export default function Home() {
  return (
    <main>
      {/* Fixed header handled by layout */}
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs text-primary-700">New • Multi-tenant ITSM</span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-secondary-900">Ship support faster with a clean, modern ITSM</h1>
            <p className="mt-3 text-lg text-secondary-700">Organize anything with nested categories, track tickets end‑to‑end, keep comments and history in sync — all in one place.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="/register" className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-white shadow hover:bg-primary-700">Get started</a>
              <a href="/login" className="inline-flex items-center justify-center rounded-lg border border-secondary-300 px-5 py-2.5 text-secondary-800 hover:bg-secondary-100">Login</a>
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm text-secondary-600">
              <div><span className="font-semibold text-secondary-900">Multi-tenant</span> isolation</div>
              <div><span className="font-semibold text-secondary-900">Audit</span> history</div>
              <div><span className="font-semibold text-secondary-900">Secure</span> JWT auth</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold text-secondary-900">Why Tiko</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-3 h-10 w-10 rounded-lg bg-primary-100 text-primary-700 grid place-items-center">🏷️</div>
            <h3 className="font-semibold">Nested categories</h3>
            <p className="mt-1 text-sm text-secondary-600">Create categories and sub‑categories at any depth for precise organization.</p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-3 h-10 w-10 rounded-lg bg-primary-100 text-primary-700 grid place-items-center">🎫</div>
            <h3 className="font-semibold">Tickets that flow</h3>
            <p className="mt-1 text-sm text-secondary-600">Status, assignee, comments, and detailed change history — always in sync.</p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-3 h-10 w-10 rounded-lg bg-primary-100 text-primary-700 grid place-items-center">🛡️</div>
            <h3 className="font-semibold">Multi-tenant & secure</h3>
            <p className="mt-1 text-sm text-secondary-600">Data isolation per tenant with secure cookie‑based authentication.</p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm md:col-span-3 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <div className="mb-3 h-10 w-10 rounded-lg bg-primary-100 text-primary-700 grid place-items-center">⚡</div>
              <h3 className="font-semibold">Fast & responsive</h3>
              <p className="mt-1 text-sm text-secondary-600">Modern UX with instant feedback and optimized queries.</p>
            </div>
            <div>
              <div className="mb-3 h-10 w-10 rounded-lg bg-primary-100 text-primary-700 grid place-items-center">🧭</div>
              <h3 className="font-semibold">Clear navigation</h3>
              <p className="mt-1 text-sm text-secondary-600">Dashboard tabs for Categories, Tickets, and Users.</p>
            </div>
            <div>
              <div className="mb-3 h-10 w-10 rounded-lg bg-primary-100 text-primary-700 grid place-items-center">🔒</div>
              <h3 className="font-semibold">Auth guard</h3>
              <p className="mt-1 text-sm text-secondary-600">Login/signup protected with middleware redirects.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-4 rounded-2xl bg-white p-6 shadow md:grid-cols-3">
          <div>
            <div className="text-3xl font-bold text-secondary-900">∞</div>
            <div className="text-sm text-secondary-600">Category depth</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-secondary-900">100%</div>
            <div className="text-sm text-secondary-600">Tenant isolation</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-secondary-900">0→1</div>
            <div className="text-sm text-secondary-600">Setup in minutes</div>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section id="preview" className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-2xl border bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-secondary-900">Product preview</h3>
            <a href="/login" className="text-sm text-primary-600 hover:underline">Open app</a>
          </div>
          <div className="relative overflow-hidden rounded-xl border bg-secondary-50">
            <div className="flex items-center gap-2 border-b bg-white px-3 py-2 text-xs text-secondary-600">
              <span className="h-2 w-2 rounded-full bg-danger-400" />
              <span className="h-2 w-2 rounded-full bg-warning-400" />
              <span className="h-2 w-2 rounded-full bg-success-500" />
              <span className="ml-2">/dashboard</span>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="text-sm font-medium">Category Tree</div>
                <div className="mt-2 h-28 rounded bg-secondary-50" />
              </div>
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="text-sm font-medium">Tickets</div>
                <div className="mt-2 h-28 rounded bg-secondary-50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl bg-secondary-900 p-8 text-white">
          <h3 className="text-xl font-semibold">Ready to streamline your ITSM?</h3>
          <p className="mt-1 text-secondary-200">Create your organization and invite your team in minutes.</p>
          <div className="mt-4 flex gap-3">
            <a href="/register" className="rounded-lg bg-white px-4 py-2 text-secondary-900">Create an account</a>
            <a href="/login" className="rounded-lg border border-secondary-600 px-4 py-2 text-white">I already have an account</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-secondary-600">
          <span>© {new Date().getFullYear()} Tiko</span>
          <div className="flex items-center gap-4">
            <a href="/login" className="hover:text-secondary-900">Login</a>
            <a href="/register" className="hover:text-secondary-900">Register</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
