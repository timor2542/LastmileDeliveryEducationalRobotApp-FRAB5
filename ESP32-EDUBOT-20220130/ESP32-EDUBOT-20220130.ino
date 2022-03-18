/**
  ******************************************************************************
    @file           : ESP32-EDUBOT-20220130.ino
    @brief          : Main program body
  ******************************************************************************
*/

#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

#include "EDUBOT_PID.h"
EDUBOT_PID pid;

#define L293D_IN1 2
#define L293D_IN2 4
#define L293D_IN3 16
#define L293D_IN4 17

#define BUZZER_PIN 15

unsigned long lastUpdateNotify = 0;

hw_timer_t *PIDSamplingTimer = NULL;
hw_timer_t *NotifyBLESamplingTimer = NULL;

#define PID_OUTPUT_MIN 100
BLEServer* pServer = NULL;
BLECharacteristic* pEncoderSensorCharacteristic = NULL;
BLECharacteristic* pCommandCharacteristic = NULL;

#define BLE_NAME "ESP32-EDUBOT3"
#define MY_ESP32_SERVICE_UUID                 "818796aa-2f20-11ec-8d3d-0242ac130003"
#define ENCODER_SENSOR_CHARACTERISTIC_UUID  "818799c0-2f20-11ec-8d3d-0242ac130003"
#define COMMAND_CHARACTERISTIC_UUID    "81879be6-2f20-11ec-8d3d-0242ac130003"

const int encoderPin1Left = 26; //Encoder Output 'A' must connected with intreput pin of arduino.
const int encoderPin2Left = 25; //Encoder Otput 'B' must connected with intreput pin of arduino.
volatile int lastEncodedLeft = 0; // Here updated value of encoder store.
//volatile int lastEncodedAbsLeft = 0; // Here updated value of encoder store.

volatile long encoderValueLeft = 0; // Raw encoder value
volatile unsigned long encoderAbsValueLeft = 0; // Raw encoder value

const int encoderPin1Right = 33; //Encoder Output 'A' must connected with intreput pin of arduino.
const int encoderPin2Right = 32; //Encoder Otput 'B' must connected with intreput pin of arduino.
volatile int lastEncodedRight = 0; // Here updated value of encoder store.
//volatile int lastEncodedAbsRight = 0; // Here updated value of encoder store.

volatile long encoderValueRight = 0; // Raw encoder value
volatile unsigned long encoderAbsValueRight = 0; // Raw encoder value

void fdL(uint16_t pwm1);
void bkL(uint16_t pwm1);
void fdR(uint16_t pwm2);
void bkR(uint16_t pwm2);
void sl(uint16_t pwm);
void sr(uint16_t pwm);
void ao();
void resetEncoderLeft();
void resetEncoderRight();
void sound(int freq, uint32_t time);

bool isRotatedDirection = false;

class MyCharactertisticCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCommandCharacteristic) {
      std::string value = pCommandCharacteristic->getValue();
      pid.off();
      if (value.length() == 1)
      {
        if (value[0] == 0x50)
        {
          pid.on();
          fdL(180);
          fdR(255);
        }
        else if (value[0] == 0x51)
        {

          pid.on();
          bkL(180);
          bkR(255);
        }
        else if (value[0] == 0x52)
        {

          pid.off();
          sl(255);
        }
        else if (value[0] == 0x53)
        {
          pid.off();
          sr(255);
        }
        else if (value[0] == 0x54)
        {

          pid.off();
          ao();

          pid.on();
        }
        else if (value[0] == 0x55)
        {

          pid.off();
          ao();

          pid.on();
        }
        else if (value[0] == 0x56)
        {

          pid.off();
          ao();
          resetEncoderLeft();
          resetEncoderRight();

          pid.on();
        }
        else
        {

          pid.off();
          ao();
        }
      }
      else
      {

        pid.off();
        ao();
      }
    }
};
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer *pServer) {
      ao();
      sound(1000, 100);
      sound(2000, 100);
      sound(3000, 100);
      sound(4000, 100);
      sound(5000, 100);
      sound(0, 0);
    }
    void onDisconnect(BLEServer *pServer) {
      ao();
      sound(5000, 100);
      sound(4000, 100);
      sound(3000, 100);
      sound(2000, 100);
      sound(1000, 100);
      sound(0, 0);
      ESP.restart();
    }
};
void IRAM_ATTR onPIDConrtolTimer() {
  if (pid.getInit()) {
    pid.setpoint(encoderValueLeft);   // Set the "goal" the PID controller tries to "reach"

    double outputSignal = pid.compute(encoderValueRight);       // PID compute the value and returns the optimal output
    if ((long)outputSignal > 0)
    {
      fdR(200); // Rotate the motor to counter clockwise
    }
    else
    {
      bkR(200);         // Rotate the motor to clockwise
    }
  }
}
void startPIDControlTimer() {

  if (PIDSamplingTimer == NULL) {
    PIDSamplingTimer = timerBegin(0, 80, true);
    //Name = timerBegin(timerN, prescale, up/down);
    //count up (true) or down (false).
    //80 = prescale => 80 MHz/80 = 1,000,000 Hz
    //timerN = 0…3

    timerAttachInterrupt(PIDSamplingTimer, &onPIDConrtolTimer, true);
    //timerAttachInterrupt(timer?, ISR , bool edge);
    //edge: if it is true, an alarm will generate an edge type interrupt.
    //edge (true) or level (false)
  }

  timerAlarmWrite(PIDSamplingTimer, 10000, true);
  //timerAlarmWrite(timer?, Sampling Time, bool autoreload);
  //Sampling Time=> 2 s = 2000000/(80,000,000 MHz/prescale 80)
  //autoreload: if it is true, timer will repeat.

  timerAlarmEnable(PIDSamplingTimer); //Just Enable

}
//void stopPIDControlTimer() {
//  if (PIDSamplingTimer != NULL) {
//    timerAlarmDisable(PIDSamplingTimer);
//    timerDetachInterrupt(PIDSamplingTimer);
//    timerEnd(PIDSamplingTimer);
//    PIDSamplingTimer = NULL;
//  }
//}
//void startNotifyBLETimer() {
//  if (NotifyBLESamplingTimer == NULL) {
//    NotifyBLESamplingTimer = timerBegin(1, 80, true);
//    //Name = timerBegin(timerN, prescale, up/down);
//    //count up (true) or down (false).
//    //80 = prescale => 80 MHz/80 = 1,000,000 Hz
//    //timerN = 0…3
//
//    timerAttachInterrupt(NotifyBLESamplingTimer, &onNotifyBLETimer, true);
//    //timerAttachInterrupt(timer?, ISR , bool edge);
//    //edge: if it is true, an alarm will generate an edge type interrupt.
//    //edge (true) or level (false)
//  }
//
//  timerAlarmWrite(NotifyBLESamplingTimer, 200000, true);
//  //timerAlarmWrite(timer?, Sampling Time, bool autoreload);
//  //Sampling Time=> 2 s = 2000000/(80,000,000 MHz/prescale 80)
//  //autoreload: if it is true, timer will repeat.
//
//  timerAlarmEnable(NotifyBLESamplingTimer); //Just Enable
//}
//void stopNotifyBLETimer() {
//  if (NotifyBLESamplingTimer != NULL) {
//    timerAlarmDisable(NotifyBLESamplingTimer);
//    timerDetachInterrupt(NotifyBLESamplingTimer);
//    timerEnd(NotifyBLESamplingTimer);
//    NotifyBLESamplingTimer = NULL;
//  }
//}
void setup() {
  //  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  Serial.begin(115200); //initialize serial comunication
  Serial.println("Ready.");
  pinMode(encoderPin1Left, INPUT_PULLUP);
  pinMode(encoderPin2Left, INPUT_PULLUP);
  pinMode(encoderPin1Right, INPUT_PULLUP);
  pinMode(encoderPin2Right, INPUT_PULLUP);

  digitalWrite(encoderPin1Left, HIGH); //turn pullup resistor on
  digitalWrite(encoderPin2Left, HIGH); //turn pullup resistor on
  digitalWrite(encoderPin1Right, HIGH); //turn pullup resistor on
  digitalWrite(encoderPin2Right, HIGH); //turn pullup resistor on


  ledcSetup(0, 500, 8);
  ledcSetup(1, 500, 8);
  ledcSetup(2, 500, 8);
  ledcSetup(3, 500, 8);

  ledcSetup(4, 5000, 8);

  ledcAttachPin(L293D_IN1, 0);
  ledcAttachPin(L293D_IN2, 1);
  ledcAttachPin(L293D_IN3, 2);
  ledcAttachPin(L293D_IN4, 3);

  ledcAttachPin(BUZZER_PIN, 4);


  sound(500, 100);
  sound(0, 0);

  ao();
  resetEncoderLeft();
  resetEncoderRight();

  BLEDevice::init(BLE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(MY_ESP32_SERVICE_UUID);
  pEncoderSensorCharacteristic = pService->createCharacteristic(
                                   ENCODER_SENSOR_CHARACTERISTIC_UUID,
                                   BLECharacteristic::PROPERTY_READ |
                                   BLECharacteristic::PROPERTY_NOTIFY
                                 );
  pCommandCharacteristic = pService->createCharacteristic(
                             COMMAND_CHARACTERISTIC_UUID,
                             BLECharacteristic::PROPERTY_WRITE
                           );
  pCommandCharacteristic->setCallbacks(new MyCharactertisticCallbacks());
  pEncoderSensorCharacteristic->addDescriptor(new BLE2902());
  pCommandCharacteristic->addDescriptor(new BLE2902());

  pService->start();

  BLEAdvertising *pAdvertising = pServer->getAdvertising();
  pAdvertising->start();

  sound(2000, 100);
  sound(0, 0);

  ao();
  resetEncoderLeft();
  resetEncoderRight();


  pid.begin();               // Initialize the PID instance
  pid.tune(20, 1, 5000);     // Tune the PID, arguments: kP, kI, kD (Fine tune for better responses)
  pid.limit(-255, 255);      // Limit the PID output between 0 and 255, this is important to get rid of integral windup!



  attachInterrupt(digitalPinToInterrupt(encoderPin1Left), updateEncoderLeft, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Left), updateEncoderLeft, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin1Right), updateEncoderRight, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Right), updateEncoderRight, CHANGE);

  startPIDControlTimer();
  pid.off();
}

