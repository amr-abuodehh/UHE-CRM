import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      toast.error(data.message);
      setAccessToken(data.accessToken);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/users/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch("/api/users/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        console.warn(
          "No valid refresh token found. User is not authenticated."
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setAccessToken(data.accessToken);
    } catch (error) {
      console.error("Token refresh error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAccessToken();
  }, []);

  useEffect(() => {
    if (accessToken) {
      const decodedToken = jwtDecode(accessToken);
      setUser(decodedToken);
    }
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{ accessToken, user, login, logout, refreshAccessToken, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
