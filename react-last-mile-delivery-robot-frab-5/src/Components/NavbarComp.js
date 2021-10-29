import React, { Component } from "react";
import {
  Navbar /*NavDropdown, Form, FormControl, Button, Nav */,
} from "react-bootstrap";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  // Link
} from "react-router-dom";

import Home from "./Home";
import Admin from "./Admin";

export default class NavbarComp extends Component {
  render() {
    return (
      <Router>
        <div>
          <Navbar bg="dark" variant={"dark"} expand="lg">
            <Navbar.Brand>
              เว็บแอปพลิเคชันควบคุมหุ่นยนต์ด้วยบลูทูธ
            </Navbar.Brand>
            {/* <Navbar.Toggle aria-controls="navbarScroll" /> */}
            {/* <Navbar.Collapse id="navbarScroll">
                            <Nav
                                className="mr-auto my-2 my-lg-0"
                                style={{ maxHeight: '100px' }}
                                navbarScroll
                            >
                                <Nav.Link as={Link} to="/home">Home</Nav.Link>
                                <Nav.Link as={Link} to="/about">About</Nav.Link>
                                <Nav.Link as={Link} to="/contact">Contact</Nav.Link>

                            </Nav>

                        </Navbar.Collapse> */}
          </Navbar>
        </div>
        <div>
          <Switch>
            <Route path="/admin">
              <Admin />
            </Route>
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </div>
      </Router>
    );
  }
}
