/*
  * App.js
  *
  *
  *  Created on: Oct 8, 2021
  *  Modified on: Jan 28, 2022
  * 
  *      Author: SakuranohanaTH
  * 
 */

import React from "react";             // include React Library
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";      // include React Router DOM Library
import { makeStyles } from "@material-ui/styles";

import Multiplayer from "./Pages/Multiplayer";
import Homepage from "./Pages/Homepage";
import Singleplayer from "./Pages/Singleplayer";

import "./App.css";
const useStyles = makeStyles({
  container: {

    /*
     *
     * To protect longer touch screen for text-selection
     *
     */

    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    KhtmlUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none",
    userSelect: "none",
    // -webkit-touch-callout: none; /* iOS Safari */
    // -webkit-user-select: none; /* Safari */
    //  -khtml-user-select: none; /* Konqueror HTML */
    //    -moz-user-select: none; /* Old versions of Firefox */
    //     -ms-user-select: none; /* Internet Explorer/Edge */
    //         user-select: none; /* Non-prefixed version, currently
  },
});

export default function App() {
  const classes = useStyles();
  return (
    <div className={classes.container}>
      <Router>
        <Route exact path="/">
          <Redirect to="/homepage" />
        </Route>
        <Route path="/homepage" render={(props) => <Homepage {...props} />} />
        <Route
          path="/singleplayer"
          render={(props) => <Singleplayer {...props} />}
        />
        <Route
          path="/multiplayer"
          render={(props) => <Multiplayer {...props} />}
        />
      </Router>
    </div>
  );
}
