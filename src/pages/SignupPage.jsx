import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(true);
  
  const { signup, login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isSignup) {
        await signup(email, password);
        console.log("Signup successful!");
      } else {
        await login(email, password);
        console.log("Login successful!");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", padding: 20 }}>
      <h2>{isSignup ? "Sign Up" : "Login"}</h2>
      
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
          {isSignup ? "Sign Up" : "Login"}
        </button>
      </form>

      {!isSignup && (
        <p
          style={{
            marginTop: 15,
            textAlign: "center",
            color: "#666",
            fontSize: "14px",
          }}
        >
          Demo account: <strong>test@example.com</strong> | Password:{" "}
          <strong>password123</strong>
        </p>
      )}

      <p style={{ marginTop: 15, textAlign: "center" }}>
        {isSignup ? "Already have an account? " : "Don't have an account? "}
        <button 
          onClick={() => {
            setIsSignup(!isSignup);
            setError("");
          }}
          style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", textDecoration: "underline" }}
        >
          {isSignup ? "Login" : "Sign Up"}
        </button>
      </p>
    </div>
  );
}