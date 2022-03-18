/*
 * Homepage.js
 *
 *
 *  Created on: Oct 8, 2021
 *  Modified on: Mar 8, 2022
 *
 *      Author: SakuranohanaTH
 *
 */

/* REACT LIBRARY TOPICS RELATED CODE BEGIN */

import React, { useState, useEffect, useCallback } from "react"; // include React Library
import { useHistory } from "react-router-dom"; // include React Router DOM Library
import { FaUser, FaUsers } from "react-icons/fa"; // include React Icons Library
import { BsArrowsFullscreen, BsFullscreenExit } from "react-icons/bs"; // include React Icons Library
import { Button, Col, Row } from "react-bootstrap"; // include React Bootstrap Library
import { useMediaQuery } from "react-responsive"; // include React Responsive Library
import { FullScreen, useFullScreenHandle } from "react-full-screen";
/* REACT LIBRARY TOPICS RELATED CODE END */
/* EXPORT DEFAULT FUNCTION HOMEPAGE CODE BEGIN */
export default function Homepage() {
  const handle = useFullScreenHandle();
  const [version, setVersion] = useState("1.4.0");
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" }); // Check responsive.
  const history = useHistory(); // Call window.history of React

  /* BACK BUTTON EVENT TO HOMEPAGE CODE BEGIN */
  const onBackButtonEvent = async (event) => {
    event.preventDefault();
    history.push("/");
  };

  useEffect(() => {
    window.addEventListener("popstate", onBackButtonEvent); // Attach window.popstate detection when user get in.
    return () => {
      window.removeEventListener("popstate", onBackButtonEvent); // Detach window.popstate detection when user leave.
    };
  });
  /* BACK BUTTON EVENT TO HOMEPAGE CODE END */

  /* Convert to HTML5 */
  return (
    <FullScreen handle={handle}>
    <div
      className="vw-100 vh-100 mx-0"
      style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
    >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
              {/* <Row
                  style={{alignItems:"center",height: "10%", backgroundColor: "#FFFFFF" }}
                >
                  <Col style={{textAlign:"right"}}>
                    {handle.active ? (
                      <Button
                        size="lg"
                        color="primary"
                        variant="outline-dark"
                      style={{ height: "100%" }}
                        onClick={handle.exit}
                      >
                        <Row className="ph3 text-align-center" xs={12}>
                          <BsFullscreenExit />
                        </Row>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        color="primary"
                        variant="outline-dark"
                        
                      style={{height: "50%" }}
                        onClick={handle.enter}
                      >
                        <Row className="ph3 text-align-center" xs={12}>
                          <BsArrowsFullscreen />
                        </Row>
                      </Button>
                    )}
                    </Col>
                </Row> */}
              <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "20%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                >
                </Row>
                <Row
                  className="ph3 text-align-center p-1 mx-0"
                  style={{ textAlign: "center", height: "15%" }}
                  xs={12}
                >
                  Welcome to <br /> Educational Robotic Interface System
                  <br />
                  with Web Bluetooth Application.
                </Row>
                <Row
                  className="ph7 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%", backgroundColor: "#E7E6E1" }}
                  xs={12}
                >
                  Select mode to play.
                </Row>
                <Row
                  className="ph7 text-align-center p-bold p-1 mx-0"
                  style={{ height: "35%", backgroundColor: "#E7E6E1" }}
                  xs={12}
                >
                  <Row
                    className="ph7 text-align-center p-bold p-1 mx-0"
                    style={{ height: "50%", backgroundColor: "#E7E6E1" }}
                    xs={12}
                  >
                    <Button
                      size="lg"
                      color="primary"
                      style={{ width: "55%", height: "60%" }}
                      onClick={async () => history.push("/multiplayer")}
                    >
                      <Row className="ph3 text-align-center" xs={12}>
                        <FaUsers />
                        Multiplayer Mode
                      </Row>
                    </Button>
                  </Row>
                  <Row
                    className="ph7 text-align-center p-bold p-1 mx-0"
                    style={{ height: "50%", backgroundColor: "#E7E6E1" }}
                    xs={12}
                  >
                    <Button
                      size="lg"
                      color="primary"
                      style={{ width: "55%", height: "60%" }}
                      onClick={async () => history.push("/singleplayer")}
                    >
                      <Row className="ph3 text-align-center" xs={12}>
                        <FaUser />
                        Singleplayer Mode
                      </Row>
                    </Button>
                  </Row>
                </Row>
                <Row
                  className="ph text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Version {version} | © {new Date().getFullYear()} FRAB5 Thesis.
                </Row>
              </Col>
            </Row>
          </Row>
        ) : (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
              {/* <Row
                  style={{alignItems:"center",height: "10%", backgroundColor: "#FFFFFF" }}
                >
                  <Col style={{textAlign:"right"}}>
                    {handle.active ? (
                      <Button
                        size="lg"
                        color="primary"
                        variant="outline-dark"
                      style={{ height: "100%" }}
                        onClick={handle.exit}
                      >
                        <Row className="p3 text-align-center" xs={12}>
                          <BsFullscreenExit />
                        </Row>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        color="primary"
                        variant="outline-dark"
                        
                      style={{height: "50%" }}
                        onClick={handle.enter}
                      >
                        <Row className="p3 text-align-center" xs={12}>
                          <BsArrowsFullscreen />
                        </Row>
                      </Button>
                    )}
                    </Col>
                </Row> */}
              <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "20%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                >
                </Row>
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
                  Version {version} | © {new Date().getFullYear()} FRAB5 Thesis.
                </Row>
              </Col>
            </Row>
          </Row>
        )}
    </div>
    </FullScreen>
  );
}

/* EXPORT DEFAULT FUNCTION HOMEPAGE CODE END */
