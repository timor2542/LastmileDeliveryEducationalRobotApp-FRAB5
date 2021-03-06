/*
 * Singleplayer.js
 *
 *
 *  Created on: Oct 8, 2021
 *  Modified on: May 11, 2022
 *
 *      Author: SakuranohanaTH
 *
 */

/* REACT LIBRARY TOPICS RELATED CODE BEGIN */

import React, { useState, useEffect } from "react"; // include React Library
import { useHistory } from "react-router-dom"; // include React Router DOM Library
import { Button, Col, Row } from "react-bootstrap";
import { useMediaQuery } from "react-responsive";
import { BiReset } from "react-icons/bi"; // include React Icons Library
import { GiExitDoor } from "react-icons/gi"; // include React Icons Library
import {
  ImArrowDown,
  ImArrowLeft,
  ImArrowRight,
  ImArrowUp,
} from "react-icons/im"; // include React Icons Library
import {
  MdBluetooth,
  MdOutlineBluetoothDisabled,
  MdOutlineControlCamera,
} from "react-icons/md"; // include React Icons Library
import { RiPinDistanceFill } from "react-icons/ri"; // include React Icons Library
import { SiProbot, SiStatuspal } from "react-icons/si"; // include React Icons Library

let bluetoothDevice = null; // Bluetooth Device Name Global Variable
let distanceEncoderSensorCharacteristic = null; // Distance Encoder Sensor Characteristic Global Variable
let commandCharacteristic = null; // Command Characteristic Global Variable

