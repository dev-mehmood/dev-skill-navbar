import React, { useEffect, useState } from "react";
import { Link, BrowserRouter as Router } from "react-router-dom";
import "./root-component.css";
import { store } from "@dev-skill/store";
import { login, logout, userSelectors } from "./store-reducers/userReducer";

export default function Root(props) {
  const [user, setUser] = useState(store.getState("user"));
  const [loginFlag, setLoginFlag] = useState(store.getState("user.loggedIn"));
  // console.log(publicApiFunction())
  useEffect(() => {
    store.subscribe(
      (user, prevUser) => {
        setLoginFlag(user.loggedIn);
        setUser(user);
      },
      userSelectors.user,
      "user"
    );
  }, []);

  const { name } = user;
  return (
    <Router>
      <nav>
        <div class="logo">{name || "No user yet"}</div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/Blogs">Blogs</Link>
          </li>
        </ul>
        <ul class="auth-links">
          {!loginFlag ? (
            <li
              onClick={() => {
                debugger;
                store.dispatch(login({ name: "Asad" }));
              }}
            >
              Login
            </li>
          ) : (
            ""
          )}
          <li>Signup</li>
        </ul>
      </nav>
    </Router>
  );
}
