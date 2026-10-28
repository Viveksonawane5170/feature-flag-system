

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

  type: "boolean" | "string" | "number";

  default_value: unknown;

  enabled: boolean;

  description: string | null;

  environment_id: number;

  owner_team: string | null;

};

type Environment = {

  id: number;

  name: string;

  description: string | null;

};

type EnvironmentForm = {
  name: string;
  description: string;
};

const emptyEnvironmentForm: EnvironmentForm = {
  name: "",
  description: "",
};

type View = "Dashboard" | "Feature Flags" | "Environments" | "Profile";

type FlagForm = {

  key: string;

  type: "boolean" | "string" | "number";

  default_value: string;

  enabled: boolean;

  description: string;

  environment_id: string;

  owner_team: string;

};

const emptyFlagForm: FlagForm = {

  key: "",

  type: "boolean",

  default_value: "false",

  enabled: false,

  description: "",

  environment_id: "",

  owner_team: "",

};

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

function getDefaultValue(type: FlagForm["type"], value: string): unknown {

  if (type === "boolean") {

    return value === "true";

  }

  if (type === "number") {

    const numberValue = Number(value);

    if (value.trim() === "" || !Number.isFinite(numberValue)) {

      throw new Error("Please enter a valid number for the default value.");

    }

    return numberValue;

  }

  return value;

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

  const [showFlagForm, setShowFlagForm] = useState(false);

  const [editingFlag, setEditingFlag] = useState<Flag | null>(null);

  const [flagForm, setFlagForm] = useState<FlagForm>(emptyFlagForm);

  const [savingFlag, setSavingFlag] = useState(false);

  const [showEnvironmentForm, setShowEnvironmentForm] = useState(false);
  const [editingEnvironment, setEditingEnvironment] =
    useState<Environment | null>(null);
  const [environmentForm, setEnvironmentForm] =
    useState<EnvironmentForm>(emptyEnvironmentForm);
  const [savingEnvironment, setSavingEnvironment] = useState(false);

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

        if (results.some((result) => result.status === "rejected")) {

          setError(

            "Your profile loaded, but some data could not load. Check your account role and backend permissions."

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

      setError(err instanceof Error ? err.message : "Something went wrong.");

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

    closeFlagForm();

  }

  async function refreshDashboard() {

    if (!token) return;

    setPageLoading(true);

    setError("");

    const results = await Promise.allSettled([

      apiRequest<Flag[]>("/api/v1/flags", token),

      apiRequest<Environment[]>("/api/v1/environments", token),

    ]);

    if (results[0].status === "fulfilled") {

      setFlags(results[0].value);

    }

    if (results[1].status === "fulfilled") {

      setEnvironments(results[1].value);

    }

    const failures = results.filter((result) => result.status === "rejected");

    if (failures.length > 0) {

      const firstFailure = failures[0];

      setError(

        firstFailure.status === "rejected"

          ? firstFailure.reason instanceof Error

            ? firstFailure.reason.message

            : "Some dashboard data could not be refreshed."

          : "Unable to refresh dashboard."

      );

    }

    setPageLoading(false);

  }

  function openCreateFlagForm() {

    setEditingFlag(null);

    setFlagForm({

      ...emptyFlagForm,

      environment_id: environments[0] ? String(environments[0].id) : "",

    });

    setError("");

    setShowFlagForm(true);

  }

  function openEditFlagForm(flag: Flag) {

    setEditingFlag(flag);

    setFlagForm({

      key: flag.key,

      type: flag.type,

      default_value: String(flag.default_value ?? ""),

      enabled: flag.enabled,

      description: flag.description || "",

      environment_id: String(flag.environment_id),

      owner_team: flag.owner_team || "",

    });

    setError("");

    setShowFlagForm(true);

  }

  function closeFlagForm() {

    setShowFlagForm(false);

    setEditingFlag(null);

    setFlagForm(emptyFlagForm);

  }

  async function saveFlag(e: FormEvent<HTMLFormElement>) {

    e.preventDefault();

    if (!token) return;

    setSavingFlag(true);

    setError("");

    setMessage("");

    try {

      const payload = {

        key: flagForm.key.trim(),

        type: flagForm.type,

        default_value: getDefaultValue(

          flagForm.type,

          flagForm.default_value

        ),

        enabled: flagForm.enabled,

        description: flagForm.description.trim() || null,

        environment_id: Number(flagForm.environment_id),

        owner_team: flagForm.owner_team.trim() || null,

      };

      if (!payload.environment_id) {

        throw new Error("Please select an environment.");

      }

      if (editingFlag) {

        await apiRequest<Flag>(

          `/api/v1/flags/${editingFlag.id}`,

          token,

          {

            method: "PUT",

            body: JSON.stringify(payload),

          }

        );

        setMessage("Feature flag updated successfully.");

      } else {

        await apiRequest<Flag>("/api/v1/flags", token, {

          method: "POST",

          body: JSON.stringify(payload),

        });

        setMessage("Feature flag created successfully.");

      }

      closeFlagForm();

      await refreshDashboard();

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Unable to save feature flag."

      );

    } finally {

      setSavingFlag(false);

    }

  }

  async function toggleFlag(flag: Flag) {

    if (!token) return;

    setError("");

    setMessage("");

    try {

      const updatedFlag = await apiRequest<Flag>(

        `/api/v1/flags/${flag.id}`,

        token,

        {

          method: "PUT",

          body: JSON.stringify({ enabled: !flag.enabled }),

        }

      );

      setFlags((current) =>

        current.map((item) => (item.id === flag.id ? updatedFlag : item))

      );

      setMessage(

        `Flag "${flag.key}" is now ${updatedFlag.enabled ? "enabled" : "disabled"}.`

      );

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Unable to update flag status."

      );

    }

  }

  async function deleteFlag(flag: Flag) {

    if (!token) return;

    const confirmed = window.confirm(

      `Are you sure you want to delete "${flag.key}"? This action cannot be undone.`

    );

    if (!confirmed) return;

    setError("");

    setMessage("");

    try {

      await apiRequest<{ message: string }>(

        `/api/v1/flags/${flag.id}`,

        token,

        { method: "DELETE" }

      );

      setFlags((current) => current.filter((item) => item.id !== flag.id));

      setMessage(`Flag "${flag.key}" deleted successfully.`);

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Unable to delete feature flag."

      );

    }

  }

  function openCreateEnvironmentForm() {
    setEditingEnvironment(null);
    setEnvironmentForm(emptyEnvironmentForm);
    setError("");
    setMessage("");
    setShowEnvironmentForm(true);
  }

  function openEditEnvironmentForm(environment: Environment) {
    setEditingEnvironment(environment);
    setEnvironmentForm({
      name: environment.name,
      description: environment.description || "",
    });
    setError("");
    setMessage("");
    setShowEnvironmentForm(true);
  }

  function closeEnvironmentForm() {
    setShowEnvironmentForm(false);
    setEditingEnvironment(null);
    setEnvironmentForm(emptyEnvironmentForm);
  }

  async function saveEnvironment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;

    setSavingEnvironment(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        name: environmentForm.name.trim(),
        description: environmentForm.description.trim() || null,
      };

      if (!payload.name) {
        throw new Error("Please enter an environment name.");
      }

      if (editingEnvironment) {
        await apiRequest<Environment>(
          `/api/v1/environments/${editingEnvironment.id}`,
          token,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
        setMessage("Environment updated successfully.");
      } else {
        await apiRequest<Environment>("/api/v1/environments", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Environment created successfully.");
      }

      closeEnvironmentForm();
      await refreshDashboard();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save environment."
      );
    } finally {
      setSavingEnvironment(false);
    }
  }

  async function deleteEnvironment(environment: Environment) {
    if (!token) return;

    const hasFlags = flags.some(
      (flag) => flag.environment_id === environment.id
    );
    const warning = hasFlags
      ? `Environment "${environment.name}" has feature flags linked to it. The backend may prevent deletion until those flags are handled. Continue?`
      : `Are you sure you want to delete "${environment.name}"?`;

    if (!window.confirm(warning)) return;

    setError("");
    setMessage("");

    try {
      await apiRequest<unknown>(
        `/api/v1/environments/${environment.id}`,
        token,
        { method: "DELETE" }
      );

      setEnvironments((current) =>
        current.filter((item) => item.id !== environment.id)
      );
      setMessage(`Environment "${environment.name}" deleted successfully.`);
      await refreshDashboard();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete environment."
      );
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

          <p className="subtitle">Manage your features with confidence.</p>

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

                setMessage("");

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

          {message && (

            <p className="message success-message" role="status">

              {message}

            </p>

          )}

          {view === "Dashboard" && (

            <>

              <div className="welcome-row">

                <div>

                  <h2>Welcome, {user.name} 👋</h2>

                  <p>

                    Here's an overview of your feature management workspace.

                  </p>

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

                    <p>Create your first flag from the Feature Flags page.</p>

                    <button

                      type="button"

                      className="secondary-button"

                      onClick={() => {

                        setView("Feature Flags");

                        openCreateFlagForm();

                      }}

                    >

                      + Create Flag

                    </button>

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

                    <p>Check the backend endpoint and your account permissions.</p>

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

            <>

              <section className="panel">

                <div className="panel-heading">

                  <div>

                    <h3>All Feature Flags</h3>

                    <p>Create and manage your feature flags.</p>

                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

                    <button

                      type="button"

                      className="secondary-button"

                      onClick={refreshDashboard}

                      disabled={pageLoading}

                    >

                      ↻ Refresh

                    </button>

                    <button

                      type="button"

                      className="secondary-button"

                      onClick={openCreateFlagForm}

                    >

                      + Create Flag

                    </button>

                  </div>

                </div>

                {showFlagForm && (

                  <form

                    onSubmit={saveFlag}

                    style={{

                      display: "grid",

                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",

                      gap: 16,

                      padding: 24,

                      borderBottom: "1px solid #e2e8f0",

                      background: "#f8fafc",

                    }}

                  >

                    <h3 style={{ gridColumn: "1 / -1", margin: 0 }}>

                      {editingFlag ? "Edit Feature Flag" : "Create Feature Flag"}

                    </h3>

                    <label>

                      Flag Key *

                      <input

                        value={flagForm.key}

                        onChange={(e) =>

                          setFlagForm({ ...flagForm, key: e.target.value })

                        }

                        placeholder="new_checkout"

                        maxLength={255}

                        required

                      />

                    </label>

                    <label>

                      Type *

                      <select

                        value={flagForm.type}

                        onChange={(e) => {

                          const type = e.target.value as FlagForm["type"];

                          setFlagForm({

                            ...flagForm,

                            type,

                            default_value:

                              type === "boolean"

                                ? "false"

                                : type === "number"

                                  ? "0"

                                  : "",

                          });

                        }}

                        required

                      >

                        <option value="boolean">Boolean</option>

                        <option value="string">String</option>

                        <option value="number">Number</option>

                      </select>

                    </label>

                    <label>

                      Default Value *

                      {flagForm.type === "boolean" ? (

                        <select

                          value={flagForm.default_value}

                          onChange={(e) =>

                            setFlagForm({

                              ...flagForm,

                              default_value: e.target.value,

                            })

                          }

                        >

                          <option value="false">false</option>

                          <option value="true">true</option>

                        </select>

                      ) : (

                        <input

                          type={flagForm.type === "number" ? "number" : "text"}

                          value={flagForm.default_value}

                          onChange={(e) =>

                            setFlagForm({

                              ...flagForm,

                              default_value: e.target.value,

                            })

                          }

                          required

                        />

                      )}

                    </label>

                    <label>

                      Environment *

                      <select

                        value={flagForm.environment_id}

                        onChange={(e) =>

                          setFlagForm({

                            ...flagForm,

                            environment_id: e.target.value,

                          })

                        }

                        required

                      >

                        <option value="">Select environment</option>

                        {environments.map((environment) => (

                          <option key={environment.id} value={environment.id}>

                            {environment.name}

                          </option>

                        ))}

                      </select>

                    </label>

                    <label>

                      Owner Team

                      <input

                        value={flagForm.owner_team}

                        onChange={(e) =>

                          setFlagForm({

                            ...flagForm,

                            owner_team: e.target.value,

                          })

                        }

                        placeholder="Backend Team"

                      />

                    </label>

                    <label>

                      Description

                      <input

                        value={flagForm.description}

                        onChange={(e) =>

                          setFlagForm({

                            ...flagForm,

                            description: e.target.value,

                          })

                        }

                        placeholder="Describe this flag"

                      />

                    </label>

                    <label

                      style={{

                        display: "flex",

                        alignItems: "center",

                        gap: 8,

                      }}

                    >

                      <input

                        type="checkbox"

                        checked={flagForm.enabled}

                        onChange={(e) =>

                          setFlagForm({

                            ...flagForm,

                            enabled: e.target.checked,

                          })

                        }

                        style={{ width: 16 }}

                      />

                      Enable this flag

                    </label>

                    <div

                      style={{

                        gridColumn: "1 / -1",

                        display: "flex",

                        gap: 10,

                        flexWrap: "wrap",

                      }}

                    >

                      <button

                        type="submit"

                        className="secondary-button"

                        disabled={savingFlag || environments.length === 0}

                      >

                        {savingFlag

                          ? "Saving..."

                          : editingFlag

                            ? "Save Changes"

                            : "Create Flag"}

                      </button>

                      <button

                        type="button"

                        className="secondary-button"

                        onClick={closeFlagForm}

                        disabled={savingFlag}

                      >

                        Cancel

                      </button>

                    </div>

                    {environments.length === 0 && (

                      <p style={{ gridColumn: "1 / -1", color: "#b91c1c" }}>

                        You need at least one environment before creating a

                        feature flag.

                      </p>

                    )}

                  </form>

                )}

                {flags.length === 0 ? (

                  <div className="empty-state">

                    <h3>No flags to display</h3>

                    <p>Create your first feature flag using the button above.</p>

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

                          <th>Actions</th>

                        </tr>

                      </thead>

                      <tbody>

                        {flags.map((flag) => (

                          <tr key={flag.id}>

                            <td>{flag.id}</td>

                            <td>

                              <strong>{flag.key}</strong>

                              <small className="table-subtitle">

                                {flag.description || "No description"}

                              </small>

                            </td>

                            <td>{flag.type}</td>

                            <td>{JSON.stringify(flag.default_value)}</td>

                            <td>

                              {environments.find(

                                (environment) =>

                                  environment.id === flag.environment_id

                              )?.name || `#${flag.environment_id}`}

                            </td>

                            <td>

                              <span

                                className={`badge ${flag.enabled ? "badge-enabled" : "badge-disabled"}`}

                              >

                                {flag.enabled ? "Enabled" : "Disabled"}

                              </span>

                            </td>

                            <td>{flag.owner_team || "—"}</td>

                            <td>

                              <div

                                style={{

                                  display: "flex",

                                  gap: 6,

                                  flexWrap: "wrap",

                                }}

                              >

                                <button

                                  type="button"

                                  className="secondary-button"

                                  onClick={() => openEditFlagForm(flag)}

                                >

                                  Edit

                                </button>

                                <button

                                  type="button"

                                  className="secondary-button"

                                  onClick={() => toggleFlag(flag)}

                                >

                                  {flag.enabled ? "Disable" : "Enable"}

                                </button>

                                <button

                                  type="button"

                                  className="logout-main-button"

                                  onClick={() => deleteFlag(flag)}

                                >

                                  Delete

                                </button>

                              </div>

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                )}

              </section>

            </>

          )}

          {view === "Environments" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>All Environments</h3>
                  <p>Configure and manage your deployment environments.</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="secondary-button" onClick={refreshDashboard} disabled={pageLoading}>
                    {pageLoading ? "Refreshing..." : "↻ Refresh"}
                  </button>
                  <button type="button" className="secondary-button" onClick={openCreateEnvironmentForm}>
                    + Create Environment
                  </button>
                </div>
              </div>

              {showEnvironmentForm && (
                <form onSubmit={saveEnvironment} style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  padding: 24,
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}>
                  <h3 style={{ gridColumn: "1 / -1", margin: 0 }}>
                    {editingEnvironment ? "Edit Environment" : "Create Environment"}
                  </h3>
                  <label>
                    Environment Name *
                    <input
                      value={environmentForm.name}
                      onChange={(e) => setEnvironmentForm({ ...environmentForm, name: e.target.value })}
                      placeholder="e.g. Staging"
                      minLength={2}
                      maxLength={100}
                      required
                    />
                  </label>
                  <label>
                    Description
                    <input
                      value={environmentForm.description}
                      onChange={(e) => setEnvironmentForm({ ...environmentForm, description: e.target.value })}
                      placeholder="Describe this environment"
                      maxLength={500}
                    />
                  </label>
                  <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="submit" className="secondary-button" disabled={savingEnvironment}>
                      {savingEnvironment ? "Saving..." : editingEnvironment ? "Save Changes" : "Create Environment"}
                    </button>
                    <button type="button" className="secondary-button" onClick={closeEnvironmentForm} disabled={savingEnvironment}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {environments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">▦</div>
                  <h3>No environments found</h3>
                  <p>Create your first environment to get started.</p>
                  <button type="button" className="secondary-button" onClick={openCreateEnvironmentForm}>
                    + Create Environment
                  </button>
                </div>
              ) : (
                <div className="environment-grid">
                  {environments.map((environment) => (
                    <article className="environment-card" key={environment.id}>
                      <div className="environment-symbol">▦</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4>{environment.name}</h4>
                        <p>{environment.description || "No description"}</p>
                        <small>Environment ID: {environment.id}</small>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                          <button type="button" className="secondary-button" onClick={() => openEditEnvironmentForm(environment)}>
                            Edit
                          </button>
                          <button type="button" className="logout-main-button" onClick={() => deleteEnvironment(environment)}>
                            Delete
                          </button>
                        </div>
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