/* EXPORT DEFAULT FUNCTION SINGLEPLAYER CODE BEGIN */
export default function Singleplayer() {
  // eslint-disable-next-line
  const [version, setVersion] = useState("1.10.0");

  /* CALL HISTORY BEGIN */
  const history = useHistory();

  /* CALL HISTORY END */

  /* BACK BUTTON EVENT ON BROWNSER CODE BEGIN */
  function onBackButtonEvent(event) {
    event.preventDefault();
    disconnectToBluetoothDevice();
    // history.push("/");
    history.goForward();
    history.push("/");
  }

  /* BACK BUTTON EVENT ON BROWNSER CODE END */

  /* EXIT BUTTON EVENT ON SINGLEPLAYER UI CODE BEGIN */
  function onExitButtonEvent() {
    // event.preventDefault();
    disconnectToBluetoothDevice();
    history.goForward();
    history.push("/");
  }

  /* EXIT BUTTON EVENT ON SINGLEPLAYER UI CODE END */

  /* ALERT MESSEGE BEFORE UNLOAD PAGE CODE BEGIN */
  const onBeforeUnload = (event) => {
    // the method that will be used for both add and remove event
    event.preventDefault();
    let confirmationMessage = "";
    /* Do you small action code here */
    (event || window.event).returnValue = confirmationMessage;
    disconnectToBluetoothDevice(); //Gecko + IE
    return confirmationMessage;
  };
  /* ALERT MESSEGE BEFORE UNLOAD PAGE CODE END */
  /* DISCONNNECT BLUETOOTH DEVICE AFTER UNLOAD PAGE CODE BEGIN */
  const afterUnload = () => {
    disconnectToBluetoothDevice();
  };

  /* DISCONNNECT BLUETOOTH DEVICE AFTER UNLOAD PAGE COED END */

  /* DYNAMIC OF COMPONENT CODE BEGIN */
  useEffect(() => {
    window.addEventListener("popstate", onBackButtonEvent);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("unload", afterUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("unload", afterUnload);
      window.removeEventListener("popstate", onBackButtonEvent);
    };
  });
  /* DYNAMIC OF COMPONENT CODE END */

  /* DELAY FUNCTION CODE BEGIN */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /* DELAY FUNCTION CODE END */

  /* DELAY STABILITY IN MILLISECONDS TO SEND DATA TO BLUETOOTH DEVICE CODE BEGIN */
  const stability_delay = 1;

  /* DELAY STABILITY IN MILLISECONDS TO SEND DATA TO BLUETOOTH DEVICE CODE END */

  /* BLUETOOTH LOW ENEGRY RELATED VARIABLES CODE BEGIN */
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] =
    useState("Not connected");

  const myESP32ServiceUUID = "818796aa-2f20-11ec-8d3d-0242ac130003";
  // const weightSensorCharacteristicUUID = "818798d0-2f20-11ec-8d3d-0242ac130003";
  const distanceEncoderSensorCharacteristicUUID =
    "818799c0-2f20-11ec-8d3d-0242ac130003";
  const commandCharacteristicUUID = "81879be6-2f20-11ec-8d3d-0242ac130003";

  const forwardCommand = 0x50;
  const spinLeftCommand = 0x52;
  const spinRightCommand = 0x53;
  const backwardCommand = 0x51;
  const stopCommand = 0x54;
  // const restartCommand = 0x55;
  const [distanceEncoderSensorValue, setDistanceEncoderSensorValue] = useState(
    (0).toFixed(3)
  );

  const [isUpButtonPressed, setIsUpButtonPressed] = useState(false);
  const [isDownButtonPressed, setIsDownButtonPressed] = useState(false);
  const [isLeftButtonPressed, setIsLeftButtonPressed] = useState(false);
  const [isRightButtonPressed, setIsRightButtonPressed] = useState(false);
  const [isStopButtonPressed, setIsStopButtonPressed] = useState(false);
  const [isDirectionButtonReleased, setIsDirectionButtonReleased] =
    useState(false);

  function onDisconnected() {
    setDistanceEncoderSensorValue((0).toFixed(3));

    // await bluetoothDevice.gatt.disconnect();

    // weightSensorCharacteristic = null;
    distanceEncoderSensorCharacteristic = null;
    commandCharacteristic = null;
    bluetoothDevice = null;
    setBluetoothDeviceName("Not connected");
    setIsBluetoothConnected(false);
  }
  async function connectToBluetoothDevice() {
    if (!navigator.bluetooth) {
      return;
    }
    if (isBluetoothConnected && bluetoothDeviceName !== "Not connected"){
      return;
    }
    try {
      setBluetoothDeviceName("Not connected");
      setIsBluetoothConnected(false);
      bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "EDUBOT" }],
        optionalServices: [
          myESP32ServiceUUID,
          // weightSensorCharacteristicUUID,
          distanceEncoderSensorCharacteristicUUID,
          commandCharacteristicUUID,
        ],
      });
      bluetoothDevice.addEventListener(
        "gattserverdisconnected",
        onDisconnected
      );
      // //console.log("Connecting to GATT Server...");

      const server = await bluetoothDevice.gatt.connect();

      // //console.log("Getting Service...");
      const service = await server.getPrimaryService(myESP32ServiceUUID);

      // //console.log("Getting Characteristic...");
      distanceEncoderSensorCharacteristic = await service.getCharacteristic(
        distanceEncoderSensorCharacteristicUUID
      );
      commandCharacteristic = await service.getCharacteristic(
        commandCharacteristicUUID
      );

      // await weightSensorCharacteristic.startNotifications();
      await distanceEncoderSensorCharacteristic.startNotifications();
      // //console.log("> Notifications started");
      distanceEncoderSensorCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleDistanceEncoderSensorNotifications
      );
      setBluetoothDeviceName(bluetoothDevice.name);
      setIsBluetoothConnected(true);
      // sendCommand(0x57);
    } catch {
      setDistanceEncoderSensorValue((0).toFixed(3));

      // await bluetoothDevice.gatt.disconnect();

      // weightSensorCharacteristic = null;
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      setIsBluetoothConnected(false);
    }
  }
  async function disconnectToBluetoothDevice() {
    if (!navigator.bluetooth) {
      return;
    }
    if (!isBluetoothConnected || bluetoothDeviceName === "Not connected"){
      return;
    }
    try {
      distanceEncoderSensorCharacteristic.removeEventListener(
        "characteristicvaluechanged",
        handleDistanceEncoderSensorNotifications
      );
      await distanceEncoderSensorCharacteristic.stopNotifications();

      setDistanceEncoderSensorValue((0).toFixed(3));

      await bluetoothDevice.gatt.disconnect();

      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      setIsBluetoothConnected(false);
    } catch {
      setDistanceEncoderSensorValue((0).toFixed(3));

      // await bluetoothDevice.gatt.disconnect();
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      setIsBluetoothConnected(false);
    }
  }
 function handleDistanceEncoderSensorNotifications(event) {
      let value = event.target.value;
      let result = 0;
      // Convert raw data bytes to hex values just for the sake of showing something.
      // In the "real" world, you'd use data.getUint8, data.getUint16 or even
      // TextDecoder to process raw data bytes.
      for (let i = 0; i < value.byteLength; i++) {
        result += value.getUint8(i) << (8 * i);
      }
      // setDistanceEncoderSensorValue(result);
      setDistanceEncoderSensorValue((result / 1000).toFixed(3));
      // setDistanceEncoderSensorValue((0.00329119230376073577362753116344*result).toFixed(1));
  }

  async function sendCommand(data) {
    if (!isBluetoothConnected || bluetoothDeviceName === "Not connected") {
      return;
    }
    try {
      if (
        /webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        await commandCharacteristic.writeValue(Uint8Array.of(data));
      } else {
        await commandCharacteristic.writeValueWithoutResponse(
          Uint8Array.of(data)
        );
      }
    } catch {
      // await sendCommand(data);
      // await sendCommand(stopCommand);
    }
  }

  async function resetAllValue() {
    if (!isBluetoothConnected || bluetoothDeviceName === "Not connected") {
      return;
    }

    setIsUpButtonPressed(true);
    setIsDownButtonPressed(true);
    setIsLeftButtonPressed(true);
    setIsRightButtonPressed(true);
    setIsStopButtonPressed(true);

    setDistanceEncoderSensorValue((0).toFixed(3));
    await sendCommand(0x56);
    setDistanceEncoderSensorValue((0).toFixed(3));

    setIsUpButtonPressed(false);
    setIsDownButtonPressed(false);
    setIsLeftButtonPressed(false);
    setIsRightButtonPressed(false);
    setIsStopButtonPressed(false);
  }


  /* BLUETOOTH LOW ENEGRY RELATED VARIABLES CODE END */

  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" }); // Check responsive.

  /* Convert to HTML5 */
  return (
    <div className="vw-100 vh-100" style={{ backgroundColor: "#F7F6E7" }}>
      {isPortrait ? (
        <Row className="vw-100 vh-100 p-1 mx-0 ">
          <Row className="mx-0 ">
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
              <Row
                className="p-1"
                style={{ height: "10%", backgroundColor: "#FFFFFF" }}
              >
                <Col
                  style={{
                    height: "100%",
                    justifyContent: "left",
                    alignItems: "center",
                    textAlign: "left",
                    wordBreak: "break-all",
                  }}
                  xs={3}
                >
                  <Button
                    size="lg"
                    color="primary"
                    variant="outline-danger"
                    onClick={() => {
                      onExitButtonEvent();
                    }}
                  >
                    <Row className="p-arrow-button text-align-center" xs={12}>
                      <GiExitDoor />
                    </Row>
                  </Button>
                </Col>
                <Col
                  className="lastmilelogo ph3 text-align-center"
                  style={{
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                  xs={6}
                ></Col>
                <Col
                  style={{
                    height: "100%",
                    justifyContent: "right",
                    alignItems: "center",
                    textAlign: "right",
                  }}
                  xs={3}
                >
                  {isBluetoothConnected ? (
                    <Button
                      size="lg"
                      variant="outline-danger"
                      // style={{ height: "100%", width: "100%" }}
                      onClick={async () => await disconnectToBluetoothDevice()}
                      disabled={
                        !isBluetoothConnected ||
                        isDownButtonPressed ||
                        isRightButtonPressed ||
                        isLeftButtonPressed ||
                        isUpButtonPressed ||
                        isStopButtonPressed ||
                        isDirectionButtonReleased
                      }
                    >
                      <Row className="p-arrow-button text-align-center" xs={12}>
                        <MdOutlineBluetoothDisabled />
                      </Row>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="outline-primary"
                      // style={{ height: "100%", width: "100%" }}
                      onClick={async () => await connectToBluetoothDevice()}
                      disabled={
                        isBluetoothConnected ||
                        isDownButtonPressed ||
                        isRightButtonPressed ||
                        isLeftButtonPressed ||
                        isUpButtonPressed ||
                        isStopButtonPressed ||
                        isDirectionButtonReleased
                      }
                    >
                      <Row className="p-arrow-button text-align-center" xs={12}>
                        <MdBluetooth />
                      </Row>
                    </Button>
                  )}
                </Col>
              </Row>

              <Row
                className=""
                style={{ height: "2%", backgroundColor: "#FFFFFF" }}
              ></Row>
              <Row
                className=""
                style={{ height: "5%", backgroundColor: "#FFFFFF" }}
              >
                <Col
                  className="ph3 text-align-center text-white border border-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#000000",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={6}
                >
                  <SiStatuspal />
                  &nbsp;&nbsp;Status
                </Col>
                <Col
                  className="ph3 text-align-center text-white border border-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#000000",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={6}
                >
                  <SiProbot />
                  &nbsp;&nbsp;Robot Name
                </Col>
              </Row>

              <Row
                className=""
                style={{
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  height: "8%",
                }}
              >
                {isBluetoothConnected ? (
                  <Col
                    className="ph7 text-align-center text-white border border-dark"
                    style={{
                      backgroundColor: "#008000",
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>Connected</Row>
                  </Col>
                ) : (
                  <Col
                    className="ph7 text-align-center text-white border border-dark"
                    style={{
                      backgroundColor: "#FF0000",
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>Disconnected</Row>
                  </Col>
                )}

                <Col
                  className="ph7 text-align-center border border-dark"
                  style={{ height: "100%" }}
                  xs={6}
                >
                  <Row xs={12}>{bluetoothDeviceName}</Row>
                </Col>
              </Row>

              <Row
                className=""
                style={{ height: "2%", backgroundColor: "#FFFFFF" }}
              ></Row>
              <Row
                className=""
                style={{ height: "5%", backgroundColor: "#FFFFFF" }}
              >
                <Col
                  className="ph3 text-align-center text-white border border-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#000000",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={12}
                >
                  <RiPinDistanceFill />
                  &nbsp;&nbsp;Distance
                </Col>
              </Row>
              <Row
                className="p4 text-align-center"
                style={{ height: "10%", backgroundColor: "#FFFFFF" }}
              >
                <Col
                  className="ph7 text-align-center border border-dark"
                  style={{
                    height: "100%",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={12}
                >
                  <Row xs={12}>{distanceEncoderSensorValue}&nbsp;&nbsp;m</Row>
                </Col>
              </Row>

              <Row
                className="p4 text-align-center p-1"
                style={{ height: "10%", backgroundColor: "#FFFFFF" }}
              >
                <Col
                  className="ph3 text-align-center text-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#FFFFFF",
                    justifyContent: "left",
                    alignItems: "center",
                    wordBreak: "break-all",
                  }}
                  xs={3}
                ></Col>
                <Col
                  className="ph3 text-align-center text-white border border-white"
                  style={{
                    height: "100%",
                    // backgroundColor: "#000000",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={6}
                >
                  <Button
                    size="lg"
                    variant="outline-danger"
                    onClick={async () => await resetAllValue()}
                    disabled={
                      !isBluetoothConnected ||
                      isDownButtonPressed ||
                      isRightButtonPressed ||
                      isLeftButtonPressed ||
                      isUpButtonPressed ||
                      isStopButtonPressed ||
                      isDirectionButtonReleased
                    }
                  >
                    <Row className="p-arrow-button text-align-center" xs={12}>
                      <BiReset />
                    </Row>
                  </Button>
                </Col>
                <Col
                  className="ph3 text-align-center text-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#FFFFFF",
                    justifyContent: "right",
                    alignItems: "center",
                    wordBreak: "break-all",
                  }}
                  xs={3}
                ></Col>
              </Row>
              <Row
                className=""
                style={{ height: "3%", backgroundColor: "#FFFFFF" }}
              ></Row>
              <Row
                className="ph7 text-align-center text-white p-1"
                style={{
                  height: "10%",
                  backgroundColor: "#000000",
                  textAlign: "center",
                }}
              >
                <Col
                  className="ph7 text-align-center text-white"
                  style={{
                    height: "100%",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={12}
                >
                  <MdOutlineControlCamera />
                  &nbsp;&nbsp;Driving&nbsp;Directions
                </Col>
              </Row>
              <Row
                className="p5 text-align-center border border-dark"
                style={{ height: "35%", backgroundColor: "#FFFFFF" }}
              >
                <div style={{ display: "block", height: "99%", width: "100%" }}>
                  <Row
                    xs={3}
                    style={{ height: "33%" }}
                    className="text-align-center"
                  >
                    <Col
                      // style={{
                      //   backgroundColor: "red",
                      // }}
                      xs={4}
                    ></Col>
                    <Col
                      // style={{ backgroundColor: "yellow" }}
                      xs={4}
                    >
                      <Row className="text-align-center" xs={12}>
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ height: "95%", width: "95%" }}
                          onMouseDown={async () => {
                            setIsUpButtonPressed(true);
                            await sendCommand(forwardCommand);
                          }}
                          onMouseUp={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsUpButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          onTouchStart={async () => {
                            setIsUpButtonPressed(true);
                            await sendCommand(forwardCommand);
                          }}
                          onTouchEnd={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsUpButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          disabled={
                            !isBluetoothConnected ||
                            isDownButtonPressed ||
                            isRightButtonPressed ||
                            isLeftButtonPressed ||
                            isStopButtonPressed ||
                            isDirectionButtonReleased
                          }
                        >
                          <Row
                            className="p-arrow-button text-align-center"
                            xs={12}
                          >
                            <ImArrowUp />
                          </Row>
                        </Button>
                      </Row>
                    </Col>
                    <Col
                      // style={{
                      //   backgroundColor: "green",
                      // }}
                      xs={4}
                    ></Col>
                  </Row>
                  <Row
                    xs={3}
                    style={{ height: "33%" }}
                    className="text-align-center"
                  >
                    <Col
                      // style={{
                      //   backgroundColor: "red",
                      // }}
                      xs={4}
                    >
                      <Row className="text-align-center" xs={12}>
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ height: "95%", width: "95%" }}
                          onMouseDown={async () => {
                            setIsLeftButtonPressed(true);
                            await sendCommand(spinLeftCommand);
                          }}
                          onMouseUp={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsLeftButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          onTouchStart={async () => {
                            setIsLeftButtonPressed(true);
                            await sendCommand(spinLeftCommand);
                          }}
                          onTouchEnd={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsLeftButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          disabled={
                            !isBluetoothConnected ||
                            isDownButtonPressed ||
                            isRightButtonPressed ||
                            isUpButtonPressed ||
                            isStopButtonPressed ||
                            isDirectionButtonReleased
                          }
                        >
                          <Row
                            className="p-arrow-button text-align-center"
                            xs={12}
                          >
                            <ImArrowLeft />
                          </Row>
                        </Button>
                      </Row>
                    </Col>
                    <Col
                      // style={{
                      //   backgroundColor: "yellow",
                      // }}
                      xs={4}
                    >
                      {/* <Row className="text-align-center" xs={12}>
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ height: "95%", width: "95%" }}
                          onMouseDown={async () => {
                            setIsStopButtonPressed(true);
                            await sendCommand(stopCommand);
                          }}
                          onMouseUp={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsStopButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          onTouchStart={async () => {
                            setIsStopButtonPressed(true);
                            await sendCommand(stopCommand);
                          }}
                          onTouchEnd={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsStopButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          disabled={
                            !isBluetoothConnected ||
                            isDownButtonPressed ||
                            isRightButtonPressed ||
                            isUpButtonPressed ||
                            isLeftButtonPressed ||
                            isDirectionButtonReleased
                          }
                        >
                          <Row
                            className="p-arrow-button text-align-center"
                            xs={12}
                          >
                            <GiStopSign />
                          </Row>
                        </Button>
                      </Row> */}
                    </Col>
                    <Col
                      // style={{
                      //   backgroundColor: "green",
                      // }}
                      xs={4}
                    >
                      <Row className="text-align-center" xs={12}>
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ height: "95%", width: "95%" }}
                          onMouseDown={async () => {
                            setIsRightButtonPressed(true);
                            await sendCommand(spinRightCommand);
                          }}
                          onMouseUp={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsRightButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          onTouchStart={async () => {
                            setIsRightButtonPressed(true);
                            await sendCommand(spinRightCommand);
                          }}
                          onTouchEnd={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsRightButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          disabled={
                            !isBluetoothConnected ||
                            isDownButtonPressed ||
                            isStopButtonPressed ||
                            isUpButtonPressed ||
                            isLeftButtonPressed ||
                            isDirectionButtonReleased
                          }
                        >
                          <Row
                            className="p-arrow-button text-align-center"
                            xs={12}
                          >
                            <ImArrowRight />
                          </Row>
                        </Button>
                      </Row>
                    </Col>
                  </Row>
                  <Row
                    xs={3}
                    style={{ height: "33%" }}
                    className="text-align-center"
                  >
                    <Col
                      className="ph"
                      style={{
                        display: "flex",
                        justifyContent: "left",
                        alignItems: "flex-end",
                        height: "100%",
                      }}
                      xs={4}
                    >
                      Singleplayer
                      <br />
                      Mode
                    </Col>
                    <Col
                      // style={{
                      //   backgroundColor: "yellow",
                      // }}
                      xs={4}
                    >
                      <Row className="text-align-center" xs={12}>
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ height: "95%", width: "95%" }}
                          onMouseDown={async () => {
                            setIsDownButtonPressed(true);
                            await sendCommand(backwardCommand);
                          }}
                          onMouseUp={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsDownButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          onTouchStart={async () => {
                            setIsDownButtonPressed(true);
                            await sendCommand(backwardCommand);
                          }}
                          onTouchEnd={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsDownButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          disabled={
                            !isBluetoothConnected ||
                            isRightButtonPressed ||
                            isStopButtonPressed ||
                            isUpButtonPressed ||
                            isLeftButtonPressed ||
                            isDirectionButtonReleased
                          }
                        >
                          <Row
                            className="p-arrow-button text-align-center"
                            xs={12}
                          >
                            <ImArrowDown />
                          </Row>
                        </Button>
                      </Row>
                    </Col>

                    <Col
                      className="ph3"
                      style={{
                        display: "flex",
                        justifyContent: "right",
                        alignItems: "flex-end",
                        height: "100%",
                      }}
                      xs={4}
                    >
                      V{version}
                    </Col>
                  </Row>
                </div>
              </Row>
            </Col>
          </Row>
        </Row>
      ) : (
        <Row className="vw-100 vh-100 p-1 mx-0 ">
          <Row className="p-1 mx-0">
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={4}>
              <Row
                style={{
                  alignItems: "center",
                  height: "10%",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Col
                  style={{
                    height: "100%",
                    textAlign: "left",
                    wordBreak: "break-all",
                  }}
                >
                  <Button
                    size="lg"
                    color="primary"
                    variant="outline-danger"
                    onClick={() => {
                      // await sendCommand(restartCommand);
                      onExitButtonEvent();
                    }}
                    style={{ height: "100%", width: "25%" }}
                  >
                    <Row className="p-arrow-button text-align-center" xs={12}>
                      <GiExitDoor />
                    </Row>
                  </Button>
                </Col>
              </Row>
              <Row
                className="lastmilelogo mx-0"
                style={{ height: "20%", backgroundColor: "#FFFFFF" }}
              ></Row>
              <Row
                className="p4 text-align-center p-1 mx-0"
                style={{ height: "10%", backgroundColor: "#FFFFFF" }}
              >
                <Col
                  className="p3 text-align-center"
                  style={{
                    height: "100%",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={12}
                >
                  Singleplayer&nbsp;Mode
                </Col>
              </Row>
              <Row
                className="p text-align-center text-white p-1 text-white border border-white"
                style={{ height: "10%", backgroundColor: "#000000" }}
              >
                <Col
                  className="p3 text-align-center text-white"
                  style={{
                    height: "100%",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={12}
                >
                  <MdOutlineControlCamera />
                  &nbsp;&nbsp;Driving&nbsp;Directions
                </Col>
              </Row>
              <Row
                className="p5 text-align-center border border-dark"
                style={{ height: "50%", backgroundColor: "#FFFFFF" }}
              >
                <div style={{ display: "block", height: "99%", width: "100%" }}>
                  <Row
                    xs={3}
                    style={{ height: "33%" }}
                    className="text-align-center"
                  >
                    <Col
                      // style={{
                      //   backgroundColor: "red",
                      // }}
                      xs={4}
                    ></Col>
                    <Col
                      // style={{ backgroundColor: "yellow" }}
                      xs={4}
                    >
                      <Row className="text-align-center" xs={12}>
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ height: "95%", width: "95%" }}
                          onMouseDown={async () => {
                            setIsUpButtonPressed(true);
                            await sendCommand(forwardCommand);
                          }}
                          onMouseUp={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsUpButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          onTouchStart={async () => {
                            setIsUpButtonPressed(true);
                            await sendCommand(forwardCommand);
                          }}
                          onTouchEnd={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsUpButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          disabled={
                            !isBluetoothConnected ||
                            isDownButtonPressed ||
                            isRightButtonPressed ||
                            isLeftButtonPressed ||
                            isStopButtonPressed ||
                            isDirectionButtonReleased
                          }
                        >
                          <Row
                            className="p-arrow-button text-align-center"
                            xs={12}
                          >
                            <ImArrowUp />
                          </Row>
                        </Button>
                      </Row>
                    </Col>
                    <Col
                      // style={{
                      //   backgroundColor: "green",
                      // }}
                      xs={4}
                    ></Col>
                  </Row>
                  <Row
                    xs={3}
                    style={{ height: "33%" }}
                    className="text-align-center"
                  >
                    <Col
                      // style={{
                      //   backgroundColor: "red",
                      // }}
                      xs={4}
                    >
                      <Row className="text-align-center" xs={12}>
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ height: "95%", width: "95%" }}
                          onMouseDown={async () => {
                            setIsLeftButtonPressed(true);
                            await sendCommand(spinLeftCommand);
                          }}
                          onMouseUp={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsLeftButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          onTouchStart={async () => {
                            setIsLeftButtonPressed(true);
                            await sendCommand(spinLeftCommand);
                          }}
                          onTouchEnd={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsLeftButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          disabled={
                            !isBluetoothConnected ||
                            isDownButtonPressed ||
                            isRightButtonPressed ||
                            isUpButtonPressed ||
                            isStopButtonPressed ||
                            isDirectionButtonReleased
                          }
                        >
                          <Row
                            className="p-arrow-button text-align-center"
                            xs={12}
                          >
                            <ImArrowLeft />
                          </Row>
                        </Button>
                      </Row>
                    </Col>
                    <Col
                      // style={{
                      //   backgroundColor: "yellow",
                      // }}
                      xs={4}
                    >
                      {/* <Row className="text-align-center" xs={12}>
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ height: "95%", width: "95%" }}
                          onMouseDown={async () => {
                            setIsStopButtonPressed(true);
                            await sendCommand(stopCommand);
                          }}
                          onMouseUp={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsStopButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          onTouchStart={async () => {
                            setIsStopButtonPressed(true);
                            await sendCommand(stopCommand);
                          }}
                          onTouchEnd={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsStopButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          disabled={
                            !isBluetoothConnected ||
                            isDownButtonPressed ||
                            isRightButtonPressed ||
                            isUpButtonPressed ||
                            isLeftButtonPressed ||
                            isDirectionButtonReleased
                          }
                        >
                          <Row
                            className="p-arrow-button text-align-center"
                            xs={12}
                          >
                            <GiStopSign />
                          </Row>
                        </Button>
                      </Row> */}
                    </Col>
                    <Col
                      // style={{
                      //   backgroundColor: "green",
                      // }}
                      xs={4}
                    >
                      <Row className="text-align-center" xs={12}>
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ height: "95%", width: "95%" }}
                          onMouseDown={async () => {
                            setIsRightButtonPressed(true);
                            await sendCommand(spinRightCommand);
                          }}
                          onMouseUp={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsRightButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          onTouchStart={async () => {
                            setIsRightButtonPressed(true);
                            await sendCommand(spinRightCommand);
                          }}
                          onTouchEnd={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsRightButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          disabled={
                            !isBluetoothConnected ||
                            isDownButtonPressed ||
                            isStopButtonPressed ||
                            isUpButtonPressed ||
                            isLeftButtonPressed ||
                            isDirectionButtonReleased
                          }
                        >
                          <Row
                            className="p-arrow-button text-align-center"
                            xs={12}
                          >
                            <ImArrowRight />
                          </Row>
                        </Button>
                      </Row>
                    </Col>
                  </Row>
                  <Row
                    xs={3}
                    style={{ height: "33%" }}
                    className="text-align-center"
                  >
                    <Col
                      // style={{
                      //   backgroundColor: "red",
                      // }}
                      xs={4}
                    ></Col>
                    <Col
                      // style={{
                      //   backgroundColor: "yellow",
                      // }}
                      xs={4}
                    >
                      <Row className="text-align-center" xs={12}>
                        <Button
                          variant="primary"
                          size="lg"
                          style={{ height: "95%", width: "95%" }}
                          onMouseDown={async () => {
                            setIsDownButtonPressed(true);
                            await sendCommand(backwardCommand);
                          }}
                          onMouseUp={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsDownButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          onTouchStart={async () => {
                            setIsDownButtonPressed(true);
                            await sendCommand(backwardCommand);
                          }}
                          onTouchEnd={async () => {
                            setIsDirectionButtonReleased(true);
                            await sleep(stability_delay);
                            await sendCommand(stopCommand);
                            setIsDownButtonPressed(false);
                            setIsDirectionButtonReleased(false);
                          }}
                          disabled={
                            !isBluetoothConnected ||
                            isRightButtonPressed ||
                            isStopButtonPressed ||
                            isUpButtonPressed ||
                            isLeftButtonPressed ||
                            isDirectionButtonReleased
                          }
                        >
                          <Row
                            className="p-arrow-button text-align-center"
                            xs={12}
                          >
                            <ImArrowDown />
                          </Row>
                        </Button>
                      </Row>
                    </Col>
                    <Col
                      // style={{
                      //   backgroundColor: "green",
                      // }}
                      xs={4}
                    ></Col>
                  </Row>
                </div>
              </Row>
            </Col>
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={6}>
              <Row
                className="p-1"
                style={{
                  alignItems: "flex-start",
                  backgroundColor: "#FFFFFF",
                  height: "10%",
                }}
              >
                <Col
                  className="p3 text-align-center text-white border border-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#000000",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={6}
                >
                  <SiStatuspal />
                  &nbsp;&nbsp;Status
                </Col>
                <Col
                  className="p3 text-align-center text-white border border-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#000000",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={6}
                >
                  <SiProbot />
                  &nbsp;&nbsp;Robot Name
                </Col>
              </Row>

              <Row
                className="p-1"
                style={{
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  height: "12%",
                }}
              >
                {isBluetoothConnected ? (
                  <Col
                    className="p3 text-align-center text-white border border-dark"
                    style={{
                      backgroundColor: "#008000",
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>Connected</Row>
                  </Col>
                ) : (
                  <Col
                    className="p3 text-align-center text-white border border-dark"
                    style={{
                      backgroundColor: "#FF0000",
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>Disconnected</Row>
                  </Col>
                )}

                <Col
                  className="p3 text-align-center border border-dark"
                  style={{
                    height: "100%",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={6}
                >
                  <Row xs={12}>{bluetoothDeviceName}</Row>
                </Col>
              </Row>

              <Row
                className=""
                style={{
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  height: "5%",
                }}
              ></Row>
              <Row
                className="p-1 mx-0"
                style={{
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  height: "15%",
                }}
              >
                <Col
                  className="p3 text-align-center text-white border border-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#000000",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={12}
                >
                  <RiPinDistanceFill />
                  &nbsp;&nbsp;Distance
                </Col>
              </Row>
              <Row
                className="p-1 mx-0"
                style={{
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  height: "30%",
                }}
              >
                <Col
                  className="p7 text-align-center border border-dark"
                  style={{
                    height: "100%",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={12}
                >
                  <Row xs={12}>{distanceEncoderSensorValue}&nbsp;&nbsp;m</Row>
                </Col>
              </Row>
              <Row
                className="p-1 mx-0"
                style={{
                  alignItems: "flex-start",
                  backgroundColor: "#FFFFFF",
                  height: "15%",
                }}
              >
                <Col
                  className="p3 text-align-center text-white border border-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#FFFFFF",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={3}
                ></Col>
                <Col
                  className="p3 text-align-center text-white"
                  style={{
                    height: "100%",
                    // backgroundColor: "#000000",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={6}
                >
                  <Button
                    size="lg"
                    variant="outline-danger"
                    style={{ height: "100%", width: "100%" }}
                    onClick={async () => resetAllValue()}
                    disabled={
                      !isBluetoothConnected ||
                      isDownButtonPressed ||
                      isRightButtonPressed ||
                      isLeftButtonPressed ||
                      isUpButtonPressed ||
                      isStopButtonPressed ||
                      isDirectionButtonReleased
                    }
                  >
                    <Row className="p-arrow-button text-align-center" xs={12}>
                      <BiReset />
                    </Row>
                  </Button>
                </Col>
                <Col
                  className="p3 text-align-center text-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#FFFFFF",
                    justifyContent: "left",
                    alignItems: "center",
                    wordBreak: "break-all",
                  }}
                  xs={3}
                ></Col>
              </Row>

              <Row
                className="p-0 mx-0"
                style={{
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  height: "5%",
                }}
              ></Row>
            </Col>

            <Col style={{ backgroundColor: "#FFFFFF" }} xs={2}>
              <Row
                className="p-1"
                style={{
                  alignItems: "flex-start",
                  backgroundColor: "#FFFFFF",
                  height: "10%",
                }}
              >
                <Col
                  className="p3 text-align-center text-white border border-white"
                  style={{
                    height: "100%",
                    backgroundColor: "#000000",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                  xs={12}
                >
                  Connection
                </Col>
              </Row>
              <Row
                className=""
                style={{
                  alignItems: "center",

                  backgroundColor: "#FFFFFF",
                  height: "10%",
                }}
              >
                <Col
                  style={{
                    display: "flex",
                    height: "100%",
                    justifyContent: "right",
                    alignItems: "flex-start",
                    wordBreak: "break-all",
                  }}
                  xs={12}
                >
                  {isBluetoothConnected ? (
                    <Button
                      size="lg"
                      variant="outline-danger"
                      style={{ height: "100%", width: "100%" }}
                      onClick={async () => await disconnectToBluetoothDevice()}
                      disabled={
                        !isBluetoothConnected ||
                        isDownButtonPressed ||
                        isRightButtonPressed ||
                        isLeftButtonPressed ||
                        isUpButtonPressed ||
                        isStopButtonPressed ||
                        isDirectionButtonReleased
                      }
                    >
                      <Row className="p-arrow-button text-align-center" xs={12}>
                        <MdOutlineBluetoothDisabled />
                      </Row>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="outline-primary"
                      style={{ height: "100%", width: "100%" }}
                      onClick={async () => await connectToBluetoothDevice()}
                      disabled={
                        isBluetoothConnected ||
                        isDownButtonPressed ||
                        isRightButtonPressed ||
                        isLeftButtonPressed ||
                        isUpButtonPressed ||
                        isStopButtonPressed ||
                        isDirectionButtonReleased
                      }
                    >
                      <Row className="p-arrow-button text-align-center" xs={12}>
                        <MdBluetooth />
                      </Row>
                    </Button>
                  )}
                </Col>
              </Row>
              <Row
                className="p-0 mx-0"
                style={{
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  height: "75%",
                }}
              ></Row>
              <Row
                className="p-0 mx-0"
                style={{
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  height: "5%",
                }}
              >
                <Col
                  className="p"
                  style={{
                    display: "flex",
                    justifyContent: "right",
                    alignItems: "flex-end",
                    height: "100%",
                    wordBreak: "break-all",
                  }}
                  xs={12}
                >
                  <Row xs={12}>V{version}</Row>
                </Col>
              </Row>
            </Col>
          </Row>
        </Row>
      )}
    </div>
  );
}
/* EXPORT DEFAULT FUNCTION SINGLEPLAYER CODE END */
