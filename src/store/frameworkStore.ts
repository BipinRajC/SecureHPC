import { create } from 'zustand';
import api from '../utils/api';
import { Framework } from '../types/framework';

interface FrameworkState {
  frameworks: Framework[];
  loading: boolean;
  error: string | null;
  fetchFrameworks: () => Promise<void>;
  addCustomFramework: (framework: Omit<Framework, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  clearError: () => void;
}

const useFrameworkStore = create<FrameworkState>((set, get) => ({
  frameworks: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchFrameworks: async () => {
    // Don't set loading to true if already loading
    if (get().loading) {
      console.log('Already loading frameworks, skipping fetch');
      return;
    }
    
    set({ loading: true, error: null });

    try {
      console.log('Fetching frameworks...');
      const response = await api.get('/frameworks', {
        timeout: 15000, // Extend timeout for potential slow responses
      });
      console.log('Frameworks response:', response.data);
      set({ frameworks: response.data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching frameworks:', error);
      let errorMessage = 'Failed to fetch frameworks';
      
      if (error.response) {
        // Server responded with an error
        errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || error.message}`;
      } else if (error.request) {
        // Request made but no response received
        errorMessage = 'No response from server. Check if server is running.';
      } else {
        // Other errors
        errorMessage = error.message;
      }
      
      set({ error: errorMessage, loading: false });
    }
  },

  addCustomFramework: async (framework) => {
    set({ loading: true, error: null });

    try {
      console.log('Adding custom framework:', framework);
      
      // Validate required fields before sending
      if (!framework.name || !framework.version || !framework.description) {
        throw new Error('Missing required fields');
      }
      
      if (!framework.controls || !Array.isArray(framework.controls) || framework.controls.length === 0) {
        throw new Error('Controls array is required');
      }
      
      const response = await api.post('/frameworks', framework, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // Extend timeout for larger payloads
      });
      
      console.log('Framework created successfully:', response.data);
      
      // Add the new framework to state
      set((state) => ({ 
        frameworks: [...state.frameworks, response.data], 
        loading: false 
      }));
    } catch (error: any) {
      console.error('Error adding framework:', error);
      let errorMessage = 'Failed to create framework';
      
      if (error.response) {
        // Server responded with an error
        errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || error.message}`;
      } else if (error.request) {
        // Request made but no response received
        errorMessage = 'No response from server. Check if server is running.';
      } else {
        // Other errors
        errorMessage = error.message;
      }
      
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },
}));

export default useFrameworkStore; 