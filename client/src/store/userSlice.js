import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from './../axios';

// Async thunk for logging in the user
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post('/login', credentials);
      
      // Save JWT to local storage
      localStorage.setItem('token', response.data.token);
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ message: error.message });
    }
  }
);

// Async thunk for fetching the user data
export const fetchUser = createAsyncThunk('user/fetchUser', async () => {
  try {
    const response = await axios.get('/loggedin');
    console.log(`fetchUser response: ${JSON.stringify(response.data)}`); // Add log to verify response data
    return response.data;  // Ensure the complete user object is returned
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    data: null
  },
  reducers: {
    logoutUser: (state) => {
      state.data = null;
      localStorage.removeItem('token'); // Clear JWT from local storage on logout
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.data = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.data = action.payload;
      })
      .addCase(loginUser.rejected, (state) => {
        state.data =null;
      });
  },
});

export const { logoutUser } = userSlice.actions;

export default userSlice;
