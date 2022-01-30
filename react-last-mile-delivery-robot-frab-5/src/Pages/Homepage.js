/*
  * Homepage.js
  *
  *
  *  Created on: Oct 8, 2021
  *  Modified on: Jan 28, 2022
  * 
  *      Author: SakuranohanaTH
  * 
 */

/* REACT LIBRARY TOPICS RELATED CODE BEGIN */

import React, { useEffect } from "react";             // include React Library
import { useHistory } from "react-router-dom";      // include React Router DOM Library
import { FaUser, FaUsers } from "react-icons/fa";   // include React Icons Library
import { Button, Col, Row } from "react-bootstrap"; // include React Bootstrap Library
import { useMediaQuery } from "react-responsive";   // include React Responsive Library

/* REACT LIBRARY TOPICS RELATED CODE END */


export default function Homepage() {
  
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });   // Check responsive.
  const history = useHistory(); // Call window.history of React

/* Back button preventation */
  const onBackButtonEvent = async (event) => {
    event.preventDefault();
    history.push("/");
  };


  useEffect(() => {
    window.addEventListener("popstate", onBackButtonEvent);       // Attach window.popstate detection when user get in.
    return () => {
      window.removeEventListener("popstate", onBackButtonEvent);  // Detach window.popstate detection when user leave.
    };
  });


/* Convert to HTML5 */
  return (
    <div
      className="vw-100 vh-100 mx-0"
      style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
    >
      {isPortrait ? (
        <Row className="vw-100 vh-100 mx-0 ">
          <Col style={{ backgroundColor: "#FFFFFF" }}>
            <Row
              className="lastmilelogo p2 text-align-center p-1 mx-0"
              style={{ height: "40%" }}
            ></Row>
            <Row
              className="p2 text-align-center p-1 mx-0"
              style={{ height: "10%" }}
            >
              Please rotate your device to landscape mode.
            </Row>
            <Row
              className="rotatelogo p2 text-align-center p-1 mx-0"
              style={{ height: "40%" }}
            ></Row>
          </Col>
        </Row>
      ) : (
        <Row className="vw-100 vh-100 p-1 mx-0">
          <Row className="p-3 mx-0" xs={12}>
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
              <Row
                className="lastmilelogo p-3 mx-0"
                style={{ height: "20%", backgroundColor: "#FFFFFF" }}
                xs={12}
              ></Row>
              <Row
                className="p3 text-align-center p-1 mx-0"
                style={{ height: "15%" }}
                xs={12}
              >
                Welcome to Educational Robotic Interface System with Web
                Bluetooth Application.
              </Row>
              <Row
                className="p7 p-bold text-align-center p-1 mx-0"
                style={{ height: "15%", backgroundColor: "#E7E6E1" }}
                xs={12}
              >
                Select mode to play.
              </Row>
              <Row
                className="p7 text-align-center p-bold p-1 mx-0"
                style={{ height: "35%", backgroundColor: "#E7E6E1" }}
                xs={12}
              >
                <Col
                  className="p7 text-align-center"
                  style={{ backgroundColor: "#E7E6E1" }}
                  xs={6}
                >
                  <Button
                    // variant="contained"
                    size="lg"
                    color="primary"
                    style={{ width: "75%", height: "100%" }}
                    onClick={() => history.push("/multiplayer")}
                  >
                    <Row className="p3 text-align-center" xs={12}>
                      <FaUsers />
                      Multiplayer Mode
                    </Row>
                  </Button>
                </Col>
                <Col
                  className="p7 text-align-center"
                  style={{ backgroundColor: "#E7E6E1" }}
                  xs={6}
                >
                  <Button
                    // variant="contained"
                    size="lg"
                    color="primary"
                    style={{ width: "75%", height: "100%" }}
                    onClick={() => history.push("/singleplayer")}
                  >
                    <Row className="p3 text-align-center" xs={12}>
                      <FaUser />
                      Singleplayer Mode
                    </Row>
                  </Button>
                </Col>
              </Row>
              <Row
                className="p text-align-center p-1 mx-0"
                style={{ height: "15%" }}
                xs={12}
              >
                Version 1.0.1  |  29 Jan 2022  |  © {new Date().getFullYear()} FRAB5 Thesis.
              </Row>
            </Col>
          </Row>
        </Row>
      )}
    </div>
  );
}
