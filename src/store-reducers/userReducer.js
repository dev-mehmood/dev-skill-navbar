const { store } = require("@dev-skill/store");

const LOGIN_SUCCESS = store.unique("LOGIN_SUCCESS");
const LOGOUT_SUCCESS = store.unique("LOGOUT_SUCCESS");

const initialState = {
  user: {
    name: "",
    loggedIn: false,
    tokens: {
      authhorization: "",
      accessToken: "",
    },
    permissions: [],
    userRole: [],
  },
  users: [],
};

export const userActions = {
  loginSuccess: (payload) => ({ type: LOGIN_SUCCESS, payload }),
  logoutSuccess: (payload) => ({ type: LOGOUT_SUCCESS, payload }),
};

const userReducer = (user, { type, payload }, getState) => {
  switch (type) {
    case LOGIN_SUCCESS:
      return { ...user, ...payload, loggedIn: true };
    case LOGOUT_SUCCESS:
      return { loggedIn: false };
    default:
      return user;
  }
};

const usersReducer = (users = [], { type, payload }, getState) => {
  switch (type) {
    default:
      return users;
  }
};

export const userSelectors = {
  userLoggedIn: (state) => state.user.loggedIn,
  user: (state) => state.user,
};

export const login = ({ name, password }) => async (dispatch) => {
  debugger;

  try {
    await test();
    dispatch(userActions.loginSuccess({ name }));
  } catch (e) {
    return console.error(e.message);
  }
};
async function test() {
  return setTimeout(() => {
    return;
  }, 1000);
}
export const logout = () => async (dispatch) => {
  try {
    // const res = await api.post('/api/auth/logout/')
    await test();
    dispatch(userActions.logoutSuccess());
  } catch (e) {
    return console.error(e.message);
  }
};

const reducers = { user: userReducer, users: usersReducer };

store.registerReducerObject(initialState, reducers);
