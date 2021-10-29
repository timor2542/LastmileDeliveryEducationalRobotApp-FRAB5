import React, { Component } from "react";
import { Grid } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";

/* Bluetooth Function Zone */

const MY_ESP32_SERVICE_UUID = "818796aa-2f20-11ec-8d3d-0242ac130003"; //- must match optional services on navigator.bluetooth.requestDevice
const WEIGHT_SENSOR_CHARACTERISTIC_UUID =
  "818798d0-2f20-11ec-8d3d-0242ac130003";
const ENCODER_L_SENSOR_CHARACTERISTIC_UUID =
  "818799c0-2f20-11ec-8d3d-0242ac130003";
// const ENCODER_R_SENSOR_CHARACTERISTIC_UUID =
//   "81879a7e-2f20-11ec-8d3d-0242ac130003";
const MOTOR_ACTUATOR_CHARACTERISTIC_UUID =
  "81879be6-2f20-11ec-8d3d-0242ac130003";

// Variables
var bluetoothDevice = null;

var weightSensorCharacteristic = null;
var encoderSensorCharacteristic = null;
var motorActuatorCharacteristic = null;
var weight_used = 0;
var distance_used = 0;
var enegry_used = 0;

async function handleWeightSensorNotifications(event) {
  let value = event.target.value;
  let result = 0;
  // Convert raw data bytes to hex values just for the sake of showing something.
  // In the "real" world, you'd use data.getUint8, data.getUint16 or even
  // TextDecoder to process raw data bytes.
  for (let i = 0; i < value.byteLength; i++) {
    result += value.getUint8(i) << (8 * i);
  }
  weight_used = result;
  document.getElementById("weight_read_child").innerHTML =
    weight_used.toString();
}

async function handleEncoderSensorNotifications(event) {
  let value = event.target.value;
  let result = 0;
  // Convert raw data bytes to hex values just for the sake of showing something.
  // In the "real" world, you'd use data.getUint8, data.getUint16 or even
  // TextDecoder to process raw data bytes.
  for (let i = 0; i < value.byteLength; i++) {
    result += value.getUint8(i) << (8 * i);
  }
  distance_used = result;
  document.getElementById("distance_read_child").innerHTML =
    distance_used.toString();
  enegry_used = weight_used * distance_used;
  document.getElementById("enegry_read_child").innerHTML =
    enegry_used.toString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stop_moving(ID) {
  sendMotorActuatorCommand(0x54);
  if (ID === "stopButton") {
    document.getElementById(ID).focus();
  } else {
    document.getElementById(ID).blur();
  }
}

function sendMotorActuatorCommand(data) {
  if (!bluetoothDevice) {
    return;
  }

  if (!motorActuatorCharacteristic) {
    return;
  }

  if (
    /webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    return motorActuatorCharacteristic
      .writeValue(Uint8Array.of(data))
      .catch(() => {
        console.log("DOMException: GATT operation already in progress.");
        return Promise.resolve()
          .then(() => sleep(500))
          .then(() => {
            motorActuatorCharacteristic.writeValue(Uint8Array.of(data));
          });
      });
  } else {
    return motorActuatorCharacteristic
      .writeValueWithoutResponse(Uint8Array.of(data))
      .catch(() => {
        console.log("DOMException: GATT operation already in progress.");
        return Promise.resolve()
          .then(() => sleep(500))
          .then(() => {
            motorActuatorCharacteristic.writeValueWithoutResponse(
              Uint8Array.of(data)
            );
          });
      });
  }
}
async function connectToBluetoothDevice() {
  if (!navigator.bluetooth) {
    alert(
      "คำเตือน: เว็บบลูทูธถูกปิดใช้งานอยู่! โปรดเปิดใช้งานที่ chrome://flags Caution: Web Bluetooth is disabled! Please go to chrome://flags and enable it."
    );
    return;
  }
  bluetoothDevice = null;
  try {
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "ESP32" }],
      optionalServices: [
        MY_ESP32_SERVICE_UUID,
        WEIGHT_SENSOR_CHARACTERISTIC_UUID,
        ENCODER_L_SENSOR_CHARACTERISTIC_UUID,
        MOTOR_ACTUATOR_CHARACTERISTIC_UUID,
      ],
    });

    // console.log("Connecting to GATT Server...");

    const server = await bluetoothDevice.gatt.connect();

    // console.log("Getting Service...");
    const service = await server.getPrimaryService(MY_ESP32_SERVICE_UUID);

    // console.log("Getting Characteristic...");
    weightSensorCharacteristic = await service.getCharacteristic(
      WEIGHT_SENSOR_CHARACTERISTIC_UUID
    );
    encoderSensorCharacteristic = await service.getCharacteristic(
      ENCODER_L_SENSOR_CHARACTERISTIC_UUID
    );
    motorActuatorCharacteristic = await service.getCharacteristic(
      MOTOR_ACTUATOR_CHARACTERISTIC_UUID
    );

    await weightSensorCharacteristic.startNotifications();
    await encoderSensorCharacteristic.startNotifications();
    // console.log("> Notifications started");
    weightSensorCharacteristic.addEventListener(
      "characteristicvaluechanged",
      handleWeightSensorNotifications
    );
    encoderSensorCharacteristic.addEventListener(
      "characteristicvaluechanged",
      handleEncoderSensorNotifications
    );

    document.getElementById("device_name_child").innerHTML =
      bluetoothDevice.name;
    document.getElementById("connected_status_text").style.display = "block";
    document.getElementById("disconnected_status_text").style.display = "none";
    document.getElementById("connectedButton").className =
      "disabled circular ui icon button";
    document.getElementById("disconnectedButton").className =
      "circular ui icon button";
  } catch {}
}

