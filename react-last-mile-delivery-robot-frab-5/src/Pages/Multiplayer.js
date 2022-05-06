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

import React, { useState, useEffect, useLayoutEffect } from "react"; // include React Library
import { useStateIfMounted } from "use-state-if-mounted";
import { useHistory } from "react-router-dom"; // include React Router DOM Library
import { Button, Col, Row, Form } from "react-bootstrap";
import { useMediaQuery } from "react-responsive";

import { AiOutlineMenu } from "react-icons/ai"; // include React Icons Library
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
  Editing,
  Sorting,
  Export,
  Pager,
  Paging,
  SearchPanel,
} from "devextreme-react/data-grid";

import { Workbook } from "exceljs";
import { saveAs } from "file-saver";
// Our demo infrastructure requires us to use 'file-saver-es'.
// We recommend that you use the official 'file-saver' package in your applications.
import { exportDataGrid } from "devextreme/excel_exporter";

let bluetoothDevice = null; // Bluetooth Device Name Variable
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
  // eslint-disable-next-line
  const [version, setVersion] = useStateIfMounted("1.10.0");
  /* CALL HISTORY CODE BEGIN */
  const history = useHistory();
  /* CALL HISTORY CODE END */

  /* TABLE ICON ON LEADERBOARD CODE END */

  /* BACK BUTTON EVENT ON BROWNSER CODE BEGIN */
  function onBackButtonEvent(event) {
    event.preventDefault();
    setIsExit(true);
    clearInterval(intervalId);
    resetStopwatch();
    clearInterval(intervalId);
    resetStopwatch();
    disconnectToBluetoothDeviceImmediately();
    clearInterval(intervalId);
    resetStopwatch();
    db.ref("gameSessions/" + getPIN).remove();
  }
  /* BACK BUTTON EVENT ON BROWNSER CODE END */

  /* EXIT BUTTON EVENT ON MULTIPLAYER UI CODE END */
  /* ALERT MESSEGE BEFORE UNLOAD PAGE CODE BEGIN */
  const onBeforeUnload = (event) => {
    // the method that will be used for both add and remove event
    event.preventDefault();
    let confirmationMessage = "";
    /* Do you small action code here */
    (event || window.event).returnValue = confirmationMessage; //Gecko + IE
    disconnectToBluetoothDeviceImmediately();
    return confirmationMessage;
  };
  /* ALERT MESSEGE BEFORE UNLOAD PAGE CODE END */
  /* DISCONNNECT BLUETOOTH DEVICE AFTER UNLOAD PAGE CODE BEGIN */
  const afterUnload = () => {
    disconnectToBluetoothDeviceImmediately();
    setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
    if (getInClassRoom) {
      if (isHost) {
        db.ref("gameSessions/" + getPIN).remove();
      } else {
        db.ref(
          "gameSessions/" + getPIN + "/players/" + groupPlayerName
        ).remove();
      }
    }
    history.push("/");
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
  const stability_communicate_delay = 1;
  /* DELAY STABILITY IN MILLISECONDS TO SEND DATA TO BLUETOOTH DEVICE CODE END */

  /* BLUETOOTH LOW ENEGRY RELATED VARIABLES CODE BEGIN */
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] =
    useState("Not connected");

  const myESP32ServiceUUID = "818796aa-2f20-11ec-8d3d-0242ac130003";

  const distanceEncoderSensorCharacteristicUUID =
    "818799c0-2f20-11ec-8d3d-0242ac130003";
  const commandCharacteristicUUID = "81879be6-2f20-11ec-8d3d-0242ac130003";

  const forwardCommand = 0x50;
  const spinLeftCommand = 0x52;
  const spinRightCommand = 0x53;
  const backwardCommand = 0x51;
  const stopCommand = 0x54;

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

  const [isStartAdminButtonPressed, setIsStartAdminButtonPressed] =
    useState(false);
  const [isStopAdminButtonPressed, setIsStopAdminButtonPressed] =
    useState(false);
  const [isResetAdminButtonPressed, setIsResetAdminButtonPressed] =
    useState(false);

  const [isUserFinished, setIsUserFinished] = useState(false);
  const [isUserAlreadyFinished, setIsUserAlreadyFinished] = useState(false);

  const [isExit, setIsExit] = useState(false);
  function onDisconnected() {
    setDistanceEncoderSensorValue((0).toFixed(3));
    distanceEncoderSensorCharacteristic = null;
    commandCharacteristic = null;
    bluetoothDevice = null;
    setBluetoothDeviceName("Not connected");
    setIsBluetoothConnected(false);
    // if (
    //   !isHost &&
    //   getInClassRoom &&
    //   !gotAlreadyHostLeftDetected &&
    //   groupPlayerName.trim() !== ""
    // ) {
    //   db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update({
    //     deviceName: "Not connected",
    //     distanceSensorValue: parseFloat((0).toFixed(3)),
    //     parcelCorrectCount: 0,
    //   });
    // }
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
        filters: [{ namePrefix: "EDUBOT" }],
        optionalServices: [
          myESP32ServiceUUID,
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
      distanceEncoderSensorCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleDistanceEncoderSensorNotifications
      );
      setBluetoothDeviceName(bluetoothDevice.name);

      // console.log(bluetoothDevice.name);
      if (
        !isHost &&
        getInClassRoom &&
        !gotAlreadyHostLeftDetected &&
        groupPlayerName.trim() !== ""
      ) {
        await db
          .ref("gameSessions/" + getPIN + "/players/" + groupPlayerName)
          .update({
            deviceName: bluetoothDevice.name,
            parcelCorrectCount: 0,
          });
      }
      setIsBluetoothConnected(true);
    } catch {
      setDistanceEncoderSensorValue((0).toFixed(3));

      // await bluetoothDevice.gatt.disconnect();

      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      if (
        !isHost &&
        getInClassRoom &&
        !gotAlreadyHostLeftDetected &&
        groupPlayerName.trim() !== ""
      ) {
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
      if (
        !isHost &&
        getInClassRoom &&
        !gotAlreadyHostLeftDetected &&
        groupPlayerName.trim() !== ""
      ) {
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

      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      if (
        !isHost &&
        getInClassRoom &&
        !gotAlreadyHostLeftDetected &&
        groupPlayerName.trim() !== ""
      ) {
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
    if (
      !isHost &&
      getInClassRoom &&
      !gotAlreadyHostLeftDetected &&
      groupPlayerName.trim() !== ""
    ) {
      db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update({
        distanceSensorValue: parseFloat((result / 1000).toFixed(3)),
      });
    }
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

  /* BLUETOOTH LOW ENEGRY RELATED VARIABL
   END */

  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" }); // Check responsive.

  /* SESSION PLAYER LOGIN CODE BEGIN */

  // const [sortColumn, setSortColumn] = useState(null);
  // const [sortDirection, setSortDirection] = useState(null);
  // const [rows, setRows] = useState([]);

  // const playerColumns = [
  //   { key: 'groupName', name: 'Group Name', sortable:true, },
  //   { key: 'deviceName', name: 'Robot Name', sortable:true,  },
  //   { key: 'isFinishedMission', name: 'Finished', sortable:true, sortDescendingFirst:true,  },
  //   { key: 'parcelCorrectCount', name: 'Parcel Count', sortable:true, sortDescendingFirst:true,  editor: TextEditor },
  //   { key: 'distanceSensorValue', name: 'Distance (m.)', sortable:true, },
  //   { key: 'timeFinishedRecord', name: 'Recorded Time', sortable:true,  },

  // ];

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

  function JoinSession() {
    setIsHost(false);
    setGetInClassRoom(false);
    setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
    function onSuccess(response) {
      let data = response.val();
      if (data) {
        // if (data.gameAlreadyStarted) {
        //   setFSMPage("MULTIPLAYER_MODE_ERRORGAMEALREADYSTARTEDPAGE");
        // } else {
        setGetPIN(PIN);
        setFSMPage("MULTIPLAYER_MODE_PLAYER_FILLGROUPNAME_PAGE");
        // }
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
  function checkGroupPlayerName() {
    let nextStepGet = false;
    function onSuccessHost() {
      // let data = response.val();
      // if (data.gameAlreadyStarted) {
      //   setFSMPage("MULTIPLAYER_MODE_ERRORGAMEALREADYSTARTEDPAGE");
      // } else {
      nextStepGet = true;
      // }
    }
    function onSuccessPlayer(response) {
      let data = response.val();
      if (data) {
        setFSMPage("MULTIPLAYER_MODE_ERRORPLAYERNAMETAKEN_PAGE");
      } else {
        db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).set({
          groupName: groupPlayerName,
          deviceName: "Not connected",
          parcelCorrectCount: 0,
          distanceSensorValue: parseFloat((0).toFixed(3)),
          timeFinishedRecord: "0 : 00 : 00",
          isFinishedMission: "Not yet",
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
  function CreateSession() {
    setIsHost(true);
    setFSMPage("MULTIPLAYER_MODE_HOST_FILLROOMNAME_PAGE");
  }
  function checkRoomHostName() {
    let generatedPin = Math.floor(Math.random() * (9999 - 100 + 1)) + 100;
    setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
    function onSuccess(response) {
      let data = response.val();
      // showPopupLoading();
      if (data) {
        checkRoomHostName();
      } else {
        // resetStopwatch();
        db.ref("gameSessions/" + generatedPin.toString()).set({
          // gameAlreadyStarted: false,
          gameStarted: false,
          timeIsActived: false,
          timeIsPaused: false,
          roomName: roomHostName,
          hostOnline: true,
          timeHours: "0",
          timeMinutes: "00",
          timeSeconds: "00",
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
  function resetStopwatch() {
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
  function startStopwatch() {
    setTimeIsActive(true);
    setTimeIsPaused(false);
    startTime = Date.now();
  }
  function stopStopwatch() {
    setTimeIsPaused(true);
    elapsedTime += Date.now() - startTime;
    clearInterval(intervalId);
  }

  useEffect(() => {
    if (timeIsActive && !timeIsPaused) {
      intervalId = setInterval(function () {
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
        let hours_str = String(hours);
        let minutes_str = "00";
        let seconds_str = "00";
        if (minutes < 10) {
          minutes_str = "0" + String(minutes);
        } else {
          minutes_str = String(minutes);
        }

        if (seconds < 10) {
          seconds_str = "0" + String(seconds);
        } else {
          seconds_str = String(seconds);
        }
        if (isHost && getInClassRoom) {
          db.ref("gameSessions/" + getPIN).update({
            timeHours: hours_str,
            timeMinutes: minutes_str,
            timeSeconds: seconds_str,
          });
        }
      }, 10);
    } else {
      clearInterval(intervalId);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [getInClassRoom, getPIN, isHost, timeIsActive, timeIsPaused]);

  /* STOPWATCH TIMER CONTROL CODE END */
  /* FETCHING DATA ON FIREBASE CONTROL CODE BEGIN */
  let fetchData = () => {
    function onSuccess(response) {
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
          setStopwatchElapsedTime({
            secondsElapsedTime: parseInt(data.timeSeconds),
            minutesElapsedTime: parseInt(data.timeMinutes),
            hoursElapsedTime: parseInt(data.timeHours),
          });
          // secondsTime = parseInt(data.timeSeconds);
          // minutesTime = parseInt(data.timeMinutes);
          // hoursTime = parseInt(data.timeHours);
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
            // console.log(leaderboardArray);
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
  useLayoutEffect(fetchData, [getInClassRoom, getPIN]);
  // ////console.log(gameData);

  /* PORTRAIT RELATED CODE BEGIN */
  // if (getInClassRoom && !isHost) {
  if (gotStart && !isUserFinished) {
    if (!gotAlreadyStart) {
      setGotAlreadyStart(true);
      // console.log("Start");
      // startStopwatch();
    }
    setGotStart(false);
  }
  function TimeFinishedRecord() {
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
    if (
      !isHost &&
      getInClassRoom &&
      !gotAlreadyHostLeftDetected &&
      groupPlayerName.trim() !== ""
    ) {
      db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update({
        timeFinishedRecord:
          _hoursTimeFinishedRecord +
          " : " +
          _minutesTimeFinishedRecord +
          " : " +
          _secondsTimeFinishedRecord,
      });
    }
  }
  if (gotStop && !isUserFinished) {
    if (!gotAlreadyStop) {
      setGotAlreadyStop(true);
      // console.log("Stop");
      // stopStopwatch();
      TimeFinishedRecord();
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

      if (
        !isHost &&
        getInClassRoom &&
        !gotAlreadyHostLeftDetected &&
        groupPlayerName.trim() !== ""
      ) {
        db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update(
          {
            timeFinishedRecord: "0 : 00 : 00",
            parcelCorrectCount: 0,
            distanceSensorValue: parseFloat((0).toFixed(3)),
            isFinishedMission: "Not yet",
          }
        );
      }
    }
    setGotReset(false);
  }
  if (isUserFinished) {
    if (!isUserAlreadyFinished) {
      setIsUserAlreadyFinished(true);
      // stopStopwatch();
      TimeFinishedRecord();
      db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update({
        isFinishedMission: "OK",
      });
      sendCommand(stopCommand);
    }
  }
  // else{
  //   setStopwatchElapsedTime({
  //     secondsElapsedTime: secondsTime,
  //     minutesElapsedTime: minutesTime,
  //     hoursElapsedTime: hoursTime,
  //   })
  // }
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
  // useEffect(() => {
  // eslint-disable-next-line
  history.block(() => {
    setIsExit(true);
    clearInterval(intervalId);
    resetStopwatch();
    if (getInClassRoom) {
      // resetStopwatch();
      if (isHost) {
        db.ref("gameSessions/" + getPIN).remove();
      } else {
        disconnectToBluetoothDeviceImmediately();
        db.ref(
          "gameSessions/" + getPIN + "/players/" + groupPlayerName
        ).remove();
      }
    }
    history.goForward();
  });
  // });
  /* BACK BUTTON DETECTION TO REMOVE DATA IN FIREBASE CODE END */

  /* FETCHING DATA ON FIREBASE CONTROL CODE END */
  /* FINITE STATE MACHINE PAGE CODE BEGIN */

  if (FSMPage === "MULTIPLAYER_MODE_HOMEPAGE") {
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
                    }}
                    xs={3}
                  >
                    <Button
                      size="lg"
                      color="primary"
                      variant="outline-danger"
                      onClick={() => {
                        // onExitButtonEvent();
                        clearInterval(intervalId);
                        resetStopwatch();
                        disconnectToBluetoothDeviceImmediately();
                        clearInterval(intervalId);
                        resetStopwatch();
                        history.goForward();
                        history.push("/");
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
                              if (event.key === "Enter") event.preventDefault();
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
                      onClick={() => {
                        JoinSession();
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
                      onClick={() => {
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
                      onClick={() => {
                        // onExitButtonEvent();
                        clearInterval(intervalId);
                        resetStopwatch();
                        disconnectToBluetoothDeviceImmediately();
                        clearInterval(intervalId);
                        resetStopwatch();
                        history.goForward();
                        history.push("/");
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
                              onChange={(event) => {
                                let value = event.target.value;
                                value = value.replace(/[^0-9]*$/, "");
                                setPIN(value);
                              }}
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
                          onClick={() => {
                            JoinSession();
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
                        onClick={() => {
                          CreateSession();
                        }}
                      >
                        <Row className="p3 text-align-center" xs={12}>
                          Create Session
                        </Row>
                      </Button>
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
                      onClick={() => {
                        // onExitButtonEvent();
                        clearInterval(intervalId);
                        resetStopwatch();
                        disconnectToBluetoothDeviceImmediately();
                        clearInterval(intervalId);
                        resetStopwatch();
                        history.goForward();
                        history.push("/");
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
                            onChange={(event) => {
                              let value = event.target.value;
                              value = value.replace(/[^a-zA-Z0-9\s]*$/, "");
                              setGroupPlayerName(value);
                            }}
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
                      onClick={() => {
                        checkGroupPlayerName();
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
                      onClick={() => {
                        // onExitButtonEvent();
                        clearInterval(intervalId);
                        resetStopwatch();
                        disconnectToBluetoothDeviceImmediately();
                        clearInterval(intervalId);
                        resetStopwatch();
                        history.goForward();
                        history.push("/");
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
                              onChange={(event) => {
                                let value = event.target.value;
                                value = value.replace(/[^a-zA-Z0-9\s]*$/, "");
                                setGroupPlayerName(value);
                              }}
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
                          onClick={() => {
                            checkGroupPlayerName();
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
                      onClick={() => {
                        // onExitButtonEvent();
                        clearInterval(intervalId);
                        resetStopwatch();
                        disconnectToBluetoothDeviceImmediately();
                        clearInterval(intervalId);
                        resetStopwatch();
                        history.goForward();
                        history.push("/");
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
                            pattern="[A-Za-z]{1,50}"
                            onKeyPress={(event) => {
                              if (event.key === "Enter") event.preventDefault();
                              console.log(event.key);
                            }}
                            onChange={(event) => {
                              let value = event.target.value;
                              value = value.replace(/[^a-zA-Z0-9\s]*$/, "");
                              setRoomHostName(value);
                            }}
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
                      onClick={() => {
                        checkRoomHostName();
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
                      onClick={() => {
                        // onExitButtonEvent();
                        clearInterval(intervalId);
                        resetStopwatch();
                        disconnectToBluetoothDeviceImmediately();
                        clearInterval(intervalId);
                        resetStopwatch();
                        history.goForward();
                        history.push("/");
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
                              pattern="[A-Za-z]{1,50}"
                              onKeyPress={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                }
                              }}
                              onChange={(event) => {
                                let value = event.target.value;
                                value = value.replace(/[^a-zA-Z0-9\s]*$/, "");
                                setRoomHostName(value);
                              }}
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
                          onClick={() => {
                            checkRoomHostName();
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
                      onClick={() => {
                        // onExitButtonPlayerEvent();
                        // setIsExit(true);
                        // sleep(stability_exit_delay);
                        clearInterval(intervalId);
                        resetStopwatch();
                        // setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
                        clearInterval(intervalId);
                        resetStopwatch();
                        disconnectToBluetoothDeviceImmediately();
                        db.ref(
                          "gameSessions/" +
                            getPIN +
                            "/players/" +
                            groupPlayerName
                        ).remove();
                        // history.push('/');
                        history.goForward();
                        history.push("/");
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
                          isDirectionButtonReleased
                          // gameStarted ||
                          // isUserFinished
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
                          isDirectionButtonReleased
                          // gameStarted ||
                          // isUserFinished
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
                      {!isUserFinished ? (
                        <div>
                          {" "}
                          {stopwatchElapsedTime.hoursElapsedTime} :{" "}
                          {stopwatchElapsedTime.minutesElapsedTime < 10
                            ? "0" + stopwatchElapsedTime.minutesElapsedTime
                            : stopwatchElapsedTime.minutesElapsedTime}{" "}
                          :{" "}
                          {stopwatchElapsedTime.secondsElapsedTime < 10
                            ? "0" + stopwatchElapsedTime.secondsElapsedTime
                            : stopwatchElapsedTime.secondsElapsedTime}
                        </div>
                      ) : (
                        <div>
                          {_hoursTimeFinishedRecord} :{" "}
                          {_minutesTimeFinishedRecord} :{" "}
                          {_secondsTimeFinishedRecord}
                        </div>
                      )}
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
                    xs={2}
                  ></Col>
                  <Col
                    style={{
                      display: "flex",
                      justifyContent: "right",
                      alignItems: "flex-start",
                    }}
                    xs={8}
                  >
                    <Button
                      size="lg"
                      variant="danger"
                      style={{ height: "100%", width: "100%" }}
                      onClick={() => setIsUserFinished(true)}
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
                  <Col
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-start",
                    }}
                    xs={2}
                  ></Col>
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                      onClick={() => {
                        // await sendCommand(restartCommand);
                        // onExitButtonPlayerEvent();
                        // setIsExit(true);
                        // sleep(stability_exit_delay);
                        clearInterval(intervalId);
                        resetStopwatch();
                        // setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
                        clearInterval(intervalId);
                        resetStopwatch();
                        disconnectToBluetoothDeviceImmediately();
                        db.ref(
                          "gameSessions/" +
                            getPIN +
                            "/players/" +
                            groupPlayerName
                        ).remove();
                        // history.push('/');
                        history.goForward();
                        history.push("/");
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                              await sleep(stability_communicate_delay);
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
                      {!isUserFinished ? (
                        <div>
                          {" "}
                          {stopwatchElapsedTime.hoursElapsedTime} :{" "}
                          {stopwatchElapsedTime.minutesElapsedTime < 10
                            ? "0" + stopwatchElapsedTime.minutesElapsedTime
                            : stopwatchElapsedTime.minutesElapsedTime}{" "}
                          :{" "}
                          {stopwatchElapsedTime.secondsElapsedTime < 10
                            ? "0" + stopwatchElapsedTime.secondsElapsedTime
                            : stopwatchElapsedTime.secondsElapsedTime}
                        </div>
                      ) : (
                        <div>
                          {_hoursTimeFinishedRecord} :{" "}
                          {_minutesTimeFinishedRecord} :{" "}
                          {_secondsTimeFinishedRecord}
                        </div>
                      )}
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
                    xs={2}
                  ></Col>
                  <Col
                    style={{
                      display: "flex",
                      justifyContent: "right",
                      alignItems: "flex-start",
                    }}
                    xs={8}
                  >
                    <Button
                      size="lg"
                      variant="danger"
                      style={{ height: "100%", width: "100%" }}
                      onClick={() => setIsUserFinished(true)}
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
                  <Col
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-start",
                    }}
                    xs={2}
                  ></Col>
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
                          isDirectionButtonReleased
                          // gameStarted ||
                          // isUserFinished
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
                          isDirectionButtonReleased
                          // gameStarted ||
                          // isUserFinished
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
                    height: "62%",
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
                      onClick={() => {
                        setIsStartAdminButtonPressed(true);
                        if (getInClassRoom) {
                          db.ref("gameSessions/" + getPIN).update({
                            // gameAlreadyStarted: true,
                            gameStarted: true,
                            timeIsActived: true,
                            timeIsPaused: false,
                          });
                        }
                        startStopwatch();
                        // sleep(stability_admin_control_timer_delay);
                        setIsStartAdminButtonPressed(false);
                        // setIsCloseResetTimerButton(true);
                      }}
                      disabled={
                        (timeIsActive && !timeIsPaused) ||
                        isStopAdminButtonPressed ||
                        isResetAdminButtonPressed ||
                        isExit
                      }
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
                      onClick={() => {
                        setIsStopAdminButtonPressed(true);
                        if (getInClassRoom) {
                          db.ref("gameSessions/" + getPIN).update({
                            // gameAlreadyStarted: true,
                            gameStarted: true,
                            timeIsActived: false,
                            timeIsPaused: true,
                          });
                        }
                        stopStopwatch();
                        // sleep(stability_admin_control_timer_delay);
                        setIsStopAdminButtonPressed(false);
                        // setIsCloseResetTimerButton(false);
                      }}
                      disabled={
                        !(timeIsActive && !timeIsPaused) ||
                        isStartAdminButtonPressed ||
                        isResetAdminButtonPressed ||
                        isExit
                      }
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
                      onClick={() => {
                        setIsResetAdminButtonPressed(true);
                        if (getInClassRoom) {
                          db.ref("gameSessions/" + getPIN).update({
                            // gameAlreadyStarted: true,
                            gameStarted: false,
                            timeIsActived: false,
                            timeIsPaused: false,
                            timeHours: "0",
                            timeMinutes: "00",
                            timeSeconds: "00",
                          });
                        }
                        resetStopwatch();
                        // sleep(stability_admin_control_timer_delay);
                        setIsResetAdminButtonPressed(false);
                        // setIsCloseResetTimerButton(true);
                      }}
                      disabled={
                        // isCloseResetTimerButton ||
                        !timeIsActive ||
                        !timeIsPaused ||
                        isStartAdminButtonPressed ||
                        isStopAdminButtonPressed ||
                        isExit
                      }
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
                      onClick={() => {
                        // setIsExit(true);
                        // sleep(stability_exit_delay);
                        clearInterval(intervalId);
                        resetStopwatch();
                        // onExitButtonAdminEvent();
                        clearInterval(intervalId);
                        resetStopwatch();
                        // setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
                        clearInterval(intervalId);
                        resetStopwatch();
                        db.ref("gameSessions/" + getPIN).remove();
                        // history.goForward();
                        // history.push("/");
                      }}
                      disabled={
                        timeIsActive ||
                        timeIsPaused ||
                        // !isCloseResetTimerButton ||
                        isStartAdminButtonPressed ||
                        isStopAdminButtonPressed ||
                        isResetAdminButtonPressed
                      }
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
            className="p-1 mx-0 border border-dark"
            style={{ width: "100%", height: "65%", backgroundColor: "#FFFFFF" }}
          >
            <DataGrid
              dataSource={playersData}
              showBorders={true}
              onExporting={(e) => {
                const workbook = new Workbook();
                const worksheet = workbook.addWorksheet("Main sheet");

                exportDataGrid({
                  component: e.component,
                  worksheet,
                  autoFilterEnabled: true,
                }).then(() => {
                  workbook.xlsx.writeBuffer().then((buffer) => {
                    saveAs(
                      new Blob([buffer], { type: "application/octet-stream" }),
                      "Data Grid Result.xlsx"
                    );
                  });
                });
                e.cancel = true;
              }}
              onSaved={(e) => {
                if (e.changes.length > 0) {
                  if (isHost && getInClassRoom) {
                    db.ref(
                      "gameSessions/" +
                        getPIN +
                        "/players/" +
                        e.changes[0].data.groupName
                    ).update({
                      parcelCorrectCount: e.changes[0].data.parcelCorrectCount,
                    });
                  }
                  // }
                  // }
                }
                e.cancel = true;
              }}
            >
              <Sorting mode="multiple" />
              <SearchPanel visible={true} highlightCaseSensitive={true} />
              <Editing mode="row" allowUpdating={true} />
              <Column
                dataField="groupName"
                caption="Group Name"
                allowEditing={false}
              />
              <Column
                dataField="deviceName"
                caption="Robot Name"
                allowEditing={false}
              />
              <Column
                dataField="isFinishedMission"
                caption="Finished"
                defaultSortOrder="desc"
                alignment="right"
                allowEditing={false}
              />
              <Column
                dataField="parcelCorrectCount"
                dataType="number"
                caption="Parcel Count"
                defaultSortOrder="desc"
                allowEditing={true}
              />
              <Column
                dataField="distanceSensorValue"
                dataType="number"
                caption="Distance (m.)"
                defaultSortOrder="asc"
                allowEditing={false}
              />
              <Column
                dataField="timeFinishedRecord"
                caption="Recorded Time"
                defaultSortOrder="asc"
                alignment="right"
                allowEditing={false}
              />
              <Export enabled={true} />
              <Pager visible={true} allowedPageSizes={5} />
              <Paging enabled={true} defaultPageSize={5} />
            </DataGrid>
          </Row>
        </Row>
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
                  The host of the room left.
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
                      if (getInClassRoom) {
                        if (isHost) {
                          db.ref("gameSessions/" + getPIN).remove();
                        } else {
                          db.ref(
                            "gameSessions/" +
                              getPIN +
                              "/players/" +
                              groupPlayerName
                          ).remove();
                        }
                      }
                      history.push("/");
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
                  The host of the room left. Thanks for playing!
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
                        if (getInClassRoom) {
                          if (isHost) {
                            db.ref("gameSessions/" + getPIN).remove();
                          } else {
                            db.ref(
                              "gameSessions/" +
                                getPIN +
                                "/players/" +
                                groupPlayerName
                            ).remove();
                          }
                        }
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
                      history.push("/");
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
