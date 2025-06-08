// services/axiosClient.ts (or utils/axiosClient.ts)
import axios from 'axios'; // Import the default axios instance
import useAppStore from './stores/app'; // Adjust path as needed

// Create a named instance if you want to be explicit,
// but often, configuring the default export is enough.
const apiClient = axios.create({
  baseURL: process.env.VITE_BACKEND_API_URL || 'http://localhost:3000', // Set your API base URL
  timeout: 10000, // Optional: Set a timeout
  headers: {
    'Content-Type': 'application/json', // Optional: Common headers
  },
});

// Subscribe to store changes to update the Authorization header
useAppStore.subscribe(
    (state) => {
      // This callback runs whenever any part of the store state changes
      // We only care if accessToken *actually* changed
      if (state.accessToken) {
        // Set the Authorization header for common requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
      } else {
        // Remove the Authorization header
        delete apiClient.defaults.headers.common['Authorization'];
      }
    },
);

export default apiClient;