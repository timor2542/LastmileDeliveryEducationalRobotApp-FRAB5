/*
  * Singleplayer.js
  *
  *
  *  Created on: Oct 8, 2021
  *  Modified on: Jan 28, 2022
  * 
  *      Author: SakuranohanaTH
  * 
 */
import React, { useState, useEffect } from "react";   // include React Library
import { useHistory } from "react-router-dom";      // include React Router DOM Library
import { Button, Col, Row } from "react-bootstrap";
import { useMediaQuery } from "react-responsive";
import { AiOutlineMenu } from "react-icons/ai";   // include React Icons Library
import { BiReset } from "react-icons/bi";   // include React Icons Library
import { FaWeight, FaLink } from "react-icons/fa";   // include React Icons Library
import { GiExitDoor, GiStopSign } from "react-icons/gi";   // include React Icons Library
import {
  ImArrowDown,
  ImArrowLeft,
  ImArrowRight,
  ImArrowUp,
} from "react-icons/im";   // include React Icons Library
import {
  MdBluetooth,
  MdOutlineBluetoothDisabled,
  MdOutlineControlCamera,
} from "react-icons/md";   // include React Icons Library
import { RiPinDistanceFill } from "react-icons/ri";   // include React Icons Library
import { SiProbot } from "react-icons/si";   // include React Icons Library

let bluetoothDevice = null;
let weightSensorCharacteristic = null;
let distanceEncoderSensorCharacteristic = null;
let commandCharacteristic = null;

