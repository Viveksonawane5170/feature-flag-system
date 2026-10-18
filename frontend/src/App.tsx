
import { useState } from "react";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";

      const body = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Please check your input."
        );
      }

      if (isLogin) {
        localStorage.setItem("access_token", data.access_token);
        setMessage("Login successful!");
      } else {
        setMessage("Registration successful! Please log in.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="auth-card">
        <h1>Feature Flag System</h1>
        <p className="subtitle">
          Manage your features with confidence.
        </p>

        <div className="tabs">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(true);
              setMessage("");
            }}
          >
            Login
          </button>
          <button
            className={!isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(false);
              setMessage("");
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
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
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

        {message && <p className="message">{message}</p>}

        <p className="footer-text">
          Feature Flag Management System
        </p>
      </section>
    </main>
  );
}

export default App;
