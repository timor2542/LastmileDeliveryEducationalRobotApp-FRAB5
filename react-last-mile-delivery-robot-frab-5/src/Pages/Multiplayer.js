/*
 * Multiplayer.js
 *
 *
 *  Created on: Oct 8, 2021
 *  Modified on: Mar 8, 2022
 *
 *      Author: SakuranohanaTH
 *
 */

/* REACT LIBRARY TOPICS RELATED CODE BEGIN */

import React, { useState, useEffect, useRef, useCallback } from "react"; // include React Library
import { useHistory } from "react-router-dom"; // include React Router DOM Library
import { Button, Col, Row, Form } from "react-bootstrap";
import { useMediaQuery } from "react-responsive";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
/* INCLUDE FORWARD REFERENCE TO ADD ICON ON MATERIAL TABLE CODE BEGIN */

// import { BiReset } from "react-icons/bi";
/* INCLUDE FORWARD REFERENCE TO ADD ICON ON MATERIAL TABLE CODE END */

import { AiOutlineMenu } from "react-icons/ai"; // include React Icons Library
// import { RiArrowGoBackFill } from "react-icons/ri";
// import { BsArrowsFullscreen, BsFullscreenExit } from "react-icons/bs";
import { FaHome, FaUsers } from "react-icons/fa"; // include React Icons Library
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
import { SiProbot } from "react-icons/si"; // include React Icons Library
import { MdPin, MdOutlineTimer } from "react-icons/md"; // include React Icons Library
import { db } from "../Firebase/Firebase"; // include Firebase Library
import get from "../universalHTTPRequests/get"; // include Firebase fetching Library
import { SiStatuspal } from "react-icons/si";

import DataGrid, {
  Column,
  // Export,
  Editing,
  Grouping,
  GroupPanel,
  // Paging,
  SearchPanel,
  Toolbar,
  Item,
  Sorting,
  Scrolling,
} from "devextreme-react/data-grid";
// import { employees } from "./datatest.js";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver";
import { Button as ButtonD } from "devextreme-react/button";
import { exportDataGrid as exportDataGridPDF } from "devextreme/pdf_exporter";
import { exportDataGrid as exportDataGridExcel } from "devextreme/excel_exporter";
let bluetoothDevice = null; // Bluetooth Device Name Variable
// let weightSensorCharacteristic = null; // Weight Sensor Characteristic Variable
let distanceEncoderSensorCharacteristic = null; // Distance Encoder Sensor Characteristic Variable
let commandCharacteristic = null; // Command Characteristic Variable

let startTime = 0; // Last Elaspsed Time Update Varaible
let elapsedTime = 0; // Current Elaspsed Time Update Varaible
let intervalId = null; // Interval to increase Time Variable

let _hoursTimeFinishedRecord = "0";
let _minutesTimeFinishedRecord = "00";
let _secondsTimeFinishedRecord = "00";

