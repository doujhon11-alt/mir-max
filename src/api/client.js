const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_KEY = import.meta.env.VITE_API_KEY || 'change_this_secret_key';

const client = {
  async request(method, endpoint, data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async get(endpoint) {
    return this.request('GET', endpoint);
  },

  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  },

  async patch(endpoint, data) {
    return this.request('PATCH', endpoint, data);
  },

  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
};

export default client;
