/*
 * Singleplayer.js
 *
 *
 *  Created on: Oct 8, 2021
 *  Modified on: Mar 8, 2022
 *
 *      Author: SakuranohanaTH
 *
 */

/* REACT LIBRARY TOPICS RELATED CODE BEGIN */

import React, { useState, useEffect } from "react"; // include React Library
import { useHistory } from "react-router-dom"; // include React Router DOM Library
import { Button, Col, Row } from "react-bootstrap";
import { useMediaQuery } from "react-responsive";
import { AiOutlineMenu } from "react-icons/ai"; // include React Icons Library
import { BiReset } from "react-icons/bi"; // include React Icons Library
import { FaWeight, FaLink } from "react-icons/fa"; // include React Icons Library
import { GiExitDoor, GiStopSign } from "react-icons/gi"; // include React Icons Library
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
import { SiProbot } from "react-icons/si"; // include React Icons Library

let bluetoothDevice = null; // Bluetooth Device Name Global Variable
// let weightSensorCharacteristic = null; // Weight Sensor Characteristic Global Variable
let distanceEncoderSensorCharacteristic = null; // Distance Encoder Sensor Characteristic Global Variable
let commandCharacteristic = null; // Command Characteristic Global Variable

/* EXPORT DEFAULT FUNCTION SINGLEPLAYER CODE BEGIN */
export default function SingleplayerNew() {
  const [version, setVersion] = useState("1.3.0");
  /* CALL HISTORY BEGIN */
  const history = useHistory();

  /* CALL HISTORY END */

  /* BACK BUTTON EVENT ON BROWNSER CODE BEGIN */
  const onBackButtonEvent = async (event) => {
    event.preventDefault();
    await disconnectToBluetoothDevice();
    history.push("/");
  };

  /* BACK BUTTON EVENT ON BROWNSER CODE END */

  /* EXIT BUTTON EVENT ON SINGLEPLAYER UI CODE BEGIN */
  const onExitButtonEvent = async () => {
    // event.preventDefault();
    await disconnectToBluetoothDevice();
    history.push("/");
  };

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

  const [weightSensorValue, setWeightSensorValue] = useState(0);
  const [distanceEncoderSensorValue, setDistanceEncoderSensorValue] = useState(
    (0).toFixed(1)
  );

  const [isUpButtonPressed, setIsUpButtonPressed] = useState(false);
  const [isDownButtonPressed, setIsDownButtonPressed] = useState(false);
  const [isLeftButtonPressed, setIsLeftButtonPressed] = useState(false);
  const [isRightButtonPressed, setIsRightButtonPressed] = useState(false);
  const [isStopButtonPressed, setIsStopButtonPressed] = useState(false);
  const [isDirectionButtonReleased, setIsDirectionButtonReleased] =
    useState(false);

  async function onDisconnected(event) {
    setWeightSensorValue(0);
    setDistanceEncoderSensorValue((0).toFixed(1));

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
      alert(
        "Caution: Web Bluetooth is disabled! Please go to chrome://flags and enable it."
      );
      return;
    }
    if (isBluetoothConnected && bluetoothDeviceName !== "Not connected") {
      return;
    }
    try {
      setBluetoothDeviceName("Not connected");
      setIsBluetoothConnected(false);
      bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "ESP32" }],
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
      // bluetoothDevice.addEventListener()

      // //console.log("Getting Service...");
      const service = await server.getPrimaryService(myESP32ServiceUUID);

      // //console.log("Getting Characteristic...");
      // weightSensorCharacteristic = await service.getCharacteristic(
      //   weightSensorCharacteristicUUID
      // );
      distanceEncoderSensorCharacteristic = await service.getCharacteristic(
        distanceEncoderSensorCharacteristicUUID
      );
      commandCharacteristic = await service.getCharacteristic(
        commandCharacteristicUUID
      );

      // await weightSensorCharacteristic.startNotifications();
      await distanceEncoderSensorCharacteristic.startNotifications();
      // //console.log("> Notifications started");
      // weightSensorCharacteristic.addEventListener(
      //   "characteristicvaluechanged",
      //   handleWeightSensorNotifications
      // );
      distanceEncoderSensorCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleDistanceEncoderSensorNotifications
      );
      setBluetoothDeviceName(bluetoothDevice.name);
      setIsBluetoothConnected(true);
      // sendCommand(0x57);
    } catch {
      setWeightSensorValue(0);
      setDistanceEncoderSensorValue((0).toFixed(1));

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
      alert(
        "Caution: Web Bluetooth is disabled! Please go to chrome://flags and enable it."
      );
      return;
    }
    if (!isBluetoothConnected || bluetoothDeviceName === "Not connected") {
      return;
    }

    try {
      // sendCommand(restartCommand);
      // weightSensorCharacteristic.removeEventListener(
      //   "characteristicvaluechanged",
      //   handleWeightSensorNotifications
      // );
      distanceEncoderSensorCharacteristic.removeEventListener(
        "characteristicvaluechanged",
        handleDistanceEncoderSensorNotifications
      );
      // await weightSensorCharacteristic.stopNotifications();
      await distanceEncoderSensorCharacteristic.stopNotifications();

      // resetAllValue();

      setWeightSensorValue(0);
      setDistanceEncoderSensorValue((0).toFixed(1));

      await bluetoothDevice.gatt.disconnect();

      // weightSensorCharacteristic = null;
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      setIsBluetoothConnected(false);
    } catch {
      // sendCommand(restartCommand);
      setWeightSensorValue(0);
      setDistanceEncoderSensorValue((0).toFixed(1));

      // await bluetoothDevice.gatt.disconnect();

      // weightSensorCharacteristic = null;
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      setIsBluetoothConnected(false);
    }
  }
  // async function handleWeightSensorNotifications(event) {
  //   try {
  //     let value = event.target.value;
  //     let result = 0;
  //     // Convert raw data bytes to hex values just for the sake of showing something.
  //     // In the "real" world, you'd use data.getUint8, data.getUint16 or even
  //     // TextDecoder to process raw data bytes.
  //     for (let i = 0; i < value.byteLength; i++) {
  //       result += value.getUint8(i) << (8 * i);
  //     }

  //     setWeightSensorValue(result);
  //   } catch {}
  // }

  async function handleDistanceEncoderSensorNotifications(event) {
    try {
      let value = event.target.value;
      let result = 0;
      // Convert raw data bytes to hex values just for the sake of showing something.
      // In the "real" world, you'd use data.getUint8, data.getUint16 or even
      // TextDecoder to process raw data bytes.
      for (let i = 0; i < value.byteLength; i++) {
        result += value.getUint8(i) << (8 * i);
      }
      // setDistanceEncoderSensorValue(result);
      setDistanceEncoderSensorValue((result / 10).toFixed(1));
      // setDistanceEncoderSensorValue((0.00329119230376073577362753116344*result).toFixed(1));
    } catch {}
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

    // setWeightSensorValue(0);
    // setDistanceEncoderSensorValue((0).toFixed(1));

    await sendCommand(0x56);

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
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={3}>
              <Row
                className="p4 text-align-center p-1 mx-0"
                style={{ height: "10%", backgroundColor: "#FFFFFF" }}
              >
                Singleplayer Mode
              </Row>
              <Row
                className="lastmilelogo mx-0"
                style={{ height: "20%", backgroundColor: "#FFFFFF" }}
              ></Row>
              <Row
                className="p4 text-align-center p-1 mx-0"
                style={{ height: "10%", backgroundColor: "#FFFFFF" }}
              >
                Singleplayer Mode
              </Row>
              <Row
                className="p text-align-center text-white p-1"
                style={{ height: "15%", backgroundColor: "#000000" }}
              >
                <MdOutlineControlCamera />
                Driving Directions
              </Row>
              <Row
                className="p5 text-align-center border border-dark"
                style={{ height: "45%", backgroundColor: "#FFFFFF" }}
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
                      <Row className="text-align-center" xs={12}>
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
                      </Row>
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
          </Row>
        </Row>
      ) : (
        <Row className="vw-100 vh-100 p-1 mx-0 ">
          <Row className="p-1 mx-0">
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={3}>
              <Row
                style={{
                  alignItems: "center",
                  height: "10%",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Col style={{ textAlign: "left" }}>
                  <Button
                    size="lg"
                    color="primary"
                    variant="outline-danger"
                    onClick={async () => {
                      // await sendCommand(restartCommand);
                      await onExitButtonEvent();
                    }}
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
                Singleplayer Mode
              </Row>
              <Row
                className="p text-align-center text-white p-1"
                style={{ height: "15%", backgroundColor: "#000000" }}
              >
                <MdOutlineControlCamera />
                Driving Directions
              </Row>
              <Row
                className="p5 text-align-center border border-dark"
                style={{ height: "45%", backgroundColor: "#FFFFFF" }}
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
                      <Row className="text-align-center" xs={12}>
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
                      </Row>
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
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={9}>
              <Row style={{height:"10%"}}>
                  <Row
                    style={{
                      alignItems: "center",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <Col style={{ textAlign: "right" }}>
                      <Button
                        size="lg"
                        color="primary"
                        // variant="outline-danger"
                        // onClick={async () => {
                        //   // await sendCommand(restartCommand);
                        //   await onExitButtonEvent();
                        // }}
                      >
                        <Row
                          className="p-arrow-button text-align-center"
                          xs={12}
                        >
                          <MdBluetooth />
                        </Row>
                      </Button>
                    </Col>
                  </Row>
              </Row>
            </Col>
          </Row>
        </Row>
      )}
    </div>
  );
}
/* EXPORT DEFAULT FUNCTION SINGLEPLAYER CODE END */