async function disconnectToBluetoothDevice() {
  if (!navigator.bluetooth) {
    alert(
      "คำเตือน: เว็บบลูทูธถูกปิดใช้งานอยู่! กรูณาเปิดใช้งานที่ chrome://flags Caution: Web Bluetooth is disabled! Please go to chrome://flags and enable it."
    );
    return;
  }

  if (!bluetoothDevice) {
    return;
  }

  try {
    weightSensorCharacteristic.removeEventListener(
      "characteristicvaluechanged",
      handleWeightSensorNotifications
    );
    encoderSensorCharacteristic.removeEventListener(
      "characteristicvaluechanged",
      handleEncoderSensorNotifications
    );
    await weightSensorCharacteristic.stopNotifications();
    await encoderSensorCharacteristic.stopNotifications();

    await bluetoothDevice.gatt.disconnect();

    weightSensorCharacteristic = null;
    encoderSensorCharacteristic = null;
    motorActuatorCharacteristic = null;
    bluetoothDevice = null;

    document.getElementById("device_name_child").innerHTML = "N/A";
    document.getElementById("weight_read_child").innerHTML = "N/A";
    document.getElementById("distance_read_child").innerHTML = "N/A";
    document.getElementById("enegry_read_child").innerHTML = "N/A";
    document.getElementById("connected_status_text").style.display = "none";
    document.getElementById("disconnected_status_text").style.display = "block";
    document.getElementById("connectedButton").className =
      "circular ui icon button";
    document.getElementById("disconnectedButton").className =
      "disabled circular ui icon button";
  } catch {}
}
/* Class Zone */
export default class Home extends Component {
  render() {
    return (
      <div className="disable-select">
        <Grid
          textAlign="center"
          columns="equal"
          // celled
          padded
          style={{ height: "80vh" }}
        >
          <Grid.Row style={{ height: "15%" }}>
            <Grid.Column stretched verticalAlign="middle">
              <Grid.Row>
                <div>
                  <i className="large linkify icon"></i>
                  <p>สถานะการเชื่อมต่อ</p>
                </div>
              </Grid.Row>
              <Grid.Row>
                <div id="disconnected_status_text" style={{ display: "block" }}>
                  <h3 className="ui red label">ไม่ได้เชื่อมต่อ</h3>
                </div>
                <div id="connected_status_text" style={{ display: "none" }}>
                  <h3 className="ui green label">เชื่อมต่อแล้ว</h3>
                </div>
              </Grid.Row>
            </Grid.Column>
            <Grid.Column stretched verticalAlign="middle">
              <Grid.Row>
                <div>
                  <i className="large microchip icon"></i>
                  <p>ชื่ออุปกรณ์</p>
                </div>
              </Grid.Row>
              <Grid.Row>
                <div id="device_name_parent">
                  <h3 id="device_name_child">N/A</h3>
                </div>
              </Grid.Row>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row style={{ height: "25%" }}>
            <Grid.Column
              stretched
              verticalAlign="middle"
              style={{ height: "100%" }}
            >
              <Grid.Row>
                <Grid.Column>
                  <i className="large weight icon"></i>
                  <p>น้ำหนัก (กรัม)</p>
                </Grid.Column>
                <Grid.Column>
                  <div id="weight_read_parent">
                    <h3 id="weight_read_child">N/A</h3>
                  </div>
                </Grid.Column>
              </Grid.Row>
            </Grid.Column>
            <Grid.Column>
              <button
                id="upButton"
                className="up-control btn-focus"
                style={{ width: "100%", height: "100%", outline: "none" }}
                onMouseDown={() => sendMotorActuatorCommand(0x50)}
                onMouseUp={() => stop_moving("upButton")}
                onMouseOut={() => stop_moving("upButton")}
                onTouchStart={() => sendMotorActuatorCommand(0x50)}
                onTouchEnd={() => stop_moving("upButton")}
                onTouchCancel={() => stop_moving("upButton")}
              ></button>
            </Grid.Column>
            <Grid.Column
              stretched
              verticalAlign="middle"
              style={{ height: "100%" }}
            >
              <Grid.Row>
                <Grid.Column>
                  <i className="large road icon"></i>
                  <p>ระยะทาง (เซนติเมตร)</p>
                </Grid.Column>
                <Grid.Column>
                  <div id="distance_read_parent">
                    <h3 id="distance_read_child">N/A</h3>
                  </div>
                </Grid.Column>
              </Grid.Row>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row style={{ height: "25%" }}>
            <Grid.Column>
              <button
                id="leftButton"
                className="left-control btn-focus"
                style={{ width: "100%", height: "100%", outline: "none" }}
                onMouseDown={() => sendMotorActuatorCommand(0x52)}
                onMouseUp={() => stop_moving("leftButton")}
                onMouseOut={() => stop_moving("leftButton")}
                onTouchStart={() => sendMotorActuatorCommand(0x52)}
                onTouchEnd={() => stop_moving("leftButton")}
                onTouchCancel={() => stop_moving("leftButton")}
              ></button>
            </Grid.Column>
            <Grid.Column>
              <button
                id="stopButton"
                className="stop-control btn-focus"
                autoFocus
                style={{ width: "100%", height: "100%", outline: "none" }}
                onMouseDown={() => stop_moving("stopButton")}
                onMouseUp={() => stop_moving("stopButton")}
                onMouseOut={() => stop_moving("stopButton")}
                onTouchStart={() => stop_moving("stopButton")}
                onTouchEnd={() => stop_moving("stopButton")}
                onTouchCancel={() => stop_moving("stopButton")}
              ></button>
            </Grid.Column>
            <Grid.Column>
              <button
                id="rightButton"
                className="right-control btn-focus"
                style={{ width: "100%", height: "100%", outline: "none" }}
                onMouseDown={() => sendMotorActuatorCommand(0x53)}
                onMouseUp={() => stop_moving("rightButton")}
                onMouseOut={() => stop_moving("rightButton")}
                onTouchStart={() => sendMotorActuatorCommand(0x53)}
                onTouchEnd={() => stop_moving("rightButton")}
                onTouchCancel={() => stop_moving("rightButton")}
              ></button>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row style={{ height: "25%" }}>
            <Grid.Column
              stretched
              verticalAlign="middle"
              style={{ height: "100%" }}
            >
              <Grid.Row>
                <Grid.Column>
                  <i className="large tint icon"></i>
                  <p>พลังงานที่ใช้ (ก.ซม.)</p>
                </Grid.Column>
                <Grid.Column>
                  <div id="enegry_read_parent">
                    <h3 id="enegry_read_child">N/A</h3>
                  </div>
                </Grid.Column>
              </Grid.Row>
            </Grid.Column>
            <Grid.Column>
              <button
                id="downButton"
                className="down-control btn-focus"
                style={{ width: "100%", height: "100%", outline: "none" }}
                onMouseDown={() => sendMotorActuatorCommand(0x51)}
                onMouseUp={() => stop_moving("downButton")}
                onMouseOut={() => stop_moving("downButton")}
                onTouchStart={() => sendMotorActuatorCommand(0x51)}
                onTouchEnd={() => stop_moving("downButton")}
                onTouchCancel={() => stop_moving("downButton")}
              ></button>
            </Grid.Column>
            <Grid.Column
              stretched
              verticalAlign="middle"
              style={{ height: "100%" }}
            >
              <Grid.Row>
                <Grid.Column>
                  <i className="large clock icon"></i>
                  <p>เวลา (นาที:วินาที)</p>
                </Grid.Column>
                <Grid.Column>
                  <div id="time_read_parent">
                    <h3 id="time_read_child">N/A</h3>
                  </div>
                </Grid.Column>
              </Grid.Row>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row style={{ height: "10%" }}>
            <Grid.Column verticalAlign="middle">
              <button
                id="connectedButton"
                className="circular ui icon button"
                style={{ width: "100%", height: "100%", outline: "none" }}
                onClick={() => connectToBluetoothDevice()}
                onTouchStart={() => connectToBluetoothDevice()}
              >
                <i
                  className="fitted black icon bluetooth btn-focus"
                  style={{ scale: "200%" }}
                ></i>
              </button>
            </Grid.Column>
            <Grid.Column verticalAlign="middle">
              <button
                id="disconnectedButton"
                className="disabled circular ui icon button"
                style={{ width: "100%", height: "100%" }}
                onClick={() => disconnectToBluetoothDevice()}
                onTouchStart={() => disconnectToBluetoothDevice()}
              >
                <i className="icons">
                  <i
                    className="fitted black bluetooth icon"
                    style={{ scale: "150%" }}
                  />
                  <i className="fitted big red dont icon" />
                </i>
              </button>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}
