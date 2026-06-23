// Mock user database (stored in localStorage)
const USERS_KEY = "mock_users";
const CURRENT_USER_KEY = "current_user";

// Initialize mock users
function initializeMockUsers() {
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
localStorage.setItem(
  USERS_KEY,
  JSON.stringify([
    {
      uid: crypto.randomUUID(),
      email: "test@example.com",
      password: "password123",
      createdAt: new Date().toISOString(),
    },
  ])
);  }
}

export const MockAuthAPI = {
  // SIGNUP
  async signup(email, password) {
    initializeMockUsers();
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY));
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      throw new Error("User already exists");
    }
    
    // Create new user
    const newUser = {
      uid: crypto.randomUUID(),
      email,
      password, // In real app, this would be hashed!
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Log them in automatically
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
      uid: newUser.uid,
      email: newUser.email,
    }));
    
    return {
      uid: newUser.uid,
      email: newUser.email,
    };
  },

  // LOGIN
  async login(email, password) {
    initializeMockUsers();
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY));
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error("Invalid email or password");
    }
    
    // Store current user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
      uid: user.uid,
      email: user.email,
    }));
    
    return {
      uid: user.uid,
      email: user.email,
    };
  },

  // GET CURRENT USER
  getCurrentUser() {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // LOGOUT
  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },
};