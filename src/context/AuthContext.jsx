import React, { createContext, useEffect, useState } from "react";
import { MockAuthAPI } from "../api/mockAuth";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // On mount: check if user is already logged in
  useEffect(() => {
    const currentUser = MockAuthAPI.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  // SIGNUP
  const signup = async (email, password) => {
    try {
      setError("");
      const newUser = await MockAuthAPI.signup(email, password);
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // LOGIN
  const login = async (email, password) => {
    try {
      setError("");
      const loggedInUser = await MockAuthAPI.login(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // LOGOUT
  const logout = () => {
    MockAuthAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}