/* EXPORT DEFAULT FUNCTION MULTIPLAYER CODE BEGIN */
export default function Multiplayer() {
  const handle = useFullScreenHandle();

  // eslint-disable-next-line
  const [version, setVersion] = useState("1.4.0");
  /* CALL HISTORY CODE BEGIN */
  const history = useHistory();
  const dataGridRef = useRef();

  // eslint-disable-next-line
  const exportGridPDF = useCallback(() => {
    const doc = new jsPDF();
    const dataGrid = dataGridRef.current.instance;

    exportDataGridPDF({
      jsPDFDocument: doc,
      component: dataGrid,
    }).then(() => {
      doc.save(String(roomHostName) + " 's Result.pdf");
    });
  });
  const exportGridExcel = (e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Main sheet");
    const dataGrid = dataGridRef.current.instance;

    exportDataGridExcel({
      component: dataGrid,
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          String(roomHostName) + " 's Result.xlsx"
        );
      });
    });
    e.cancel = true;
  };
  // }
  /* CALL HISTORY CODE END */

  /* TABLE ICON ON LEADERBOARD CODE END */

  /* BACK BUTTON EVENT ON BROWNSER CODE BEGIN */
  async function onBackButtonEvent(event) {
    event.preventDefault();
    // your logic
    // window.alert("You go back")
    if (getInClassRoom) {
      if (isHost) {
        await db.ref("gameSessions/" + getPIN).remove();
      } else {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
          .remove();
      }
    }
    await disconnectToBluetoothDeviceImmediately();
    setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
    history.push("/");
  }
  /* BACK BUTTON EVENT ON BROWNSER CODE END */

  /* EXIT BUTTON EVENT ON MULTIPLAYER UI CODE BEGIN */
  async function onExitButtonEvent() {
    // event.preventDefault();
    // your logic
    await disconnectToBluetoothDeviceImmediately();
    setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
    if (getInClassRoom) {
      if (isHost) {
        await db.ref("gameSessions/" + getPIN).remove();
      } else {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
          .remove();
      }
    }
    history.push("/");
  }
  /* EXIT BUTTON EVENT ON MULTIPLAYER UI CODE END */
  /* ALERT MESSEGE BEFORE UNLOAD PAGE CODE BEGIN */
  const onBeforeUnload = async (event) => {
    // the method that will be used for both add and remove event
    event.preventDefault();
    let confirmationMessage = "";
    /* Do you small action code here */
    (event || window.event).returnValue = confirmationMessage; //Gecko + IE
    await disconnectToBluetoothDeviceImmediately();
    return confirmationMessage;
  };
  /* ALERT MESSEGE BEFORE UNLOAD PAGE CODE END */
  /* DISCONNNECT BLUETOOTH DEVICE AFTER UNLOAD PAGE CODE BEGIN */
  const afterUnload = async () => {
    // event.preventDefault();
    await disconnectToBluetoothDeviceImmediately();
    setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
    if (getInClassRoom) {
      if (isHost) {
        await db.ref("gameSessions/" + getPIN).remove();
      } else {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
          .remove();
      }
    }
  };

  /* DISCONNNECT BLUETOOTH DEVICE AFTER UNLOAD PAGE COED END */
  /* DYNAMIC OF COMPONENT CODE BEGIN */
  useEffect(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("unload", afterUnload);
    window.addEventListener("popstate", onBackButtonEvent);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("unload", afterUnload);
      window.removeEventListener("popstate", onBackButtonEvent);
    };
  });
  /* DYNAMIC OF COMPONENT CODE END */
  // MULTIPLAYER_MODE_
  // MULTIPLAYER_MODE_HOMEPAGE
  // MULTIPLAYER_MODE_PLAYER_FILLGROUPNAME_PAGE
  // MULTIPLAYER_MODE_HOST_FILLROOMNAME_PAGE
  // MULTIPLAYER_MODE_PLAYER_CONTROLPANEL_PAGE
  // MULTIPLAYER_MODE_HOST_CONTROLPANEL_PAGE
  // MULTIPLAYER_MODE_LOADINGPAGE
  // MULTIPLAYER_MODE_ERRORHOSTLOSTPAGE
  // MULTIPLAYER_MODE_ERRORGAMEALREADYSTARTEDPAGE
  // MULTIPLAYER_MODE_ERRORGOTDISCONNECTEDPAGE
  // MULTIPLAYER_MODE_ERRORNEEDPINPAGE
  // MULTIPLAYER_MODE_ERRORNEEDGROUPNAMEPLAYERPAGE
  // MULTIPLAYER_MODE_ERRORNEEDROOMNAMEHOSTPAGE
  // MULTIPLAYER_MODE_ERRORPLAYERNAMETAKEN_PAGE
  // MULTIPLAYER_MODE_ERRORHOSTNOTFOUNDPAGE
  // MULTIPLAYER_MODE_ERROROTHERPAGE

  /* FINITE STATE MACHINE DEFAULT DEFINED PAGE CODE BEGIN */
  const [FSMPage, setFSMPage] = useState("MULTIPLAYER_MODE_HOMEPAGE");
  /* FINITE STATE MACHINE DEFAULT DEFINED PAGE CODE END */

  /* DELAY/SLEEP FUNCTION TOPICS RELATED CODE BEGIN */

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* DELAY/SLEEP FUNCTION TOPICS RELATED CODE END */

  /* BLUETOOTH TOPICS RELATED CODE BEGIN */
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

  const [isUserFinished, setIsUserFinished] = useState(false);
  const [isUserAlreadyFinished, setIsUserAlreadyFinished] = useState(false);

  const [isCloseResetTimerButton, setIsCloseResetTimerButton] = useState(true);

  async function onDisconnected(event) {
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
      // ////console.log("Connecting to GATT Server...");

      const server = await bluetoothDevice.gatt.connect();

      // ////console.log("Getting Service...");
      const service = await server.getPrimaryService(myESP32ServiceUUID);

      // ////console.log("Getting Characteristic...");
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
      // ////console.log("> Notifications started");
      // weightSensorCharacteristic.addEventListener(
      //   "characteristicvaluechanged",
      //   handleWeightSensorNotifications
      // );
      distanceEncoderSensorCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleDistanceEncoderSensorNotifications
      );
      setBluetoothDeviceName(bluetoothDevice.name);

      // console.log(bluetoothDevice.name);
      if (getInClassRoom && groupPlayerName.trim() !== "") {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
          .update({
            deviceName: bluetoothDevice.name,
            parcelCorrectCount: 0,
          });
      }
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
      if (getInClassRoom && groupPlayerName.trim() !== "") {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
          .update({
            deviceName: "Not connected",
            distanceSensorValue: parseFloat((0).toFixed(3)),
            parcelCorrectCount: 0,
          });
      }
      setIsBluetoothConnected(false);
    }
  }
  async function disconnectToBluetoothDevice() {
    if (!navigator.bluetooth) {
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
      // sendCommand(0x56);
      // resetAllValue();

      setDistanceEncoderSensorValue((0).toFixed(3));

      await bluetoothDevice.gatt.disconnect();

      // weightSensorCharacteristic = null;
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      if (!gotAlreadyHostLeftDetected) {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
          .update({
            deviceName: "Not connected",
            distanceSensorValue: parseFloat((0).toFixed(3)),
            parcelCorrectCount: 0,
          });
      }
      setIsBluetoothConnected(false);
    } catch {
      setDistanceEncoderSensorValue((0).toFixed(3));

      // await bluetoothDevice.gatt.disconnect();

      // weightSensorCharacteristic = null;
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      if (!gotAlreadyHostLeftDetected) {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
          .update({
            deviceName: "Not connected",
            distanceSensorValue: parseFloat((0).toFixed(3)),
            parcelCorrectCount: 0,
          });
      }
      setIsBluetoothConnected(false);
    }
  }

  async function disconnectToBluetoothDeviceImmediately() {
    if (!navigator.bluetooth) {
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
      // sendCommand(0x56);
      // resetAllValue();

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

      // weightSensorCharacteristic = null;
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      setIsBluetoothConnected(false);
    }
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
      setDistanceEncoderSensorValue((result / 1000).toFixed(3));
      if (getInClassRoom && groupPlayerName.trim() !== "") {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
          .update({
            distanceSensorValue: parseFloat((result / 1000).toFixed(3)),
          });
      }
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

    setDistanceEncoderSensorValue((0).toFixed(3));

    await sendCommand(0x56);

    setIsUpButtonPressed(false);
    setIsDownButtonPressed(false);
    setIsLeftButtonPressed(false);
    setIsRightButtonPressed(false);
    setIsStopButtonPressed(false);
  }

  /* BLUETOOTH LOW ENEGRY RELATED VARIABLES CODE END */

  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" }); // Check responsive.

  /* SESSION PLAYER LOGIN CODE BEGIN */

  const [PIN, setPIN] = useState("");
  const [getPIN, setGetPIN] = useState("");

  // eslint-disable-next-line
  const [getSession, setGetSession] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const [getInClassRoom, setGetInClassRoom] = useState(false);
  const [groupPlayerName, setGroupPlayerName] = useState("");
  const [roomHostName, setRoomHostName] = useState("");

  const [isHost, setIsHost] = useState(false);

  const [playersData, setPlayersData] = useState([]);

  async function JoinSession() {
    setIsHost(false);
    setGetInClassRoom(false);
    setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
    async function onSuccess(response) {
      let data = response.val();
      if (data) {
        if (data.gameAlreadyStarted) {
          setFSMPage("MULTIPLAYER_MODE_ERRORGAMEALREADYSTARTEDPAGE");
        } else {
          setGetPIN(PIN);
          setFSMPage("MULTIPLAYER_MODE_PLAYER_FILLGROUPNAME_PAGE");
        }
        setGetInClassRoom(true);
      } else {
        setGetInClassRoom(false);
        setFSMPage("MULTIPLAYER_MODE_ERRORHOSTNOTFOUNDPAGE");
      }
    }

    if (PIN && PIN.trim()) {
      setGetInClassRoom(false);
      setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
      get(setGetSession, "gameSessions/" + PIN, null, onSuccess, true);
    } else {
      setGetInClassRoom(false);
      setFSMPage("MULTIPLAYER_MODE_ERRORNEEDPINPAGE");
    }
  }
  async function checkGroupPlayerName() {
    let nextStepGet = false;
    async function onSuccessHost(response) {
      let data = response.val();
      if (data.gameAlreadyStarted) {
        setFSMPage("MULTIPLAYER_MODE_ERRORGAMEALREADYSTARTEDPAGE");
      } else {
        nextStepGet = true;
      }
    }
    async function onSuccessPlayer(response) {
      let data = response.val();
      if (data) {
        setFSMPage("MULTIPLAYER_MODE_ERRORPLAYERNAMETAKEN_PAGE");
      } else {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
          .set({
            groupName: groupPlayerName,
            deviceName: "Not connected",
            parcelCorrectCount: 0,
            distanceSensorValue: parseFloat((0).toFixed(3)),
            timeFinishedRecord: "0 : 00 : 00",
          });
        // resetStopwatch();
        setFSMPage("MULTIPLAYER_MODE_PLAYER_CONTROLPANEL_PAGE");

        setGetInClassRoom(true);
      }
    }
    if (groupPlayerName && groupPlayerName.trim()) {
      setGetInClassRoom(false);
      setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
      get(setGetSession, "gameSessions/" + getPIN, null, onSuccessHost, true);
      if (nextStepGet) {
        get(
          setGetSession,
          "gameSessions/" + getPIN + "/players/" + groupPlayerName,
          null,
          onSuccessPlayer,
          true
        );
      }
    } else {
      setGetInClassRoom(false);
      setFSMPage("MULTIPLAYER_MODE_ERRORNEEDGROUPNAMEPLAYERPAGE");
    }
  }
  async function CreateSession() {
    setIsHost(true);
    setFSMPage("MULTIPLAYER_MODE_HOST_FILLROOMNAME_PAGE");
  }
  async function checkRoomHostName() {
    let generatedPin =
      Math.floor(Math.random() * (9999999 - 100000 + 1)) + 100000;
    setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
    async function onSuccess(response) {
      let data = response.val();
      // showPopupLoading();
      if (data) {
        checkRoomHostName();
      } else {
        // resetStopwatch();
        await db.ref("gameSessions/" + generatedPin.toString()).set({
          gameAlreadyStarted: false,
          gameStarted: false,
          timeIsActived: false,
          timeIsPaused: false,
          roomName: roomHostName,
          hostOnline: true,
        });
        setGetPIN(generatedPin.toString());
        setFSMPage("MULTIPLAYER_MODE_HOST_CONTROLPANEL_PAGE");
        setGetInClassRoom(true);
      }
    }
    if (roomHostName && roomHostName.trim()) {
      setGetInClassRoom(false);
      setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
      get(
        setGetSession,
        "gameSessions/" + generatedPin.toString(),
        null,
        onSuccess,
        true
      );
    } else {
      setGetInClassRoom(false);
      setFSMPage("MULTIPLAYER_MODE_ERRORNEEDROOMNAMEHOSTPAGE");
    }
  }

  // eslint-disable-next-line
  const [gameData, setGameData] = useState({
    data: null,
    loading: true,
    error: null,
  });

  const [gameStarted, setGameStarted] = useState(false);

  const [gotStart, setGotStart] = useState(false);
  const [gotStop, setGotStop] = useState(false);
  const [gotReset, setGotReset] = useState(false);

  const [gotHostLeftDetected, setGotHostLeftDetected] = useState(false);

  const [gotAlreadyStart, setGotAlreadyStart] = useState(false);
  const [gotAlreadyStop, setGotAlreadyStop] = useState(false);
  const [gotAlreadyReset, setGotAlreadyReset] = useState(false);

  const [gotAlreadyHostLeftDetected, setGotAlreadyHostLeftDetected] =
    useState(false);
  /* SESSION PLAYER LOGIN CODE END */
  /* STOPWATCH TIMER CONTROL CODE BEGIN */
  const [timeIsActive, setTimeIsActive] = useState(false);
  const [timeIsPaused, setTimeIsPaused] = useState(false);
  const [stopwatchElapsedTime, setStopwatchElapsedTime] = useState({
    millisecondsElapsedTime: 0,
    secondsElapsedTime: 0,
    minutesElapsedTime: 0,
    hoursElapsedTime: 0,
  });
  async function resetStopwatch() {
    setTimeIsActive(false);
    setTimeIsPaused(false);
    elapsedTime = 0;
    startTime = Date.now();
    clearInterval(intervalId);
    setStopwatchElapsedTime({
      millisecondsElapsedTime: 0,
      secondsElapsedTime: 0,
      minutesElapsedTime: 0,
      hoursElapsedTime: 0,
    });
  }

  //method to start the stopwatch
  async function startStopwatch() {
    setTimeIsActive(true);
    setTimeIsPaused(true);
    startTime = Date.now();
    //run setInterval() and save id
    intervalId = setInterval(async function () {
      //calculate elapsed time
      const time = Date.now() - startTime + elapsedTime;

      //calculate different time measurements based on elapsed time
      const milliseconds = parseInt((time % 1000) / 10);
      const seconds = parseInt((time / 1000) % 60);
      const minutes = parseInt((time / (1000 * 60)) % 60);
      const hours = parseInt((time / (1000 * 60 * 60)) % 24);

      setStopwatchElapsedTime({
        millisecondsElapsedTime: milliseconds,
        secondsElapsedTime: seconds,
        minutesElapsedTime: minutes,
        hoursElapsedTime: hours,
      });

      // _hoursTimeFinishedRecord = String(hours);
      // if (minutes < 10) {
      //   _minutesTimeFinishedRecord = "0" + String(minutes);
      // } else {
      //   _minutesTimeFinishedRecord = String(minutes);
      // }
      // if (seconds < 10) {
      //   _secondsTimeFinishedRecord = "0" + String(seconds);
      // } else {
      //   _secondsTimeFinishedRecord = String(seconds);
      // }
      // if (getInClassRoom && groupPlayerName.trim() !== "" && !isUserFinished) {
      //   await db
      //     .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
      //     .update({
      //       timeFinishedRecord:
      //         _hoursTimeFinishedRecord +
      //         " : " +
      //         _minutesTimeFinishedRecord +
      //         " : " +
      //         _secondsTimeFinishedRecord,
      //     });
      // }
    }, 1);
  }
  async function stopStopwatch() {
    setTimeIsPaused(false);
    elapsedTime += Date.now() - startTime;
    clearInterval(intervalId);
    _hoursTimeFinishedRecord = String(stopwatchElapsedTime.hoursElapsedTime);
    if (stopwatchElapsedTime.minutesElapsedTime < 10) {
      _minutesTimeFinishedRecord =
        "0" + String(stopwatchElapsedTime.minutesElapsedTime);
    } else {
      _minutesTimeFinishedRecord = String(
        stopwatchElapsedTime.minutesElapsedTime
      );
    }
    if (stopwatchElapsedTime.secondsElapsedTime < 10) {
      _secondsTimeFinishedRecord =
        "0" + String(stopwatchElapsedTime.secondsElapsedTime);
    } else {
      _secondsTimeFinishedRecord = String(
        stopwatchElapsedTime.secondsElapsedTime
      );
    }
    if (getInClassRoom && groupPlayerName.trim() !== "") {
      await db
        .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
        .update({
          timeFinishedRecord:
            _hoursTimeFinishedRecord +
            " : " +
            _minutesTimeFinishedRecord +
            " : " +
            _secondsTimeFinishedRecord,
        });
    }
  }

  /* STOPWATCH TIMER CONTROL CODE END */
  /* FETCHING DATA ON FIREBASE CONTROL CODE BEGIN */
  let fetchData = () => {
    async function onSuccess(response) {
      let data = response.val();
      // console.log(data);
      if (data) {
        // console.log(data);
        if (!isHost) {
          if (
            !data.gameStarted &&
            !data.timeIsActived &&
            !data.timeIsPaused &&
            data.hostOnline
          ) {
            setGotStart(false);
            setGotStop(false);
            setGotReset(true);

            setGotAlreadyStart(false);
            setGotAlreadyStop(false);

            setGameStarted(false);
            // console.log("1");
            // setIsDirectionButtonReleased(false);
          } else if (
            data.gameStarted &&
            data.timeIsActived &&
            !data.timeIsPaused &&
            data.hostOnline
          ) {
            setGotStart(true);
            setGotStop(false);
            setGotReset(false);

            setGotAlreadyStop(false);
            setGotAlreadyReset(false);

            setGameStarted(true);
            // console.log("2");
            // setIsDirectionButtonReleased(false);
          } else if (
            data.gameStarted &&
            !data.timeIsActived &&
            data.timeIsPaused &&
            data.hostOnline
          ) {
            setGotStart(false);
            setGotStop(true);
            setGotReset(false);

            setGotAlreadyStart(false);
            setGotAlreadyReset(false);

            setGameStarted(false);
            // console.log("3");
            // setIsDirectionButtonReleased(false);
          } else {
            // setGetInClassRoom(false);
            // resetStopwatch();
            setIsDirectionButtonReleased(false);

            setGotStart(false);
            setGotStop(false);
            setGotReset(false);

            setGotAlreadyStart(true);
            setGotAlreadyStop(true);
            setGotAlreadyReset(true);

            setGameStarted(false);

            setGotHostLeftDetected(true);

            // disconnectToBluetoothDevice();
            // await disconnectToBluetoothDevice();
            setFSMPage("MULTIPLAYER_MODE_ERRORHOSTLOSTPAGE");
          }

          // console.log("You are player.");
        } else {
          // console.log(data.players);
          if (data.players && data.hostOnline) {
            let leaderboardArray = Object.entries(data.players).map(
              (data) => data[1]
            );
            leaderboardArray = leaderboardArray.map((data) => {
              return {
                ...data,
              };
            });
            setPlayersData(leaderboardArray);
          } else if (!data.players && data.hostOnline) {
            setPlayersData([]);
          } else {
            setPlayersData([]);
            setIsDirectionButtonReleased(false);

            setGotStart(false);
            setGotStop(false);
            setGotReset(false);

            setGotAlreadyStart(true);
            setGotAlreadyStop(true);
            setGotAlreadyReset(true);

            setGameStarted(false);

            setGotHostLeftDetected(true);

            // disconnectToBluetoothDevice();
            // await disconnectToBluetoothDevice();
            setFSMPage("MULTIPLAYER_MODE_ERRORHOSTLOSTPAGE");
          }
          // console.log("You are host.");
        }
      } else {
        // setGetInClassRoom(false);
        // resetStopwatch();
        setIsDirectionButtonReleased(false);

        setGotStart(false);
        setGotStop(false);
        setGotReset(false);

        setGotAlreadyStart(true);
        setGotAlreadyStop(true);
        setGotAlreadyReset(true);

        setGameStarted(false);

        setGotHostLeftDetected(true);

        // disconnectToBluetoothDevice();
        // await disconnectToBluetoothDevice();
        setFSMPage("MULTIPLAYER_MODE_ERRORHOSTLOSTPAGE");
      }
    }

    if (getInClassRoom) {
      get(setGameData, "gameSessions/" + getPIN, null, onSuccess);
    }
  };
  // eslint-disable-next-line
  useEffect(fetchData, [getInClassRoom, getPIN]);
  // ////console.log(gameData);

  /* PORTRAIT RELATED CODE BEGIN */
  // if (getInClassRoom && !isHost) {
  if (gotStart && !isUserFinished) {
    if (!gotAlreadyStart) {
      setGotAlreadyStart(true);
      // console.log("Start");
      startStopwatch();
    }
    setGotStart(false);
  }
  if (gotStop && !isUserFinished) {
    if (!gotAlreadyStop) {
      setGotAlreadyStop(true);
      // console.log("Stop");
      stopStopwatch();
      sendCommand(stopCommand);
    }
    setGotStop(false);
  }
  if (gotReset) {
    if (!gotAlreadyReset) {
      setGotAlreadyReset(true);
      // console.log("Reset");
      resetStopwatch();
      resetAllValue();
      setIsUserFinished(false);
      setIsUserAlreadyFinished(false);

      if (getInClassRoom && groupPlayerName.trim() !== "") {
        db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update(
          {
            timeFinishedRecord: "0 : 00 : 00",
            parcelCorrectCount: 0,
          }
        );
      }
    }
    setGotReset(false);
  }
  if (isUserFinished) {
    if (!isUserAlreadyFinished) {
      setIsUserAlreadyFinished(true);
      stopStopwatch();
      sendCommand(stopCommand);
      // _hoursTimeFinishedRecord = String(stopwatchElapsedTime.hoursElapsedTime);
      // if (stopwatchElapsedTime.minutesElapsedTime < 10) {
      //   _minutesTimeFinishedRecord =
      //     "0" + String(stopwatchElapsedTime.minutesElapsedTime);
      // } else {
      //   _minutesTimeFinishedRecord = String(
      //     stopwatchElapsedTime.minutesElapsedTime
      //   );
      // }
      // if (stopwatchElapsedTime.secondsElapsedTime < 10) {
      //   _secondsTimeFinishedRecord =
      //     "0" + String(stopwatchElapsedTime.secondsElapsedTime);
      // } else {
      //   _secondsTimeFinishedRecord = String(
      //     stopwatchElapsedTime.secondsElapsedTime
      //   );
      // }
      // if (getInClassRoom && groupPlayerName.trim() !== "") {
      //   db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update(
      //     {
      //       timeFinishedRecord:
      //         _hoursTimeFinishedRecord +
      //         " : " +
      //         _minutesTimeFinishedRecord +
      //         " : " +
      //         _secondsTimeFinishedRecord,
      //     }
      //   );
      // }
    }
  }
  if (gotHostLeftDetected) {
    if (!gotAlreadyHostLeftDetected) {
      setGotAlreadyHostLeftDetected(true);
      // console.log("Reset");
      resetStopwatch();
      disconnectToBluetoothDeviceImmediately();
      db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).remove();
    }
    setGotHostLeftDetected(false);
  }
  /* PORTRAIT RELATED CODE END */
  /* BACK BUTTON DETECTION TO REMOVE DATA IN FIREBASE CODE BEGIN */
  useEffect(() => {
    // eslint-disable-next-line
    history.block(async () => {
      if (getInClassRoom) {
        if (isHost) {
          await db.ref("gameSessions/" + getPIN).remove();
        } else {
          await db
            .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
            .remove();
        }
      }
    });
  });
  /* BACK BUTTON DETECTION TO REMOVE DATA IN FIREBASE CODE END */

  /* FETCHING DATA ON FIREBASE CONTROL CODE END */
  // const [editRowKey, setEditRowKey] = useState(null);

  const onChangesChange = useCallback(async (changes) => {
    //  await db
    //       .ref("gameSessions/" + getPIN + "/players/" + editRowKey)
    //       .remove();
    //     }
    if (changes.length > 0) {
      // console.log(changes[0].key)
      // console.log(changes[0].data)
      if (getInClassRoom) {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + changes[0].key)
          .update({
            parcelCorrectCount: changes[0].data.parcelCorrectCount,
          });
      }
    }


  }, [getInClassRoom, getPIN]);

  // const onEditRowKeyChange = React.useCallback((editRowKey) => {
  //   console.log(editRowKey);
  // }, []);

  /* FINITE STATE MACHINE PAGE CODE BEGIN */

  if (FSMPage === "MULTIPLAYER_MODE_HOMEPAGE") {
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
                      }}
                      xs={3}
                    >
                      <Button
                        size="lg"
                        color="primary"
                        variant="outline-danger"
                        onClick={async () => {
                          await onExitButtonEvent();
                        }}
                      >
                        <Row
                          className="p-arrow-button text-align-center"
                          xs={12}
                        >
                          <GiExitDoor />
                        </Row>
                      </Button>
                    </Col>
                  </Row>
                  <Row
                    className="lastmilelogo p-3 mx-0"
                    style={{ height: "10%", backgroundColor: "#FFFFFF" }}
                    xs={12}
                  ></Row>
                  <Row
                    className="ph7 p-bold p-1 mx-0 "
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      height: "70%",
                      backgroundColor: "#E7E6E1",
                    }}
                    xs={12}
                  >
                    <Row
                      className="ph7 text-align-center p-bold"
                      style={{ height: "10%" }}
                    >
                      Player
                    </Row>
                    <Row
                      className="ph4 text-align-center"
                      style={{ height: "5%" }}
                    >
                      Join an activity with a PIN provided by the host.
                    </Row>
                    <Row
                      className="ph text-align-center"
                      style={{ height: "10%" }}
                    >
                      <Row
                        className="ph text-align-center"
                        style={{ width: "80%", height: "100%" }}
                      >
                        <Form>
                          <Form.Group>
                            <Form.Control
                              size="md"
                              placeholder="Game PIN"
                              variant="outlined"
                              value={PIN}
                              type="number"
                              onKeyPress={(event) => {
                                if (event.key === "Enter")
                                  event.preventDefault();
                                // await JoinSession();
                              }}
                              onChange={(event) => setPIN(event.target.value)}
                            />
                          </Form.Group>
                        </Form>
                      </Row>
                    </Row>
                    <Row
                      className="ph4 text-align-center"
                      style={{ width: "75%", height: "10%" }}
                    >
                      <Button
                        size="lg"
                        color="primary"
                        onClick={async () => {
                          await JoinSession();
                        }}
                      >
                        <Row className="ph3 text-align-center" xs={12}>
                          Join Session
                        </Row>
                      </Button>
                    </Row>
                    <Row
                      className="ph7 text-align-center p-bold "
                      style={{ height: "10%" }}
                    >
                      Host
                    </Row>
                    <Row
                      className="ph4 text-align-center"
                      style={{ height: "5%" }}
                    >
                      Host a live game or share a game with remote players.
                    </Row>
                    <Row
                      className="ph7 text-align-center"
                      style={{ width: "75%", height: "10%" }}
                    >
                      <Button
                        size="lg"
                        color="primary"
                        onClick={async () => {
                          CreateSession();
                        }}
                      >
                        <Row className="ph3 text-align-center" xs={12}>
                          Create Session
                        </Row>
                      </Button>
                    </Row>
                  </Row>
                  <Row
                    className="ph4 text-align-center p-1 mx-0"
                    style={{ height: "10%" }}
                    xs={12}
                  >
                    Version {version} | © {new Date().getFullYear()} FRAB5
                    Thesis.
                  </Row>
                </Col>
              </Row>
            </Row>
          ) : (
            <Row className="vw-100 vh-100 p-1 mx-0">
              <Row className="p-3 mx-0" xs={12}>
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
                      }}
                      xs={3}
                    >
                      <Button
                        size="lg"
                        color="primary"
                        variant="outline-danger"
                        onClick={async () => {
                          await onExitButtonEvent();
                        }}
                      >
                        <Row
                          className="p-arrow-button text-align-center"
                          xs={12}
                        >
                          <GiExitDoor />
                        </Row>
                      </Button>
                    </Col>
                  </Row>
                  <Row
                    className="lastmilelogo p-3 mx-0"
                    style={{ height: "20%", backgroundColor: "#FFFFFF" }}
                    xs={12}
                  ></Row>
                  <Row
                    className="p7 p-bold p-1 mx-0 "
                    style={{ height: "60%", backgroundColor: "#E7E6E1" }}
                    xs={12}
                  >
                    <Col
                      className="p7"
                      style={{ backgroundColor: "#E7E6E1" }}
                      xs={6}
                    >
                      <Row
                        className="p7 text-align-center p-bold p-1 mx-0"
                        style={{ height: "20%" }}
                      >
                        Player
                      </Row>
                      <Row
                        className="p4 text-align-center"
                        style={{ height: "10%" }}
                      >
                        Join an activity with a PIN provided by the host.
                      </Row>
                      <Row
                        className="p text-align-center"
                        style={{ height: "30%" }}
                      >
                        <Row
                          className="p text-align-center"
                          style={{ width: "80%", height: "100%" }}
                        >
                          <Form>
                            <Form.Group>
                              <Form.Control
                                size="lg"
                                placeholder="Game PIN"
                                variant="outlined"
                                value={PIN}
                                type="number"
                                onKeyPress={(event) => {
                                  if (event.key === "Enter")
                                    event.preventDefault();
                                  // await JoinSession();
                                }}
                                onChange={(event) => setPIN(event.target.value)}
                              />
                            </Form.Group>
                          </Form>
                        </Row>
                      </Row>
                      <Row
                        className="p4 text-align-center"
                        style={{ height: "20%" }}
                      >
                        <Row
                          className="p4 text-align-center"
                          style={{ width: "75%", height: "30%" }}
                        >
                          <Button
                            size="lg"
                            color="primary"
                            onClick={async () => {
                              await JoinSession();
                            }}
                          >
                            <Row className="p3 text-align-center" xs={12}>
                              Join Session
                            </Row>
                          </Button>
                        </Row>
                      </Row>
                    </Col>
                    <Col
                      className="p7"
                      style={{ backgroundColor: "#E7E6E1" }}
                      xs={6}
                    >
                      <Row
                        className="p7 text-align-center p-bold p-1 mx-0"
                        style={{ height: "20%" }}
                      >
                        Host
                      </Row>
                      <Row
                        className="p4 text-align-center"
                        style={{ height: "10%" }}
                      >
                        Host a live game or share a game with remote players.
                      </Row>
                      <Row
                        className="p7 text-align-center"
                        style={{ height: "50%" }}
                      >
                        <Button
                          size="lg"
                          color="primary"
                          style={{ width: "75%" }}
                          onClick={async () => {
                            CreateSession();
                          }}
                        >
                          <Row className="p3 text-align-center" xs={12}>
                            Create Session
                          </Row>
                        </Button>
                      </Row>
                      {/* <Row
                      className="p7 text-align-center"
                      style={{ height: "50%" }}
                    >
                      <Button
                        size="sm"
                        variant="danger"
                        style={{ width: "75%" }}
                        onClick={() => history.push("/")}
                      >
                        <Row className="p3 text-align-center" xs={12}>
                          <FaHome />
                          Go Back to Homepage
                        </Row>
                      </Button>
                    </Row> */}
                    </Col>
                  </Row>
                  <Row
                    className="p4 text-align-center p-1 mx-0"
                    style={{ height: "10%" }}
                    xs={12}
                  >
                    Version {version} | © {new Date().getFullYear()} FRAB5
                    Thesis.
                  </Row>
                </Col>
              </Row>
            </Row>
          )}
        </div>
      </FullScreen>
    );
  } else if (FSMPage === "MULTIPLAYER_MODE_PLAYER_FILLGROUPNAME_PAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
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
                      onClick={async () => {
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
                  className="p-1"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                >
                  <Col
                    className="lastmilelogo ph3 text-align-center"
                    style={{
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={12}
                  ></Col>
                </Row>
                <Row
                  className="p7 p-bold p-1 mx-0 "
                  style={{
                    justifyContent: "center",
                    // alignItems: "center",
                    textAlign: "center",
                    height: "65%",
                    backgroundColor: "#E7E6E1",
                  }}
                  xs={12}
                >
                  <Row
                    className="ph6 text-align-center p-bold p-1 mx-0"
                    style={{ height: "15%" }}
                  >
                    Player
                  </Row>
                  <Row
                    className="ph3 text-align-center"
                    style={{ height: "5%" }}
                  >
                    Enter your (group) name.
                  </Row>
                  <Row
                    className="ph text-align-center"
                    style={{ height: "10%" }}
                  >
                    <Row
                      className="ph3 text-align-center"
                      style={{ width: "80%", height: "100%" }}
                    >
                      <Form>
                        <Form.Group>
                          <Form.Control
                            size="md"
                            placeholder="Enter your (group) name."
                            variant="outlined"
                            value={groupPlayerName}
                            type="text"
                            onKeyPress={(event) => {
                              if (event.key === "Enter") event.preventDefault();
                            }}
                            onChange={(event) =>
                              setGroupPlayerName(event.target.value)
                            }
                          />
                        </Form.Group>
                      </Form>
                    </Row>
                  </Row>
                  <Row
                    className="ph4 text-align-center"
                    style={{ width: "75%", height: "10%" }}
                  >
                    <Button
                      size="lg"
                      color="primary"
                      onClick={async () => {
                        await checkGroupPlayerName();
                      }}
                    >
                      <Row className="ph3 text-align-center" xs={12}>
                        OK, go!
                      </Row>
                    </Button>
                  </Row>
                </Row>
                <Row
                  className="ph3 text-align-center p-1 mx-0"
                  style={{ height: "10%" }}
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
                    }}
                    xs={3}
                  >
                    <Button
                      size="lg"
                      color="primary"
                      variant="outline-danger"
                      onClick={async () => {
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
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "20%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="p7 p-bold p-1 mx-0 "
                  style={{ height: "60%", backgroundColor: "#E7E6E1" }}
                  xs={12}
                >
                  <Col
                    className="p7"
                    style={{ backgroundColor: "#E7E6E1" }}
                    xs={12}
                  >
                    <Row
                      className="p7 text-align-center p-bold p-1 mx-0"
                      style={{ height: "20%" }}
                    >
                      Player
                    </Row>
                    <Row
                      className="p3 text-align-center"
                      style={{ height: "10%" }}
                    >
                      Enter your (group) name.
                    </Row>
                    <Row
                      className="p text-align-center"
                      style={{ height: "30%" }}
                    >
                      <Row
                        className="p text-align-center"
                        style={{ width: "80%", height: "100%" }}
                      >
                        <Form>
                          <Form.Group>
                            <Form.Control
                              size="lg"
                              placeholder="Enter your (group) name."
                              variant="outlined"
                              value={groupPlayerName}
                              type="text"
                              onKeyPress={(event) => {
                                if (event.key === "Enter")
                                  event.preventDefault();
                              }}
                              onChange={(event) =>
                                setGroupPlayerName(event.target.value)
                              }
                            />
                          </Form.Group>
                        </Form>
                      </Row>
                    </Row>
                    <Row
                      className="p4 text-align-center"
                      style={{ height: "20%" }}
                    >
                      <Row
                        className="p4 text-align-center"
                        style={{ width: "75%", height: "30%" }}
                      >
                        <Button
                          size="lg"
                          color="primary"
                          onClick={async () => {
                            await checkGroupPlayerName();
                          }}
                        >
                          <Row className="p3 text-align-center" xs={12}>
                            OK, go!
                          </Row>
                        </Button>
                      </Row>
                    </Row>
                  </Col>
                </Row>
                <Row
                  className="p4 text-align-center p-1 mx-0"
                  style={{ height: "10%" }}
                  xs={12}
                >
                  Version {version} | © {new Date().getFullYear()} FRAB5 Thesis.
                </Row>
              </Col>
            </Row>
          </Row>
        )}
      </div>
    );
  } else if (FSMPage === "MULTIPLAYER_MODE_HOST_FILLROOMNAME_PAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
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
                      onClick={async () => {
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
                  className="p-1"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                >
                  <Col
                    className="lastmilelogo ph3 text-align-center"
                    style={{
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={12}
                  ></Col>
                </Row>
                <Row
                  className="p7 p-bold p-1 mx-0 "
                  style={{
                    justifyContent: "center",
                    // alignItems: "center",
                    textAlign: "center",
                    height: "65%",
                    backgroundColor: "#E7E6E1",
                  }}
                  xs={12}
                >
                  <Row
                    className="ph6 text-align-center p-bold p-1 mx-0"
                    style={{ height: "15%" }}
                  >
                    Host
                  </Row>
                  <Row
                    className="ph3 text-align-center"
                    style={{ height: "5%" }}
                  >
                    Enter your host room name.
                  </Row>
                  <Row
                    className="ph text-align-center"
                    style={{ height: "10%" }}
                  >
                    <Row
                      className="ph3 text-align-center"
                      style={{ width: "80%", height: "100%" }}
                    >
                      <Form>
                        <Form.Group>
                          <Form.Control
                            size="md"
                            placeholder="Enter your host room name."
                            variant="outlined"
                            value={roomHostName}
                            type="text"
                            onKeyPress={(event) => {
                              if (event.key === "Enter") event.preventDefault();
                            }}
                            onChange={(event) =>
                              setRoomHostName(event.target.value)
                            }
                          />
                        </Form.Group>
                      </Form>
                    </Row>
                  </Row>
                  <Row
                    className="ph4 text-align-center"
                    style={{ width: "75%", height: "10%" }}
                  >
                    <Button
                      size="lg"
                      color="primary"
                      onClick={async () => {
                        await checkRoomHostName();
                      }}
                    >
                      <Row className="ph3 text-align-center" xs={12}>
                        OK, go!
                      </Row>
                    </Button>
                  </Row>
                </Row>
                <Row
                  className="ph3 text-align-center p-1 mx-0"
                  style={{ height: "10%" }}
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
                    }}
                    xs={3}
                  >
                    <Button
                      size="lg"
                      color="primary"
                      variant="outline-danger"
                      onClick={async () => {
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
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "20%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="p7 p-bold p-1 mx-0 "
                  style={{ height: "60%", backgroundColor: "#E7E6E1" }}
                  xs={12}
                >
                  <Col
                    className="p7"
                    style={{ backgroundColor: "#E7E6E1" }}
                    xs={12}
                  >
                    <Row
                      className="p7 text-align-center p-bold p-1 mx-0"
                      style={{ height: "20%" }}
                    >
                      Host
                    </Row>
                    <Row
                      className="p4 text-align-center"
                      style={{ height: "10%" }}
                    >
                      Enter your host room name.
                    </Row>
                    <Row
                      className="p text-align-center"
                      style={{ height: "30%" }}
                    >
                      <Row
                        className="p text-align-center"
                        style={{ width: "80%", height: "100%" }}
                      >
                        <Form>
                          <Form.Group>
                            <Form.Control
                              size="lg"
                              placeholder="Enter your host room name."
                              variant="outlined"
                              value={roomHostName}
                              type="text"
                              onKeyPress={(event) => {
                                if (event.key === "Enter")
                                  event.preventDefault();
                              }}
                              onChange={(event) =>
                                setRoomHostName(event.target.value)
                              }
                            />
                          </Form.Group>
                        </Form>
                      </Row>
                    </Row>
                    <Row
                      className="p4 text-align-center"
                      style={{ height: "20%" }}
                    >
                      <Row
                        className="p4 text-align-center"
                        style={{ width: "75%", height: "30%" }}
                      >
                        <Button
                          size="lg"
                          color="primary"
                          onClick={async () => {
                            await checkRoomHostName();
                          }}
                        >
                          <Row className="p3 text-align-center" xs={12}>
                            OK, go!
                          </Row>
                        </Button>
                      </Row>
                    </Row>
                  </Col>
                </Row>
                <Row
                  className="p4 text-align-center p-1 mx-0"
                  style={{ height: "10%" }}
                  xs={12}
                >
                  Version {version} | © {new Date().getFullYear()} FRAB5 Thesis.
                </Row>
              </Col>
            </Row>
          </Row>
        )}
      </div>
    );
  } else if (FSMPage === "MULTIPLAYER_MODE_PLAYER_CONTROLPANEL_PAGE") {
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
                    }}
                    xs={3}
                  >
                    <Button
                      size="lg"
                      color="primary"
                      variant="outline-danger"
                      onClick={async () => {
                        await onExitButtonEvent();
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
                        onClick={async () =>
                          await disconnectToBluetoothDevice()
                        }
                        disabled={
                          !isBluetoothConnected ||
                          isDownButtonPressed ||
                          isRightButtonPressed ||
                          isLeftButtonPressed ||
                          isUpButtonPressed ||
                          isStopButtonPressed ||
                          isDirectionButtonReleased ||
                          gameStarted ||
                          isUserFinished
                        }
                      >
                        <Row
                          className="p-arrow-button text-align-center"
                          xs={12}
                        >
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
                          isDirectionButtonReleased ||
                          gameStarted ||
                          isUserFinished
                        }
                      >
                        <Row
                          className="p-arrow-button text-align-center"
                          xs={12}
                        >
                          <MdBluetooth />
                        </Row>
                      </Button>
                    )}
                  </Col>
                </Row>
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
                    <MdPin />
                    &nbsp;&nbsp;Pincode
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
                    <FaUsers />
                    &nbsp;&nbsp;Group&nbsp;Name
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
                  <Col
                    className="ph7 text-align-center text-wrap border border-dark"
                    style={{
                      textAlign: "center",
                      wordBreak: "break-all",
                      height: "100%",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>{getPIN}</Row>
                  </Col>

                  <Col
                    className="ph7 text-align-center border border-dark"
                    style={{
                      textAlign: "center",
                      wordBreak: "break-all",
                      height: "100%",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>{groupPlayerName}</Row>
                  </Col>
                </Row>
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
                    &nbsp;&nbsp;Status&nbsp;Connection
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
                    <RiPinDistanceFill />
                    &nbsp;&nbsp;Distance
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
                    <MdOutlineTimer />
                    &nbsp;&nbsp;Time
                  </Col>
                </Row>
                <Row
                  className="p4 text-align-center"
                  style={{ height: "8%", backgroundColor: "#FFFFFF" }}
                >
                  <Col
                    className="ph7 text-align-center border border-dark"
                    style={{
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>{distanceEncoderSensorValue}&nbsp;&nbsp;m</Row>
                  </Col>
                  <Col
                    className="ph7 text-align-center border border-dark"
                    style={{
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>
                      {stopwatchElapsedTime.hoursElapsedTime} :{" "}
                      {stopwatchElapsedTime.minutesElapsedTime < 10
                        ? "0" + stopwatchElapsedTime.minutesElapsedTime
                        : stopwatchElapsedTime.minutesElapsedTime}{" "}
                      :{" "}
                      {stopwatchElapsedTime.secondsElapsedTime < 10
                        ? "0" + stopwatchElapsedTime.secondsElapsedTime
                        : stopwatchElapsedTime.secondsElapsedTime}
                    </Row>
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
                      justifyContent: "center",
                      alignItems: "flex-start",
                    }}
                    xs={6}
                  ></Col>
                  <Col
                    style={{
                      display: "flex",
                      justifyContent: "right",
                      alignItems: "flex-start",
                    }}
                    xs={6}
                  >
                    <Button
                      size="lg"
                      variant="danger"
                      style={{ height: "100%", width: "100%" }}
                      onClick={async () => setIsUserFinished(true)}
                      disabled={
                        !isBluetoothConnected ||
                        isDownButtonPressed ||
                        isRightButtonPressed ||
                        isLeftButtonPressed ||
                        isUpButtonPressed ||
                        isStopButtonPressed ||
                        isDirectionButtonReleased ||
                        !gameStarted ||
                        isUserFinished
                      }
                    >
                      <Row className="ph3 text-align-center" xs={12}>
                        Finish Mission
                      </Row>
                    </Button>
                  </Col>
                </Row>
                <Row
                  className="ph7 text-align-center text-white p-1"
                  style={{
                    height: "6%",
                    backgroundColor: "#000000",
                    textAlign: "center",
                    wordBreak: "break-all",
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
                  <div
                    style={{ display: "block", height: "99%", width: "100%" }}
                  >
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
                              isDirectionButtonReleased ||
                              !gameStarted ||
                              isUserFinished
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
                              isDirectionButtonReleased ||
                              !gameStarted ||
                              isUserFinished
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
                              isDirectionButtonReleased ||
                          !gameStarted  || isUserFinished
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
                              isDirectionButtonReleased ||
                              !gameStarted ||
                              isUserFinished
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
                          wordBreak: "break-all",
                        }}
                        xs={4}
                      >
                        Multiplayer
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
                              isDirectionButtonReleased ||
                              !gameStarted ||
                              isUserFinished
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
                          wordBreak: "break-all",
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
                      onClick={async () => {
                        // await sendCommand(restartCommand);
                        await onExitButtonEvent();
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
                  className="p3 text-align-center p-1 mx-0"
                  style={{ height: "10%", backgroundColor: "#FFFFFF" }}
                >
                  Multiplayer&nbsp;Mode
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
                  <div
                    style={{ display: "block", height: "99%", width: "100%" }}
                  >
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
                              isDirectionButtonReleased ||
                              !gameStarted ||
                              isUserFinished
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
                              isDirectionButtonReleased ||
                              !gameStarted ||
                              isUserFinished
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
                              isDirectionButtonReleased ||
                              !gameStarted ||
                              isUserFinished
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
                              isDirectionButtonReleased ||
                              !gameStarted ||
                              isUserFinished
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
                    height: "12%",
                  }}
                >
                  <Col
                    className="p3 text-align-center text-white border border-white"
                    style={{
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={6}
                  ></Col>
                  <Col
                    className="p3 text-align-center text-white border border-white"
                    style={{
                      height: "100%",
                      backgroundColor: "#000000",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={3}
                  >
                    Pincode
                  </Col>
                  <Col
                    className="p3 text-align-center border border-dark"
                    style={{
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={3}
                  >
                    {getPIN}
                  </Col>
                </Row>
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
                    <FaUsers />
                    &nbsp;&nbsp;Group&nbsp;Name
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
                    &nbsp;&nbsp;Robot&nbsp;Name
                  </Col>
                </Row>
                <Row
                  className="p-1"
                  style={{
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    height: "15%",
                  }}
                >
                  <Col
                    className="p3 text-align-center border border-dark"
                    style={{
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>{groupPlayerName}</Row>
                  </Col>
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
                  className="p-1"
                  style={{
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    height: "3%",
                  }}
                />
                <Row
                  className="p-1"
                  style={{
                    alignItems: "center",
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
                    }}
                    xs={6}
                  >
                    <RiPinDistanceFill />
                    &nbsp;&nbsp;Distance
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
                    <MdOutlineTimer />
                    &nbsp;&nbsp;Time
                  </Col>
                </Row>
                <Row
                  className="p-1"
                  style={{
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    height: "25%",
                  }}
                >
                  <Col
                    className="p7 text-align-center border border-dark"
                    style={{
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>{distanceEncoderSensorValue}&nbsp;&nbsp;m</Row>
                  </Col>

                  <Col
                    className="p7 text-align-center border border-dark"
                    style={{
                      height: "100%",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>
                      {" "}
                      {stopwatchElapsedTime.hoursElapsedTime} :{" "}
                      {stopwatchElapsedTime.minutesElapsedTime < 10
                        ? "0" + stopwatchElapsedTime.minutesElapsedTime
                        : stopwatchElapsedTime.minutesElapsedTime}{" "}
                      :{" "}
                      {stopwatchElapsedTime.secondsElapsedTime < 10
                        ? "0" + stopwatchElapsedTime.secondsElapsedTime
                        : stopwatchElapsedTime.secondsElapsedTime}
                    </Row>
                  </Col>
                </Row>
                <Row
                  className=""
                  style={{
                    alignItems: "center",

                    backgroundColor: "#FFFFFF",
                    height: "2%",
                  }}
                ></Row>
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
                      justifyContent: "center",
                      alignItems: "flex-start",
                    }}
                    xs={6}
                  ></Col>
                  <Col
                    style={{
                      display: "flex",
                      justifyContent: "right",
                      alignItems: "flex-start",
                    }}
                    xs={6}
                  >
                    <Button
                      size="lg"
                      variant="danger"
                      style={{ height: "100%", width: "100%" }}
                      onClick={async () => setIsUserFinished(true)}
                      disabled={
                        !isBluetoothConnected ||
                        isDownButtonPressed ||
                        isRightButtonPressed ||
                        isLeftButtonPressed ||
                        isUpButtonPressed ||
                        isStopButtonPressed ||
                        isDirectionButtonReleased ||
                        !gameStarted ||
                        isUserFinished
                      }
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        Finish Mission
                      </Row>
                    </Button>
                  </Col>
                </Row>
              </Col>

              <Col style={{ backgroundColor: "#FFFFFF" }} xs={2}>
                <Row
                  className="p-1"
                  style={{
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    height: "12%",
                  }}
                >
                  <Col
                    className="p3 text-align-center text-white border border-dark"
                    style={{
                      backgroundColor: "#000000",
                      textAlign: "center",
                      wordBreak: "break-all",
                      height: "100%",
                    }}
                    xs={6}
                  >
                    <Row xs={12}>Status</Row>
                  </Col>

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
                    />
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
                    />
                  )}
                </Row>
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
                      justifyContent: "right",
                      alignItems: "flex-start",
                    }}
                    xs={12}
                  >
                    {isBluetoothConnected ? (
                      <Button
                        size="lg"
                        variant="outline-danger"
                        style={{ height: "100%", width: "100%" }}
                        onClick={async () =>
                          await disconnectToBluetoothDevice()
                        }
                        disabled={
                          !isBluetoothConnected ||
                          isDownButtonPressed ||
                          isRightButtonPressed ||
                          isLeftButtonPressed ||
                          isUpButtonPressed ||
                          isStopButtonPressed ||
                          isDirectionButtonReleased ||
                          gameStarted ||
                          isUserFinished
                        }
                      >
                        <Row
                          className="p-arrow-button text-align-center"
                          xs={12}
                        >
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
                          isDirectionButtonReleased ||
                          gameStarted ||
                          isUserFinished
                        }
                      >
                        <Row
                          className="p-arrow-button text-align-center"
                          xs={12}
                        >
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
                    height: "60%",
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
  } else if (FSMPage === "MULTIPLAYER_MODE_HOST_CONTROLPANEL_PAGE") {
    return (
      <div className="vw-100 vh-100" style={{ backgroundColor: "#F7F6E7" }}>
        {/* {isPortrait ? (
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
        ) : ( */}
        <Row className="vw-100 vh-100 p-1 mx-0 ">
          <Row
            className="p-1 mx-0 "
            style={{ height: "25%", backgroundColor: "#FFFFFF" }}
          >
            <Col xs={3}>
              <Row
                className="p p-1 mx-0 text-white text-align-center"
                style={{ height: "40%", backgroundColor: "#000000" }}
              >
                <MdPin />
                Pincode
              </Row>

              <Row
                className="p7 p-1 mx-0 border border-dark text-align-center"
                style={{ height: "60%", backgroundColor: "#FFFFFF" }}
              >
                {getPIN}
              </Row>
            </Col>
            <Col xs={3}>
              <Row
                className="p p-1 mx-0 text-white text-align-center"
                style={{ height: "40%", backgroundColor: "#000000" }}
              >
                <MdOutlineTimer />
                Stopwatch Timer
              </Row>

              <Row
                className="p7 p-1 mx-0 border border-dark text-align-center"
                style={{ height: "60%", backgroundColor: "#FFFFFF" }}
              >
                {stopwatchElapsedTime.hoursElapsedTime} :{" "}
                {stopwatchElapsedTime.minutesElapsedTime < 10
                  ? "0" + stopwatchElapsedTime.minutesElapsedTime
                  : stopwatchElapsedTime.minutesElapsedTime}{" "}
                :{" "}
                {stopwatchElapsedTime.secondsElapsedTime < 10
                  ? "0" + stopwatchElapsedTime.secondsElapsedTime
                  : stopwatchElapsedTime.secondsElapsedTime}
              </Row>
            </Col>
            <Col xs={6}>
              <Row
                className="p p-1 mx-0 text-white text-align-center"
                style={{ height: "40%", backgroundColor: "#000000" }}
              >
                <AiOutlineMenu />
                Menu
              </Row>
              <Row
                className="p-1 mx-0 border border-dark"
                style={{ height: "60%", backgroundColor: "#FFFFFF" }}
              >
                <Col xs={3}>
                  <Row
                    className="p-1 mx-0"
                    style={{ height: "100%", backgroundColor: "#FFFFFF" }}
                  >
                    <Button
                      onClick={async () => {
                        if (getInClassRoom) {
                          await db.ref("gameSessions/" + getPIN).update({
                            gameAlreadyStarted: true,
                            gameStarted: true,
                            timeIsActived: true,
                            timeIsPaused: false,
                          });
                        }
                        startStopwatch();
                        
                        setIsCloseResetTimerButton(true);
                      }}
                      disabled={timeIsActive && timeIsPaused}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        Start
                      </Row>
                    </Button>
                  </Row>
                </Col>
                <Col xs={3}>
                  <Row
                    className="p-1 mx-0"
                    style={{ height: "100%", backgroundColor: "#FFFFFF" }}
                  >
                    <Button
                      onClick={async () => {
                        if (getInClassRoom) {
                          await db.ref("gameSessions/" + getPIN).update({
                            gameAlreadyStarted: true,
                            gameStarted: true,
                            timeIsActived: false,
                            timeIsPaused: true,
                          });
                        }
                        stopStopwatch();
                        setIsCloseResetTimerButton(false);
                      }}
                      disabled={!(timeIsActive && timeIsPaused)}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        Stop
                      </Row>
                    </Button>
                  </Row>
                </Col>
                <Col xs={3}>
                  <Row
                    className="p-1 mx-0"
                    style={{ height: "100%", backgroundColor: "#FFFFFF" }}
                  >
                    <Button
                      onClick={async () => {
                        if (getInClassRoom) {
                          await db.ref("gameSessions/" + getPIN).update({
                            gameAlreadyStarted: true,
                            gameStarted: false,
                            timeIsActived: false,
                            timeIsPaused: false,
                          });
                        }
                        resetStopwatch();
                        setIsCloseResetTimerButton(true);
                      }}
                      disabled={isCloseResetTimerButton}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        Reset
                      </Row>
                    </Button>
                  </Row>
                </Col>
                <Col xs={3}>
                  <Row
                    className="p-1 mx-0"
                    style={{ height: "100%", backgroundColor: "#FFFFFF" }}
                  >
                    <Button
                      variant="danger"
                      onClick={async () => {
                        onExitButtonEvent();
                      }}
                      disabled={(timeIsActive && timeIsPaused) || !isCloseResetTimerButton }
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        Exit
                      </Row>
                    </Button>
                  </Row>
                </Col>
              </Row>
            </Col>
          </Row>

          <Row className="mx-0" style={{ height: "10%" }}>
            <Col
              xs={2}
              className="p text-white text-align-center"
              style={{ backgroundColor: "#000000" }}
            >
              Leaderboard
            </Col>

            <Col
              xs={10}
              className="p text-align-center border border-dark"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              {roomHostName}
            </Col>
          </Row>
          <Row
            className="p-1 mx-0  border border-dark"
            style={{ width: "100%", height: "65%", backgroundColor: "#D3DEDC" }}
          >
            <DataGrid
              dataSource={playersData}
              keyExpr="groupName"
              showBorders={true}
              allowColumnReordering={true}
              ref={dataGridRef}
              // allowColumnResizing={true}
              columnAutoWidth={true}
            >
              <Editing
                mode="row"
                // changes={changes}
                onChangesChange={onChangesChange}
                // editRowKey={editRowKey}
                // onEditRowKeyChange={onEditRowKeyChange}
                allowUpdating={true && !gameStarted}
              />
              <Scrolling columnRenderingMode="virtual" />
              <GroupPanel visible={true} />
              <SearchPanel visible={true} />
              <Grouping autoExpandAll={true} />
              <Sorting mode="multiple" />
              <Column
                dataField="groupName"
                dataType="string"
                caption="Group Name"
                allowEditing={false}
              />
              <Column
                dataField="deviceName"
                dataType="string"
                caption="Robot Name"
                allowEditing={false}
              />
              <Column
                dataField="parcelCorrectCount"
                dataType="number"
                caption="Sent Correctly Parcel Count"
                allowEditing={true && !gameStarted}
                defaultSortOrder="desc"
              />
              <Column
                dataField="distanceSensorValue"
                dataType="number"
                caption="Distance (m.)"
                allowEditing={false}
                defaultSortOrder="asc"
              />
              <Column
                alignment="right"
                dataField="timeFinishedRecord"
                dataType="string"
                caption="Recorded Time (h:mm:ss)"
                allowEditing={false}
                defaultSortOrder="asc"
              />
              <Toolbar>
                <Item name="groupPanel" />
                <Item location="after">
                  <ButtonD
                    icon="exportpdf"
                    text="Export to PDF"
                    onClick={exportGridPDF}
                  />
                  <ButtonD
                    icon="exportxlsx"
                    text="Export to XLSX"
                    onClick={exportGridExcel}
                  />
                </Item>
                <Item name="searchPanel" />
              </Toolbar>
            </DataGrid>
          </Row>
        </Row>
        {/* )} */}
      </div>
    );
  } else if (FSMPage === "MULTIPLAYER_MODE_LOADINGPAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "20%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="loadinglogoh p-3 mx-0"
                  style={{ height: "60%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="ph3 text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
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
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "20%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="loadinglogo p-3 mx-0"
                  style={{ height: "60%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  Version {version} | © {new Date().getFullYear()} FRAB5 Thesis.
                </Row>
              </Col>
            </Row>
          </Row>
        )}
      </div>
    );
  } else if (FSMPage === "MULTIPLAYER_MODE_ERRORHOSTLOSTPAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>

                <Row
                  className="p-3 mx-0"
                  style={{ height: "5%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="ph8 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="ph7 text-align-center p-1 mx-0"
                  style={{ textAlign: "center", height: "20%" }}
                  xs={12}
                >
                  The game of this room
                  <br />
                  has already started
                  <br />
                  or The host of the room left.
                  <br />
                  Thanks for playing!
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ display: "flex", height: "20%" }}
                  xs={12}
                >
                  <Button
                    size="lg"
                    variant="danger"
                    onClick={() => {
                      setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                    }}
                    style={{ width: "75%" }}
                  >
                    <Row className="ph7 text-align-center" xs={12}>
                      <FaHome />
                      Go Back to Homepage
                    </Row>
                  </Button>
                </Row>
              </Col>
            </Row>
          </Row>
        ) : (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "25%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p2 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="p3 text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  The game of this room has already started or The host of the
                  room left. Thanks for playing!
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  <Row
                    className="p4 text-align-center"
                    style={{ width: "30%" }}
                  >
                    <Button
                      size="sm"
                      color="primary"
                      variant="danger"
                      onClick={() => {
                        // setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                        history.push("/");
                      }}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        <FaHome />
                        Go Back to Homepage
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
  } else if (FSMPage === "MULTIPLAYER_MODE_ERRORGAMEALREADYSTARTEDPAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>

                <Row
                  className="p-3 mx-0"
                  style={{ height: "5%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="ph8 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="ph7 text-align-center p-1 mx-0"
                  style={{ textAlign: "center", height: "20%" }}
                  xs={12}
                >
                  The game of this room
                  <br />
                  has already started
                  <br />
                  or The host of the room left.
                  <br />
                  Thanks for playing!
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ display: "flex", height: "20%" }}
                  xs={12}
                >
                  <Button
                    size="lg"
                    variant="danger"
                    onClick={() => {
                      setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                    }}
                    style={{ width: "75%" }}
                  >
                    <Row className="ph7 text-align-center" xs={12}>
                      <FaHome />
                      Go Back to Homepage
                    </Row>
                  </Button>
                </Row>
              </Col>
            </Row>
          </Row>
        ) : (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "30%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p2 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="p3 text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  The game of this room has already started or The host of the
                  room left. Thanks for playing!
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  <Row
                    className="p4 text-align-center"
                    style={{ width: "30%" }}
                  >
                    <Button
                      size="sm"
                      color="primary"
                      variant="danger"
                      onClick={() => {
                        // setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                        history.push("/");
                      }}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        <FaHome />
                        Go Back to Homepage
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
  } else if (FSMPage === "MULTIPLAYER_MODE_ERRORGOTDISCONNECTEDPAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>

                <Row
                  className="p-3 mx-0"
                  style={{ height: "5%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="ph8 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="ph7 text-align-center p-1 mx-0"
                  style={{ textAlign: "center", height: "20%" }}
                  xs={12}
                >
                  You've disconnected.
                  <br />
                  We're trying to reconnect you now.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ display: "flex", height: "20%" }}
                  xs={12}
                >
                  <Button
                    size="lg"
                    variant="danger"
                    onClick={() => {
                      setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                    }}
                    style={{ width: "75%" }}
                  >
                    <Row className="ph7 text-align-center" xs={12}>
                      <FaHome />
                      Go Back to Homepage
                    </Row>
                  </Button>
                </Row>
              </Col>
            </Row>
          </Row>
        ) : (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "30%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p2 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="p3 text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  You've disconnected. We're trying to reconnect you now.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  <Row
                    className="p4 text-align-center"
                    style={{ width: "30%" }}
                  >
                    <Button
                      size="sm"
                      color="primary"
                      variant="danger"
                      onClick={() => {
                        // setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                        history.push("/");
                      }}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        <FaHome />
                        Go Back to Homepage
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
  } else if (FSMPage === "MULTIPLAYER_MODE_ERRORNEEDPINPAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>

                <Row
                  className="p-3 mx-0"
                  style={{ height: "5%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="ph8 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="ph7 text-align-center p-1 mx-0"
                  style={{ textAlign: "center", height: "20%" }}
                  xs={12}
                >
                  You need to enter
                  <br />a game PIN before you can play.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ display: "flex", height: "20%" }}
                  xs={12}
                >
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => {
                      setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                    }}
                    style={{ width: "75%" }}
                  >
                    <Row className="ph7 text-align-center" xs={12}>
                      OK
                    </Row>
                  </Button>
                </Row>
              </Col>
            </Row>
          </Row>
        ) : (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "30%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p2 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="p3 text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  You need to enter a game PIN before you can play.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  <Row
                    className="p4 text-align-center"
                    style={{ width: "30%" }}
                  >
                    <Button
                      size="sm"
                      color="primary"
                      onClick={() => {
                        setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                      }}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        OK
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
  } else if (FSMPage === "MULTIPLAYER_MODE_ERRORNEEDGROUPNAMEPLAYERPAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>

                <Row
                  className="p-3 mx-0"
                  style={{ height: "5%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="ph8 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="ph7 text-align-center p-1 mx-0"
                  style={{ textAlign: "center", height: "20%" }}
                  xs={12}
                >
                  You need to enter
                  <br />a (group) name before you can play.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ display: "flex", height: "20%" }}
                  xs={12}
                >
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => {
                      setFSMPage("MULTIPLAYER_MODE_PLAYER_FILLGROUPNAME_PAGE");
                    }}
                    style={{ width: "75%" }}
                  >
                    <Row className="ph7 text-align-center" xs={12}>
                      OK
                    </Row>
                  </Button>
                </Row>
              </Col>
            </Row>
          </Row>
        ) : (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "30%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p2 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="p3 text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  You need to enter a (group) name before you can play.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  <Row
                    className="p4 text-align-center"
                    style={{ width: "30%" }}
                  >
                    <Button
                      size="sm"
                      color="primary"
                      onClick={() => {
                        setFSMPage(
                          "MULTIPLAYER_MODE_PLAYER_FILLGROUPNAME_PAGE"
                        );
                      }}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        OK
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
  } else if (FSMPage === "MULTIPLAYER_MODE_ERRORNEEDROOMNAMEHOSTPAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>

                <Row
                  className="p-3 mx-0"
                  style={{ height: "5%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="ph8 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="ph7 text-align-center p-1 mx-0"
                  style={{ textAlign: "center", height: "20%" }}
                  xs={12}
                >
                  You need to enter
                  <br />
                  your host room name before you can remote.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ display: "flex", height: "20%" }}
                  xs={12}
                >
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => {
                      setFSMPage("MULTIPLAYER_MODE_HOST_FILLROOMNAME_PAGE");
                    }}
                    style={{ width: "75%" }}
                  >
                    <Row className="ph7 text-align-center" xs={12}>
                      OK
                    </Row>
                  </Button>
                </Row>
              </Col>
            </Row>
          </Row>
        ) : (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "30%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p2 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="p3 text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  You need to enter your host room name before you can remote.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  <Row
                    className="p4 text-align-center"
                    style={{ width: "30%" }}
                  >
                    <Button
                      size="sm"
                      color="primary"
                      onClick={() => {
                        setFSMPage("MULTIPLAYER_MODE_HOST_FILLROOMNAME_PAGE");
                      }}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        OK
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
  } else if (FSMPage === "MULTIPLAYER_MODE_ERRORPLAYERNAMETAKEN_PAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>

                <Row
                  className="p-3 mx-0"
                  style={{ height: "5%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="ph8 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="ph7 text-align-center p-1 mx-0"
                  style={{ textAlign: "center", height: "20%" }}
                  xs={12}
                >
                  Sorry, the (group) name is taken.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ display: "flex", height: "20%" }}
                  xs={12}
                >
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => {
                      setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                    }}
                    style={{ width: "75%" }}
                  >
                    <Row className="ph7 text-align-center" xs={12}>
                      OK
                    </Row>
                  </Button>
                </Row>
              </Col>
            </Row>
          </Row>
        ) : (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "30%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p2 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="p3 text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Sorry, the (group) name is taken.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  <Row
                    className="p4 text-align-center"
                    style={{ width: "30%" }}
                  >
                    <Button
                      size="sm"
                      color="primary"
                      onClick={() => {
                        setFSMPage(
                          "MULTIPLAYER_MODE_PLAYER_FILLGROUPNAME_PAGE"
                        );
                      }}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        OK
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
  } else if (FSMPage === "MULTIPLAYER_MODE_ERRORHOSTNOTFOUNDPAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>

                <Row
                  className="p-3 mx-0"
                  style={{ height: "5%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="ph8 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="ph7 text-align-center p-1 mx-0"
                  style={{ textAlign: "center", height: "20%" }}
                  xs={12}
                >
                  Game PIN wasn't recognized.
                  <br />
                  Please check and try again.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ display: "flex", height: "20%" }}
                  xs={12}
                >
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => {
                      setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                    }}
                    style={{ width: "75%" }}
                  >
                    <Row className="ph7 text-align-center" xs={12}>
                      OK
                    </Row>
                  </Button>
                </Row>
              </Col>
            </Row>
          </Row>
        ) : (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "30%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p2 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="p3 text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Game PIN wasn't recognized. Please check and try again.
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  <Row
                    className="p4 text-align-center"
                    style={{ width: "30%" }}
                  >
                    <Button
                      size="sm"
                      color="primary"
                      onClick={() => {
                        setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                      }}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        OK
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
  } else if (FSMPage === "MULTIPLAYER_MODE_ERROROTHERPAGE") {
    return (
      <div
        className="vw-100 vh-100 mx-0"
        style={{ fontSize: "12px", backgroundColor: "#F7F6E7" }}
      >
        {isPortrait ? (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>

                <Row
                  className="p-3 mx-0"
                  style={{ height: "5%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="ph8 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="ph7 text-align-center p-1 mx-0"
                  style={{ textAlign: "center", height: "20%" }}
                  xs={12}
                >
                  Something went wrong!
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ display: "flex", height: "20%" }}
                  xs={12}
                >
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => {
                      setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                    }}
                    style={{ width: "75%" }}
                  >
                    <Row className="ph7 text-align-center" xs={12}>
                      OK
                    </Row>
                  </Button>
                </Row>
              </Col>
            </Row>
          </Row>
        ) : (
          <Row className="vw-100 vh-100 p-1 mx-0">
            <Row className="p-3 mx-0" xs={12}>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={12}>
                <Row
                  className="lastmilelogo p-3 mx-0"
                  style={{ height: "15%", backgroundColor: "#FFFFFF" }}
                  xs={12}
                ></Row>
                <Row
                  className="warninglogo p-3 mx-0"
                  style={{ height: "30%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p2 p-bold text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Oops!
                </Row>

                <Row
                  className="p3 text-align-center p-1 mx-0"
                  style={{ height: "15%" }}
                  xs={12}
                >
                  Something went wrong!
                </Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  <Row
                    className="p4 text-align-center"
                    style={{ width: "30%" }}
                  >
                    <Button
                      size="sm"
                      color="primary"
                      variant="danger"
                      onClick={() => {
                        setFSMPage("MULTIPLAYER_MODE_HOMEPAGE");
                      }}
                    >
                      <Row className="p3 text-align-center" xs={12}>
                        <FaHome />
                        Go Back to Homepage
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
}
/* FINITE STATE MACHINE PAGE CODE END */
/* EXPORT DEFAULT FUNCTION MULTIPLAYER CODE END */
