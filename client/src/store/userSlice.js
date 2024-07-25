import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from './../axios';

// Async thunk for logging in the user
export const loginUser = createAsyncThunk('user/loginUser', async (credentials) => {
  console.log('sending request')
  const response = await axios.post('/login', credentials);
  console.log(response.data)
  return response.data; 
});

// Async thunk for fetching the user data
export const fetchUser = createAsyncThunk('user/fetchUser', async () => {
  
  const response = await axios.get('/loggedin');
  console.log(response.data)
  return response.data; // Assuming this returns the user data
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    data: null
  },
  reducers: {
    logoutUser: (state) => {
      state.data = null;
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
