
import { useEffect, useState, type FormEvent } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

type Flag = {
  id: number;
  key: string;
  type: string;
  default_value: unknown;
  enabled: boolean;
  description: string;
  environment_id: number;
  owner_team?: string;
};

type Environment = {
  id: number;
  name: string;
  description: string;
};

type View = "Dashboard" | "Feature Flags" | "Environments" | "Profile";

async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item: { msg?: string }) => item.msg).join(", ")
          : `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data as T;
}

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("access_token") || ""
  );
  const [user, setUser] = useState<User | null>(null);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [view, setView] = useState<View>("Dashboard");

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadDashboard() {
      setPageLoading(true);
      setError("");

      try {
        const profile = await apiRequest<User>("/api/auth/me", token);

        if (cancelled) return;
        setUser(profile);

        const results = await Promise.allSettled([
          apiRequest<Flag[]>("/api/v1/flags", token),
          apiRequest<Environment[]>("/api/v1/environments", token),
        ]);

        if (cancelled) return;

        if (results[0].status === "fulfilled") {
          setFlags(results[0].value);
        } else {
          setFlags([]);
        }

        if (results[1].status === "fulfilled") {
          setEnvironments(results[1].value);
        } else {
          setEnvironments([]);
        }

        const failures = results.filter(
          (result) => result.status === "rejected"
        );

        if (failures.length > 0) {
          setError(
            "Your profile loaded, but some dashboard data could not load. Check API permissions and the backend."
          );
        }
      } catch (err) {
        if (cancelled) return;

        localStorage.removeItem("access_token");
        setToken("");
        setUser(null);
        setError(
          err instanceof Error
            ? `Unable to load your profile: ${err.message}`
            : "Unable to load your profile. Please log in again."
        );
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";
      const body = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await fetch(`${API}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = data?.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((item: { msg?: string }) => item.msg).join(", ")
              : "Please check your input and try again."
        );
      }

      if (isLogin) {
        if (!data?.access_token) {
          throw new Error("Login succeeded, but no access token was returned.");
        }

        localStorage.setItem("access_token", data.access_token);
        setToken(data.access_token);
        setView("Dashboard");
        setMessage("");
      } else {
        setIsLogin(true);
        setPassword("");
        setMessage("Registration successful! Please log in.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    setToken("");
    setUser(null);
    setFlags([]);
    setEnvironments([]);
    setPassword("");
    setMessage("");
    setError("");
    setView("Dashboard");
  }

  async function refreshDashboard() {
    if (!token) return;

    setPageLoading(true);
    setError("");

    try {
      const [newFlags, newEnvironments] = await Promise.all([
        apiRequest<Flag[]>("/api/v1/flags", token),
        apiRequest<Environment[]>("/api/v1/environments", token),
      ]);

      setFlags(newFlags);
      setEnvironments(newEnvironments);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to refresh dashboard."
      );
    } finally {
      setPageLoading(false);
    }
  }

  if (token && pageLoading && !user) {
    return (
      <main className="loading-page">
        <div className="loading-card">
          <div className="spinner" />
          <h2>Loading your workspace...</h2>
          <p>Connecting to the Feature Flag Management System.</p>
        </div>
      </main>
    );
  }

  if (!token || !user) {
    return (
      <main className="page">
        <section className="auth-card">
          <div className="brand-icon">FF</div>
          <h1>Feature Flag System</h1>
          <p className="subtitle">
            Manage your features with confidence.
          </p>

          <div className="tabs">
            <button
              type="button"
              className={isLogin ? "active" : ""}
              onClick={() => {
                setIsLogin(true);
                setMessage("");
                setError("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={!isLogin ? "active" : ""}
              onClick={() => {
                setIsLogin(false);
                setMessage("");
                setError("");
              }}
            >
              Register
            </button>
          </div>

          <h2>{isLogin ? "Welcome back!" : "Create an account"}</h2>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={8}
                maxLength={128}
                required
              />
            </label>

            <button className="submit-btn" disabled={loading}>
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Login"
                  : "Create account"}
            </button>
          </form>

          {message && <p className="message success-message">{message}</p>}
          {error && <p className="message error-message">{error}</p>}

          <p className="footer-text">Feature Flag Management System</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">FF</div>
          <div>
            <strong>FeatureFlag</strong>
            <small>Management Console</small>
          </div>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav className="main-nav">
          {(
            ["Dashboard", "Feature Flags", "Environments", "Profile"] as View[]
          ).map((item) => (
            <button
              type="button"
              key={item}
              className={`nav-item ${view === item ? "selected" : ""}`}
              onClick={() => {
                setView(item);
                setError("");
              }}
            >
              <span className="nav-dot" />
              {item}
              {item === "Feature Flags" && (
                <span className="nav-count">{flags.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-avatar">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user">
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button
            type="button"
            className="logout-button"
            onClick={logout}
            title="Log out"
          >
            ↗
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">FEATURE FLAG MANAGEMENT</p>
            <h1>{view}</h1>
          </div>

          <div className="topbar-right">
            <span className="status-pill">
              <span className="status-dot" /> Workspace connected
            </span>
            <div className="topbar-avatar">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="workspace-content">
          {error && (
            <div className="alert-error" role="alert">
              {error}
              <button type="button" onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}

          {view === "Dashboard" && (
            <>
              <div className="welcome-row">
                <div>
                  <h2>Welcome, {user.name} 👋</h2>
                  <p>Here's an overview of your feature management workspace.</p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={refreshDashboard}
                  disabled={pageLoading}
                >
                  {pageLoading ? "Refreshing..." : "↻ Refresh"}
                </button>
              </div>

              <div className="stats-grid">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Total Feature Flags</span>
                    <span className="stat-icon blue-icon">⚑</span>
                  </div>
                  <strong>{flags.length}</strong>
                  <p>Configured flags</p>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Enabled Flags</span>
                    <span className="stat-icon green-icon">✓</span>
                  </div>
                  <strong>{flags.filter((flag) => flag.enabled).length}</strong>
                  <p>Currently enabled</p>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Environments</span>
                    <span className="stat-icon purple-icon">▦</span>
                  </div>
                  <strong>{environments.length}</strong>
                  <p>Configured environments</p>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Account Role</span>
                    <span className="stat-icon orange-icon">♙</span>
                  </div>
                  <strong className="role-value">{user.role}</strong>
                  <p>Current access level</p>
                </article>
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent Feature Flags</h3>
                    <p>Your configured feature flags</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setView("Feature Flags")}
                  >
                    View all →
                  </button>
                </div>

                {flags.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">⚑</div>
                    <h3>No feature flags found</h3>
                    <p>
                      Create your first feature flag using the management APIs.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Flag Key</th>
                          <th>Type</th>
                          <th>Environment ID</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flags.slice(0, 5).map((flag) => (
                          <tr key={flag.id}>
                            <td>
                              <strong>{flag.key}</strong>
                              <small className="table-subtitle">
                                {flag.description || "No description"}
                              </small>
                            </td>
                            <td>{flag.type}</td>
                            <td>#{flag.environment_id}</td>
                            <td>
                              <span
                                className={`badge ${flag.enabled ? "badge-enabled" : "badge-disabled"}`}
                              >
                                {flag.enabled ? "Enabled" : "Disabled"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Environments</h3>
                    <p>Available deployment environments</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setView("Environments")}
                  >
                    View all →
                  </button>
                </div>

                {environments.length === 0 ? (
                  <div className="empty-state">
                    <h3>No environments found</h3>
                    <p>Refresh the data or check the backend endpoint.</p>
                  </div>
                ) : (
                  <div className="environment-grid">
                    {environments.map((environment) => (
                      <article className="environment-card" key={environment.id}>
                        <div className="environment-symbol">▦</div>
                        <div>
                          <h4>{environment.name}</h4>
                          <p>{environment.description || "No description"}</p>
                          <small>Environment ID: {environment.id}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {view === "Feature Flags" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>All Feature Flags</h3>
                  <p>Feature flags returned by your FastAPI backend.</p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={refreshDashboard}
                  disabled={pageLoading}
                >
                  ↻ Refresh
                </button>
              </div>

              {flags.length === 0 ? (
                <div className="empty-state">
                  <h3>No flags to display</h3>
                  <p>Create a flag through Swagger, then refresh this page.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Key</th>
                        <th>Type</th>
                        <th>Default Value</th>
                        <th>Environment</th>
                        <th>Status</th>
                        <th>Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flags.map((flag) => (
                        <tr key={flag.id}>
                          <td>{flag.id}</td>
                          <td>
                            <strong>{flag.key}</strong>
                            <small className="table-subtitle">
                              {flag.description}
                            </small>
                          </td>
                          <td>{flag.type}</td>
                          <td>{JSON.stringify(flag.default_value)}</td>
                          <td>#{flag.environment_id}</td>
                          <td>
                            <span
                              className={`badge ${flag.enabled ? "badge-enabled" : "badge-disabled"}`}
                            >
                              {flag.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </td>
                          <td>{flag.owner_team || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {view === "Environments" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>All Environments</h3>
                  <p>Environments returned by your FastAPI backend.</p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={refreshDashboard}
                  disabled={pageLoading}
                >
                  ↻ Refresh
                </button>
              </div>

              {environments.length === 0 ? (
                <div className="empty-state">
                  <h3>No environments to display</h3>
                  <p>Create an environment through Swagger, then refresh.</p>
                </div>
              ) : (
                <div className="environment-grid">
                  {environments.map((environment) => (
                    <article className="environment-card" key={environment.id}>
                      <div className="environment-symbol">▦</div>
                      <div>
                        <h4>{environment.name}</h4>
                        <p>{environment.description || "No description"}</p>
                        <small>Environment ID: {environment.id}</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {view === "Profile" && (
            <section className="panel profile-panel">
              <div className="profile-heading">
                <div className="profile-avatar">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>{user.name}</h2>
                  <p>{user.email}</p>
                  <span className="badge badge-enabled">
                    {user.is_active ? "Active account" : "Inactive account"}
                  </span>
                </div>
              </div>

              <div className="profile-details">
                <div>
                  <span>User ID</span>
                  <strong>{user.id}</strong>
                </div>
                <div>
                  <span>Full Name</span>
                  <strong>{user.name}</strong>
                </div>
                <div>
                  <span>Email Address</span>
                  <strong>{user.email}</strong>
                </div>
                <div>
                  <span>Role</span>
                  <strong>{user.role}</strong>
                </div>
              </div>

              <button
                type="button"
                className="logout-main-button"
                onClick={logout}
              >
                Log out
              </button>
            </section>
          )}

          <footer className="workspace-footer">
            Feature Flag Management System
            <span>Connected to FastAPI</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default App;
