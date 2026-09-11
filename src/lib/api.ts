// ==============================================
// API Service Layer
// ==============================================
// Configure your backend URL here:
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://dashboard-backend-zvu0.onrender.com/api";

// Helper to get auth token from localStorage
function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

function setToken(token: string) {
  localStorage.setItem("auth_token", token);
}

function removeToken() {
  localStorage.removeItem("auth_token");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Um 401 em endpoints de autenticação (login/registro) é credencial inválida,
  // não sessão expirada — deixa o erro subir para a tela tratar.
  const isAuthEndpoint = endpoint.startsWith("/auth/login") || endpoint.startsWith("/auth/register");
  if (res.status === 401 && !isAuthEndpoint) {
    removeToken();
    window.location.href = "/login";
    throw new Error("Sessão expirada");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(error.message || `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ==============================================
// AUTH
// ==============================================
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    return data;
  },

  async me(): Promise<User> {
    return request<User>("/auth/me");
  },

  async updateProfile(data: { name: string; email: string }): Promise<User> {
    return request<User>("/auth/profile", { method: "PUT", body: JSON.stringify(data) });
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    return request<void>("/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout() {
    removeToken();
    window.location.href = "/login";
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },
};

// ==============================================
// TASKS
// ==============================================
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
}

export const tasksApi = {
  list: () => request<Task[]>("/tasks"),
  create: (data: Omit<Task, "id">) => request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Task>) => request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};

// ==============================================
// HABITS
// ==============================================
export interface Habit {
  id: string;
  name: string;
  icon: string; // icon name string, mapped in frontend
  completed: boolean;
  streak: number;
}

export const habitsApi = {
  list: () => request<Habit[]>("/habits"),
  create: (data: Omit<Habit, "id">) => request<Habit>("/habits", { method: "POST", body: JSON.stringify(data) }),
  toggle: (id: string) => request<Habit>(`/habits/${id}/toggle`, { method: "PATCH" }),
  delete: (id: string) => request<void>(`/habits/${id}`, { method: "DELETE" }),
};

// ==============================================
// GOALS
// ==============================================
export interface Goal {
  id: string;
  title: string;
  progress: number;
  target: string;
  deadline: string;
}

export const goalsApi = {
  list: () => request<Goal[]>("/goals"),
  create: (data: Omit<Goal, "id">) => request<Goal>("/goals", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Goal>) => request<Goal>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/goals/${id}`, { method: "DELETE" }),
};

// ==============================================
// NOTES
// ==============================================
export interface Note {
  id: string;
  content: string;
  color: string;
  createdAt: string;
}

export const notesApi = {
  list: () => request<Note[]>("/notes"),
  create: (data: { content: string; color: string }) => request<Note>("/notes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Note>) => request<Note>(`/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/notes/${id}`, { method: "DELETE" }),
};

// ==============================================
// FINANCES - Bills
// ==============================================
export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  paid: boolean;
}

export const billsApi = {
  list: () => request<Bill[]>("/bills"),
  create: (data: Omit<Bill, "id">) => request<Bill>("/bills", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Bill>) => request<Bill>(`/bills/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/bills/${id}`, { method: "DELETE" }),
};

// ==============================================
// FINANCES - Transactions
// ==============================================
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

export const transactionsApi = {
  list: () => request<Transaction[]>("/transactions"),
  create: (data: Omit<Transaction, "id">) => request<Transaction>("/transactions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Transaction>) => request<Transaction>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/transactions/${id}`, { method: "DELETE" }),
};

// ==============================================
// STATS / WEEKLY CHART
// ==============================================
export interface QuickStatsData {
  tasksToday: string;
  streak: string;
  activeGoals: number;
  monthlyBalance: string;
}

export interface WeeklyData {
  day: string;
  tasks: number;
  habits: number;
}

export const statsApi = {
  quickStats: () => request<QuickStatsData>("/stats/quick"),
  weeklyChart: () => request<WeeklyData[]>("/stats/weekly"),
};
