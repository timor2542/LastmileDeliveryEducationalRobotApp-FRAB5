import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Button, Col, Row, Form } from "react-bootstrap";
import { useMediaQuery } from "react-responsive";

import { forwardRef } from 'react';

import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import RateReviewIcon from '@material-ui/icons/RateReview';

import MaterialTable from 'material-table';

import { AiOutlineMenu } from "react-icons/ai";
import { FaWeight, FaLink, FaHome, FaUsers } from "react-icons/fa";
import { GiExitDoor, GiStopSign } from "react-icons/gi";
import {
  ImArrowDown,
  ImArrowLeft,
  ImArrowRight,
  ImArrowUp,
} from "react-icons/im";
import {
  MdBluetooth,
  MdOutlineBluetoothDisabled,
  MdOutlineControlCamera,
} from "react-icons/md";
import { RiPinDistanceFill } from "react-icons/ri";
import { SiProbot } from "react-icons/si";
import { MdPin, MdOutlineTimer } from "react-icons/md";
import { db } from "../Firebase/Firebase";
import get from "../universalHTTPRequests/get";
let bluetoothDevice = null;
let weightSensorCharacteristic = null;
let distanceEncoderSensorCharacteristic = null;
let commandCharacteristic = null;

let startTime = 0;
let elapsedTime = 0;
let intervalId = null;

