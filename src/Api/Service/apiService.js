import CONFIG from '../Config/config';

const BASE = CONFIG.BASE_URL.replace(/\/$/, '');

// Token management
const TOKEN_KEY = 'agn_auth_token';

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, opts = {}) {
  // Add auth token to headers if available
  const token = getToken();
  if (token) {
    opts.headers = {
      ...opts.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      // If 401 Unauthorized, clear token
      if (res.status === 401) {
        clearToken();
      }
      const err = new Error(json && json.error ? json.error : `Request failed: ${res.status}`);
      err.response = json;
      throw err;
    }
    return json;
  } catch (e) {
    // non-json or parse fail
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return text;
  }
}

export async function adminLogin(username, password) {
  const result = await request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  // Save token if provided
  if (result && result.token) {
    saveToken(result.token);
  }
  
  return result;
}

export async function employerLogin(username, password) {
  const result = await request('/api/employer/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  // Save token if provided
  if (result && result.token) {
    saveToken(result.token);
  }
  
  return result;
}

export async function employerSignup({ username, company_name, email, password, phone, location, referance }) {
  return request('/api/employer/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, company_name, email, password, phone, location, referance }),
  });
}

export async function listEmployees(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/employees?${qs}`);
}

export async function getEmployee(employeeId) {
  return request(`/api/employee/${employeeId}`);
}

export async function insertEmployee(formData) {
  // formData should be a FormData instance for file uploads
  return request('/insert_employee', {
    method: 'POST',
    body: formData,
  });
}

export async function updateEmployeeCv(employeeId, formData) {
  return request(`/api/employee/${employeeId}/update_cv`, {
    method: 'POST',
    body: formData,
  });
}

export async function createHireRequest({ employer_id, employee_id, message }) {
  return request('/api/hire-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employer_id, employee_id, message }),
  });
}

export async function getEmployerHireRequests(employer_id) {
  return request(`/api/hire-requests/${employer_id}`);
}

export async function getAllHireRequests() {
  return request('/api/admin/hire-requests');
}

export async function respondToHireRequest({ request_id, status, response_message }) {
  return request('/api/admin/hire-request/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id, status, response_message }),
  });
}

export async function getDashboardStats() {
  return request('/api/admin/dashboard/stats');
}

export async function getRecentActivity() {
  return request('/api/admin/dashboard/recent-activity');
}

// Jobs API
export async function getJobs() {
  return request('/api/jobs');
}

export async function createJob(payload = {}) {
  return request('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteJob(jobId, payload = {}) {
  return request(`/api/jobs/${jobId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteEmployee(employeeId) {
  return request(`/api/employee/${employeeId}`, {
    method: 'DELETE',
  });
}

export async function deleteEmployer(employerId) {
  return request(`/api/employer/${employerId}`, {
    method: 'DELETE',
  });
}

export default {
  adminLogin,
  employerLogin,
  employerSignup,
  listEmployees,
  getEmployee,
  insertEmployee,
  updateEmployeeCv,
  createHireRequest,
  getEmployerHireRequests,
  getAllHireRequests,
  respondToHireRequest,
  getDashboardStats,
  getRecentActivity,
  deleteEmployee,
  deleteEmployer,
};
