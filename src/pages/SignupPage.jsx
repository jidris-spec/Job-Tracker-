import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function SignupPage({ onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { signup } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signup(email, password);
      console.log("Signup successful!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", padding: 20 }}>
      <h2>Sign Up</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 5 }}
            required
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 5 }}
            required
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          type="submit"
          style={{ width: "100%", padding: 10, background: "#3b82f6", color: "white", border: "none", cursor: "pointer" }}
        >
          Sign Up
        </button>
      </form>

      <p style={{ marginTop: 15, textAlign: "center" }}>
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: "none",
            border: "none",
            color: "#3b82f6",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Login
        </button>
      </p>
    </div>
  );
}
