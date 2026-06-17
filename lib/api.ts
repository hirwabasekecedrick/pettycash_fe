export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const UPLOADS_BASE = API_BASE.replace(/\/api$/, '');

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  },
  employees: {
    list: () => apiFetch('/employees'),
    create: (data: any) => apiFetch('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/employees/${id}`, { method: 'DELETE' }),
  },
  budgetItems: {
    list: () => apiFetch('/budget-items'),
  },
  assignments: {
    list: (params?: { mine?: boolean; month?: string }) => {
      const qs = new URLSearchParams();
      if (params?.mine) qs.append('mine', 'true');
      if (params?.month) qs.append('month', params.month);
      const qsStr = qs.toString();
      return apiFetch(`/assignments${qsStr ? `?${qsStr}` : ''}`);
    },
    create: (data: any) => apiFetch('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  },
  payments: {
    list: (params?: { month?: string }) => {
      const qs = params?.month ? `?month=${params.month}` : '';
      return apiFetch(`/payments${qs}`);
    },
    create: (formData: FormData) =>
      apiFetch('/payments', {
        method: 'POST',
        body: formData,
        headers: {
          'Idempotency-Key': crypto.randomUUID()
        }
      }),
  },
  dashboard: {
    stats: (params?: { month?: string }) => {
      const qs = params?.month ? `?month=${params.month}` : '';
      return apiFetch(`/dashboard${qs}`);
    },
  },
};
