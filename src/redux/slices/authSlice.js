import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi, getMeApi } from "../../services/authService";

export const login = createAsyncThunk(
  "auth/login",
  async (data, thunkAPI) => {

    try {

      const res = await loginApi(data);

      return res.data;

    } catch (err) {

      return thunkAPI.rejectWithValue(err.response.data);

    }

  }
);

export const getMe = createAsyncThunk(
  "auth/getMe",
  async (_, thunkAPI) => {

    try {

      const res = await getMeApi();

      return res.data.data;

    } catch (err) {

      return thunkAPI.rejectWithValue(err.response.data);

    }

  }
);

const initialState = {
  token: localStorage.getItem("token") || null,
  user: null,
  loading: false
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {

    logout: (state) => {

      state.token = null;
      state.user = null;

      localStorage.removeItem("token");

    }

  },

  extraReducers: (builder) => {

    builder

      .addCase(login.fulfilled, (state, action) => {

        const token = action.payload.data.accessToken;

        state.token = token;

        localStorage.setItem("token", token);

      })

      .addCase(getMe.fulfilled, (state, action) => {

        state.user = action.payload;

      });

  }

});

export const { logout } = authSlice.actions;

export default authSlice.reducer;