void loop() {
  if (millis() - lastUpdateNotify >= 100)
  {
    lastUpdateNotify = millis();
    pEncoderSensorCharacteristic->setValue((uint8_t*)&encoderAbsValueLeft, 4);
    pEncoderSensorCharacteristic->notify();
  }
}
void fdL(uint16_t pwm1) {
  attachInterrupt(digitalPinToInterrupt(encoderPin1Left), updateEncoderLeftForward, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Left), updateEncoderLeftForward, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin1Right), updateEncoderRightForward, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Right), updateEncoderRightForward, CHANGE);
  //  pid.on();
  if (pwm1 >= 0 && pwm1 <= 255)
  {
    ledcWrite(0, pwm1);
    ledcWrite(1, 0);
  }
  else {
    ledcWrite(0, 0);
    ledcWrite(1, 0);
  }
}
void bkL(uint16_t pwm1) {
  attachInterrupt(digitalPinToInterrupt(encoderPin1Left), updateEncoderLeftBackward, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Left), updateEncoderLeftBackward, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin1Right), updateEncoderRightBackward, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Right), updateEncoderRightBackward, CHANGE);
  //  pid.on();
  if (pwm1 >= 0 && pwm1 <= 255)
  {
    ledcWrite(0, 0);
    ledcWrite(1, pwm1);
  }
  else {
    ledcWrite(0, 0);
    ledcWrite(1, 0);
  }

}
void fdR(uint16_t pwm2) {
  if (pwm2 >= 0 && pwm2 <= 255)
  {
    ledcWrite(2, 0);
    ledcWrite(3, pwm2);
  }
  else {
    ledcWrite(2, 0);
    ledcWrite(3, 0);
  }
}
void bkR(uint16_t pwm2) {
  if (pwm2 >= 0 && pwm2 <= 255)
  {
    ledcWrite(2, pwm2);
    ledcWrite(3, 0);
  }
  else {
    ledcWrite(2, 0);
    ledcWrite(3, 0);
  }
}
void sl(uint16_t pwm) {
  //  pid.off();
  detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
  if (pwm >= 0 && pwm <= 255)
  {
    ledcWrite(0, 0);
    ledcWrite(1, pwm);
    ledcWrite(2, 0);
    ledcWrite(3, pwm);
  }
  else {
    ledcWrite(0, 0);
    ledcWrite(1, 0);
    ledcWrite(2, 0);
    ledcWrite(3, 0);
  }

}
void sr(uint16_t pwm) {
  //  pid.off();
  detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
  if (pwm >= 0 && pwm <= 255)
  {
    ledcWrite(0, pwm);
    ledcWrite(1, 0);
    ledcWrite(2, pwm);
    ledcWrite(3, 0);
  }
  else {
    ledcWrite(0, 0);
    ledcWrite(1, 0);
    ledcWrite(2, 0);
    ledcWrite(3, 0);
  }
}
void ao() {
  //  stopPIDControlTimer();
  detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
  ledcWrite(0, 0);
  ledcWrite(1, 0);
  ledcWrite(2, 0);
  ledcWrite(3, 0);
  attachInterrupt(digitalPinToInterrupt(encoderPin1Left), updateEncoderLeft, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Left), updateEncoderLeft, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin1Right), updateEncoderRight, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Right), updateEncoderRight, CHANGE);
}
void sound(int freq, uint32_t time) {
  ledcWriteTone(4, freq);
  delay(time);
}