export default function Multiplayer() {
  /* CALL HISTORY BEGIN */
  const history = useHistory();

  const tableIcons = {
    Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
    Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
    Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
    DetailPanel: forwardRef((props, ref) => (
        <ChevronRight {...props} ref={ref} />
    )),
    Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
    Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
    Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
    FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
    LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
    NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    PreviousPage: forwardRef((props, ref) => (
        <ChevronLeft {...props} ref={ref} />
    )),
    ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
    SortArrow: forwardRef((props, ref) => (
        <ArrowDownward {...props} ref={ref} />
    )),
    ThirdStateCheck: forwardRef((props, ref) => (
        <Remove {...props} ref={ref} />
    )),
    ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />),
    RateReview: forwardRef((props, ref) => (
        <RateReviewIcon {...props} ref={ref} />
    )),
};
  async function onBackButtonEvent(event) {
    event.preventDefault();
    // your logic
    // window.alert("You go back")
    if (getInClassRoom) {
      if (isHost) {
        db.ref("gameSessions/" + getPIN).remove();
      } else {
        db.ref(
          "gameSessions/" + getPIN + "/players/" + groupPlayerName
        ).remove();
      }
    }
    await disconnectToBluetoothDeviceImmediately();
    setFSMPage("MULTIPLAYER_MODE_LOADINGPAGE");
    history.push("/multiplayer");
  }
  const onExituttonEvent = async () => {
    // event.preventDefault();
    // your logic
    await disconnectToBluetoothDeviceImmediately();
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
  const onBeforeUnload = async (event) => {
    // the method that will be used for both add and remove event
    event.preventDefault();
    let confirmationMessage = "";
    /* Do you small action code here */
    (event || window.event).returnValue = confirmationMessage; //Gecko + IE
    await disconnectToBluetoothDeviceImmediately();
    return confirmationMessage;
  };
  const afterUnload = async () => {
    // event.preventDefault();
    await disconnectToBluetoothDeviceImmediately();
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
  };

  // useEffect(() => {
  //   return () => {
  //   };
  // });
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

  const [FSMPage, setFSMPage] = useState(
    "MULTIPLAYER_MODE_HOMEPAGE"
  );
  // MULTIPLAYER_MODE_PLAYER_CONTROLPANEL_PAGE
  // MULTIPLAYER_MODE_HOMEPAGE
  // MULTIPLAYER_MODE_HOST_CONTROLPANEL_PAGE

  /* DELAY/SLEEP FUNCTION TOPICS RELATED CODE BEGIN */

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* DELAY/SLEEP FUNCTION TOPICS RELATED CODE END */

  /* BLUETOOTH TOPICS RELATED CODE BEGIN */

  const stability_delay = 150;

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

      // ////console.log("Connecting to GATT Server...");

      const server = await bluetoothDevice.gatt.connect();

      // ////console.log("Getting Service...");
      const service = await server.getPrimaryService(myESP32ServiceUUID);

      // ////console.log("Getting Characteristic...");
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
      // ////console.log("> Notifications started");
      weightSensorCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleWeightSensorNotifications
      );
      distanceEncoderSensorCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleDistanceEncoderSensorNotifications
      );
      setBluetoothDeviceName(bluetoothDevice.name);

      // console.log(bluetoothDevice.name);
      db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update({
        deviceName: bluetoothDevice.name,
      });
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
      db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update({
        deviceName: "Not connected",
        distanceSensorValue: parseFloat((0).toFixed(1)),
        weightSensorValue: parseInt(0),
      });
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
      // sendCommand(0x56);
      // resetAllValue();

      setWeightSensorValue(0);
      setDistanceEncoderSensorValue((0).toFixed(1));

      // await bluetoothDevice.gatt.disconnect();

      weightSensorCharacteristic = null;
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      if (!gotAlreadyHostLeftDetected) {
        db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update(
          {
            deviceName: "Not connected",
            distanceSensorValue: parseFloat((0).toFixed(1)),
            weightSensorValue: parseInt(0),
          }
        );
      }
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
      if (!gotAlreadyHostLeftDetected) {
        db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update(
          {
            deviceName: "Not connected",
            distanceSensorValue: parseFloat((0).toFixed(1)),
            weightSensorValue: parseInt(0),
          }
        );
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
      // sendCommand(0x56);
      // resetAllValue();

      setWeightSensorValue(0);
      setDistanceEncoderSensorValue((0).toFixed(1));

      // await bluetoothDevice.gatt.disconnect();

      weightSensorCharacteristic = null;
      distanceEncoderSensorCharacteristic = null;
      commandCharacteristic = null;
      bluetoothDevice = null;
      setBluetoothDeviceName("Not connected");
      // if (!gotAlreadyHostLeftDetected) {
      //   db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update(
      //     {
      //       deviceName: "Not connected",
      //       distanceSensorValue: parseFloat((0).toFixed(1)),
      //       weightSensorValue: parseInt(0),
      //     }
      //   );
      // }
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
      // if (!gotAlreadyHostLeftDetected) {
      //   db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update(
      //     {
      //       deviceName: "Not connected",
      //       distanceSensorValue: parseFloat((0).toFixed(1)),
      //       weightSensorValue: parseInt(0),
      //     }
      //   );
      // }
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
      if (getInClassRoom) {
        db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update(
          {
            weightSensorValue: parseInt(result),
          }
        );
      }
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
      if (getInClassRoom) {
        db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).update(
          {
            distanceSensorValue: parseFloat(
              (((4.4 * Math.PI) / 4185) * result).toFixed(1)
            ),
          }
        );
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

    // setWeightSensorValue(0);
    setDistanceEncoderSensorValue((0).toFixed(1));

    await sendCommand(0x56);

    setIsUpButtonPressed(false);
    setIsDownButtonPressed(false);
    setIsLeftButtonPressed(false);
    setIsRightButtonPressed(false);
    setIsStopButtonPressed(false);
  }

  /* BLUETOOTH TOPICS RELATED CODE END */

  /* BLUETOOTH TOPICS RELATED CODE BEGIN */

  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });

  /* BLUETOOTH TOPICS RELATED CODE BEGIN */

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
        db.ref("gameSessions/" + getPIN + "/players/" + groupPlayerName).set({
          groupName: groupPlayerName,
          deviceName: "Not connected",
          distanceSensorValue: parseFloat((0).toFixed(1)),
          weightSensorValue: parseInt(0),
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
        db.ref("gameSessions/" + generatedPin.toString()).set({
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
    setTimeIsPaused(true);
    startTime = Date.now();
    //run setInterval() and save id
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
    }, 1);
  }
  function stopStopwatch() {
    setTimeIsPaused(false);
    elapsedTime += Date.now() - startTime;
    clearInterval(intervalId);
  }

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
            let leaderboardArray = Object.entries(data.players).map((data) => data[1]);
            leaderboardArray = leaderboardArray.map((data) => {
              return {
                ...data,
              }
            })
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
  if (gotStart) {
    if (!gotAlreadyStart) {
      setGotAlreadyStart(true);
      // console.log("Start");
      startStopwatch();
    }
    setGotStart(false);
  }
  if (gotStop) {
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
    }
    setGotReset(false);
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
  // }

  if (isPortrait) {
    if (isBluetoothConnected && bluetoothDeviceName !== "Not connected") {
      sendCommand(stopCommand);
    }
  }

  /* PORTRAIT RELATED CODE END */
  // console.log(isBluetoothConnected);
  // const [finishStatus, setFinishStatus] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line
    history.block(async () => {
      // console.disableYellowBox = true;
      // console.log("Go back.")
      if (getInClassRoom) {
        if (isHost) {
          db.ref("gameSessions/" + getPIN).remove();
        } else {
          db.ref(
            "gameSessions/" + getPIN + "/players/" + groupPlayerName
          ).remove();
        }
      }
    });
  });

  /* FINITE STATE MACHINE PAGE CODE BEGIN */

  if (FSMPage === "MULTIPLAYER_MODE_HOMEPAGE") {
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
                  className="p7 p-bold p-1 mx-0 "
                  style={{ height: "70%", backgroundColor: "#E7E6E1" }}
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
                      style={{ height: "20%" }}
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
                    <Row
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
                    </Row>
                  </Col>
                </Row>
                <Row
                  className="p4 text-align-center p-1 mx-0"
                  style={{ height: "10%" }}
                  xs={12}
                >
                  © {new Date().getFullYear()} FRAB5 Thesis.
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
                  className="p7 p-bold p-1 mx-0 "
                  style={{ height: "70%", backgroundColor: "#E7E6E1" }}
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
                      className="p4 text-align-center"
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
                  © {new Date().getFullYear()} FRAB5 Thesis.
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
                  className="p7 p-bold p-1 mx-0 "
                  style={{ height: "70%", backgroundColor: "#E7E6E1" }}
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
                  © {new Date().getFullYear()} FRAB5 Thesis.
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
                  Multiplayer - Player Mode
                  <hr />
                  Pincode:{" "}
                  <center>
                    <b>{getPIN}</b>
                  </center>
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
                              !gameStarted
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
                              !gameStarted
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
                              isDirectionButtonReleased ||
                              !gameStarted
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
                              isDirectionButtonReleased ||
                              !gameStarted
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
                              !gameStarted
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
                  <FaUsers />
                  Group Name
                </Row>
                <Row
                  className="p3 text-align-center p-1 mx-0 border border-dark"
                  style={{ height: "35%", backgroundColor: "#FFF8F0" }}
                >
                  {groupPlayerName}
                </Row>
              </Col>
              <Col style={{ backgroundColor: "#FFFFFF" }} xs={3}>
                <Row
                  className="p text-align-center text-white p-1 mx-0"
                  style={{ height: "15%", backgroundColor: "#000000" }}
                >
                  <MdOutlineTimer />
                  Stopwatch Timer
                </Row>
                <Row
                  className="p6 text-align-center p-1 mx-0 border border-dark"
                  style={{ height: "15%", backgroundColor: "#FFF8F0" }}
                >
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
                <Row
                  className="p text-align-center text-white p-1 mx-0"
                  style={{ height: "15%", backgroundColor: "#000000" }}
                >
                  <FaLink />
                  Connectivity
                </Row>
                <Row
                  className="p2 text-align-center p-1 mx-0 border border-dark"
                  style={{ height: "25%", backgroundColor: "#FFF8F0" }}
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
                        // isDownButtonPressed ||
                        // isRightButtonPressed ||
                        // isLeftButtonPressed ||
                        // isUpButtonPressed ||
                        // isStopButtonPressed ||
                        // isDirectionButtonReleased ||
                        gameStarted
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
                        // isDownButtonPressed ||
                        // isRightButtonPressed ||
                        // isLeftButtonPressed ||
                        // isUpButtonPressed ||
                        // isStopButtonPressed ||
                        // isDirectionButtonReleased ||
                        gameStarted
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
                  style={{ height: "15%", backgroundColor: "#FFF8F0" }}
                >
                  <Row
                    className="p2 text-align-center p-1 mx-0"
                    style={{ height: "100%", backgroundColor: "#FFF8F0" }}
                  >
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={async () => {
                        await sendCommand(restartCommand);
                        await onExituttonEvent();
                      }}
                      disabled={
                        // isDownButtonPressed ||
                        // isRightButtonPressed ||
                        // isLeftButtonPressed ||
                        // isUpButtonPressed ||
                        // isStopButtonPressed ||
                        // isDirectionButtonReleased ||
                        gameStarted
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
  } else if (FSMPage === "MULTIPLAYER_MODE_HOST_CONTROLPANEL_PAGE") {
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
                          if (getInClassRoom) {
                            db.ref("gameSessions/" + getPIN).update({
                              gameAlreadyStarted: true,
                              gameStarted: true,
                              timeIsActived: true,
                              timeIsPaused: false,
                            });
                          }
                          startStopwatch();
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
                        onClick={() => {
                          if (getInClassRoom) {
                            db.ref("gameSessions/" + getPIN).update({
                              gameAlreadyStarted: true,
                              gameStarted: true,
                              timeIsActived: false,
                              timeIsPaused: true,
                            });
                          }
                          stopStopwatch();
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
                        onClick={() => {
                          if (getInClassRoom) {
                            db.ref("gameSessions/" + getPIN).update({
                              gameAlreadyStarted: true,
                              gameStarted: false,
                              timeIsActived: false,
                              timeIsPaused: false,
                            });
                          }
                          resetStopwatch();
                        }}
                        disabled={!(timeIsActive || timeIsPaused)}
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
                          onExituttonEvent();
                        }}
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
              style={{ height: "65%", backgroundColor: "#D3DEDC" }}
            >
              <MaterialTable
              icons={tableIcons}
                title= {roomHostName + "'s Players Detail"}
                columns={[
                  { title: "Group Name", field: "groupName" },
                  { title: "Robot Name", field: "deviceName" },
                  { title: "Weight (kg.)", field: "weightSensorValue", type: "numeric" },
                  { title: "Distance (cm.)", field: "distanceSensorValue", type: "numeric" },
                ]}
                data={playersData}
                options={{
                  exportButton: true,
                  rowStyle: {
                    fontSize: 16,
                  },
                }}
              />
            </Row>
          </Row>
        )}
      </div>
    );
  } else if (FSMPage === "MULTIPLAYER_MODE_LOADINGPAGE") {
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
                  className="loadinglogo p-3 mx-0"
                  style={{ height: "60%", backgroundColor: "#FFFFFF" }}
                ></Row>
                <Row
                  className="p text-align-center p-1 mx-0"
                  style={{ height: "20%" }}
                  xs={12}
                >
                  © {new Date().getFullYear()} FRAB5 Thesis.
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
                  The game of this room has already started.
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