export default function Singleplayer() {
  const history = useHistory();
  const onBackButtonEvent = async (event) => {
    event.preventDefault();
    await disconnectToBluetoothDevice();
    history.push("/singleplayer");
  };
  const onExituttonEvent = async () => {
    // event.preventDefault();
    await disconnectToBluetoothDevice();
    history.push("/");
  };
  const onBeforeUnload = (event) => {
    // the method that will be used for both add and remove event
    event.preventDefault();
    let confirmationMessage = "";
    /* Do you small action code here */
    (event || window.event).returnValue = confirmationMessage;
    disconnectToBluetoothDevice(); //Gecko + IE
    return confirmationMessage;
  };
  const afterUnload = () => {
    disconnectToBluetoothDevice();
  };

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
  /*
   *
   * Delay/Sleep function
   *
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const stability_delay = 150;

  /*
   *
   * Bluetooth related variables
   *
   */
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] =
    useState("Not connected");

  const myESP32ServiceUUID = "818796aa-2f20-11ec-8d3d-0242ac130003";
  const weightSensorCharacteristicUUID = "818798d0-2f20-11ec-8d3d-0242ac130003";
  const distanceEncoderSensorCharacteristicUUID =
    "818799c0-2f20-11ec-8d3d-0242ac130003";
  const commandCharacteristicUUID = "81879be6-2f20-11ec-8d3d-0242ac130003";

  const forwardCommand = 0x50;
  const spinLeftCommand = 0x52;
  const spinRightCommand = 0x53;
  const backwardCommand = 0x51;
  const stopCommand = 0x54;
  const restartCommand = 0x55;

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
          weightSensorCharacteristicUUID,
          distanceEncoderSensorCharacteristicUUID,
          commandCharacteristicUUID,
        ],
      });

      // //console.log("Connecting to GATT Server...");

      const server = await bluetoothDevice.gatt.connect();
      // bluetoothDevice.addEventListener()

      // //console.log("Getting Service...");
      const service = await server.getPrimaryService(myESP32ServiceUUID);

      // //console.log("Getting Characteristic...");
      weightSensorCharacteristic = await service.getCharacteristic(
        weightSensorCharacteristicUUID
      );
      distanceEncoderSensorCharacteristic = await service.getCharacteristic(
        distanceEncoderSensorCharacteristicUUID
      );
      commandCharacteristic = await service.getCharacteristic(
        commandCharacteristicUUID
      );

      await weightSensorCharacteristic.startNotifications();
      await distanceEncoderSensorCharacteristic.startNotifications();
      // //console.log("> Notifications started");
      weightSensorCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleWeightSensorNotifications
      );
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

      weightSensorCharacteristic = null;
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
      sendCommand(restartCommand);
      weightSensorCharacteristic.removeEventListener(
        "characteristicvaluechanged",
        handleWeightSensorNotifications
      );
      distanceEncoderSensorCharacteristic.removeEventListener(
        "characteristicvaluechanged",
        handleDistanceEncoderSensorNotifications
      );
      await weightSensorCharacteristic.stopNotifications();
      await distanceEncoderSensorCharacteristic.stopNotifications();

      // resetAllValue();

      setWeightSensorValue(0);
      setDistanceEncoderSensorValue((0).toFixed(1));

      // await bluetoothDevice.gatt.disconnect();

      weightSensorCharacteristic = null;
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      setIsBluetoothConnected(false);
    } catch {
      setWeightSensorValue(0);
      setDistanceEncoderSensorValue((0).toFixed(1));

      // await bluetoothDevice.gatt.disconnect();

      weightSensorCharacteristic = null;
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      setIsBluetoothConnected(false);
    }
  }
  async function handleWeightSensorNotifications(event) {
    try {
      let value = event.target.value;
      let result = 0;
      // Convert raw data bytes to hex values just for the sake of showing something.
      // In the "real" world, you'd use data.getUint8, data.getUint16 or even
      // TextDecoder to process raw data bytes.
      for (let i = 0; i < value.byteLength; i++) {
        result += value.getUint8(i) << (8 * i);
      }

      setWeightSensorValue(result);
    } catch {}
  }

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
      setDistanceEncoderSensorValue(
        (((4.4 * Math.PI) / 4185) * result).toFixed(1)
      );
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
      await sendCommand(stopCommand);
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

    setWeightSensorValue(0);
    setDistanceEncoderSensorValue((0).toFixed(1));

    await sendCommand(0x56);

    setIsUpButtonPressed(false);
    setIsDownButtonPressed(false);
    setIsLeftButtonPressed(false);
    setIsRightButtonPressed(false);
    setIsStopButtonPressed(false);
  }

  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });

  return (
    <div className="vw-100 vh-100" style={{ backgroundColor: "#F7F6E7" }}>
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
        <Row className="vw-100 vh-100 p-1 mx-0 ">
          <Row className="mx-0 ">
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={3}>
              <Row
                className="lastmilelogo mx-0"
                style={{ height: "20%", backgroundColor: "#FFFFFF" }}
              ></Row>
              <Row
                className="p4 text-align-center p-1 mx-0"
                style={{ height: "20%", backgroundColor: "#FFFFFF" }}
              >
                Singleplayer Mode
                <hr />
                Press connect bluetooth to your robot then enjoy it.
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
                style={{ height: "45%", backgroundColor: "#FFF8F0" }}
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
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={3}>
              <Row
                className="p text-align-center text-white p-1 mx-0"
                style={{ height: "15%", backgroundColor: "#000000" }}
              >
                <FaWeight />
                Weight (g.)
              </Row>
              <Row
                className="p6 text-align-center p-1 mx-0 border border-dark"
                style={{ height: "35%", backgroundColor: "#FFF8F0" }}
              >
                {weightSensorValue}
                {/* 12345678.9 */}
              </Row>
              <Row
                className="p text-align-center text-white p-1 mx-0"
                style={{ height: "15%", backgroundColor: "#000000" }}
              >
                <SiProbot />
                Robot Name
              </Row>
              <Row
                className="p3 text-align-center p-1 mx-0 border border-dark"
                style={{ height: "35%", backgroundColor: "#FFF8F0" }}
              >
                {bluetoothDeviceName}
              </Row>
            </Col>
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={3}>
              <Row
                className="p text-align-center text-white p-1 mx-0"
                style={{ height: "15%", backgroundColor: "#000000" }}
              >
                <RiPinDistanceFill />
                Distance (cm.)
              </Row>
              <Row
                className="p6 text-align-center p-1 mx-0 border border-dark"
                style={{ height: "35%", backgroundColor: "#FFF8F0" }}
              >
                {distanceEncoderSensorValue}
                {/* 12345678.9 */}
              </Row>
              <Row
                className="p text-align-center text-white p-1 mx-0"
                style={{ height: "15%", backgroundColor: "#000000" }}
              >
                -
              </Row>
              <Row
                className="p2 text-align-center p-1 mx-0 border border-dark"
                style={{ height: "35%", backgroundColor: "#FFF8F0" }}
              >
                -
              </Row>
            </Col>
            <Col style={{ backgroundColor: "#FFFFFF" }} xs={3}>
              <Row
                className="p text-align-center text-white p-1 mx-0"
                style={{ height: "15%", backgroundColor: "#000000" }}
              >
                <FaLink />
                Connectivity
              </Row>
              <Row
                className="p2 text-align-center p-1 mx-0 border border-dark"
                style={{ height: "35%", backgroundColor: "#FFF8F0" }}
              >
                <Row
                  className="p2 text-align-center p-1 mx-0"
                  style={{ height: "50%", backgroundColor: "#FFF8F0" }}
                >
                  <Button
                    variant="primary"
                    size="sm"
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
                    <Row className="p text-align-center">
                      <MdBluetooth />
                      Connect
                    </Row>
                  </Button>
                </Row>
                <Row
                  className="p2 text-align-center p-1 mx-0"
                  style={{ height: "50%", backgroundColor: "#FFF8F0" }}
                >
                  <Button
                    variant="danger"
                    size="sm"
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
                    <Row className="p text-align-center">
                      <MdOutlineBluetoothDisabled />
                      Disconnect
                    </Row>
                  </Button>
                </Row>
              </Row>
              <Row
                className="p text-align-center text-white p-1 mx-0"
                style={{ height: "15%", backgroundColor: "#000000" }}
              >
                <AiOutlineMenu />
                Menu
              </Row>
              <Row
                className="p text-align-center p-1 mx-0 border border-dark"
                style={{ height: "35%", backgroundColor: "#FFF8F0" }}
              >
                <Row
                  className="p2 text-align-center p-1 mx-0"
                  style={{ height: "50%", backgroundColor: "#FFF8F0" }}
                >
                  <Button
                    variant="danger"
                    size="sm"
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
                    <Row className="p text-align-center">
                      <BiReset />
                      Reset Distance
                    </Row>
                  </Button>
                </Row>

                <Row
                  className="p2 text-align-center p-1 mx-0"
                  style={{ height: "50%", backgroundColor: "#FFF8F0" }}
                >
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={async () => {
                      await sendCommand(restartCommand);
                      await onExituttonEvent();
                    }}
                    disabled={
                      isDownButtonPressed ||
                      isRightButtonPressed ||
                      isLeftButtonPressed ||
                      isUpButtonPressed ||
                      isStopButtonPressed ||
                      isDirectionButtonReleased
                    }
                  >
                    <Row className="p text-align-center">
                      <GiExitDoor />
                      Exit Game
                    </Row>
                  </Button>
                </Row>
              </Row>
            </Col>
          </Row>
        </Row>
      )}
    </div>
  );
}