void updateEncoderLeft() {
  int MSB = digitalRead(encoderPin1Left); //MSB = most significant bit
  int LSB = digitalRead(encoderPin2Left); //LSB = least significant bit

  int encoded = (MSB << 1) | LSB; //converting the 2 pin value to single number
  int sum  = (lastEncodedLeft << 2) | encoded; //adding it to the previous encoded value

  if (sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) {
    encoderValueLeft ++;
  }
  else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
    encoderValueLeft --;
  }

  lastEncodedLeft = encoded; //store this value for next time

}
void updateEncoderLeftForward() {
  int MSB = digitalRead(encoderPin1Left); //MSB = most significant bit
  int LSB = digitalRead(encoderPin2Left); //LSB = least significant bit

  int encoded = (MSB << 1) | LSB; //converting the 2 pin value to single number
  int sum  = (lastEncodedLeft << 2) | encoded; //adding it to the previous encoded value

  if (sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) {
    encoderValueLeft ++;
    encoderAbsValueLeft ++;
  }
  else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
    encoderValueLeft --;
  }
  lastEncodedLeft = encoded; //store this value for next time

}
void updateEncoderLeftBackward() {
  int MSB = digitalRead(encoderPin1Left); //MSB = most significant bit
  int LSB = digitalRead(encoderPin2Left); //LSB = least significant bit

  int encoded = (MSB << 1) | LSB; //converting the 2 pin value to single number
  int sum  = (lastEncodedLeft << 2) | encoded; //adding it to the previous encoded value

  if (sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) {
    encoderValueLeft ++;
  }
  else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
    encoderValueLeft --;
    encoderAbsValueLeft ++;
  }
  lastEncodedLeft = encoded; //store this value for next time

}
void updateEncoderRight() {
  int MSB = digitalRead(encoderPin1Right); //MSB = most significant bit
  int LSB = digitalRead(encoderPin2Right); //LSB = least significant bit

  int encoded = (MSB << 1) | LSB; //converting the 2 pin value to single number
  int sum  = (lastEncodedRight << 2) | encoded; //adding it to the previous encoded value

  if (sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) {
    encoderValueRight --;
  }
  else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
    encoderValueRight ++;
  }

  lastEncodedRight = encoded; //store this value for next time

}
void updateEncoderRightForward() {
  int MSB = digitalRead(encoderPin1Right); //MSB = most significant bit
  int LSB = digitalRead(encoderPin2Right); //LSB = least significant bit

  int encoded = (MSB << 1) | LSB; //converting the 2 pin value to single number
  int sum  = (lastEncodedRight << 2) | encoded; //adding it to the previous encoded value

  if (sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) {
    encoderValueRight --;
    encoderAbsValueRight ++;
  }
  else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
    encoderValueRight ++;
  }
  lastEncodedRight = encoded; //store this value for next time

}
void updateEncoderRightBackward() {
  int MSB = digitalRead(encoderPin1Right); //MSB = most significant bit
  int LSB = digitalRead(encoderPin2Right); //LSB = least significant bit

  int encoded = (MSB << 1) | LSB; //converting the 2 pin value to single number
  int sum  = (lastEncodedRight << 2) | encoded; //adding it to the previous encoded value

  if (sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) {
    encoderValueRight --;
  }
  else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
    encoderValueRight ++;
    encoderAbsValueRight ++;
  }

  lastEncodedRight = encoded; //store this value for next time

}
void resetEncoderLeft() {
  encoderValueLeft = 0;
  encoderAbsValueLeft = 0;
}
void resetEncoderRight() {
  encoderValueRight = 0;
  encoderAbsValueRight = 0;
}
