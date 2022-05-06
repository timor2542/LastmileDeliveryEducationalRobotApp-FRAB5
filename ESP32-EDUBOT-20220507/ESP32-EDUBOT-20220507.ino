/**
  ******************************************************************************
    @file           : ESP32-EDUBOT-20220507.ino
    @brief          : Main program body
  ******************************************************************************
*/

#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>


// Parameters
const long motor_power = 55000;      // 0-65535
long power_l = 0, power_r = 0;
const int motor_offsetL = 500, motor_offsetR = 500;       // Diff. when driving straight
const int wheel_d = 44;           // Wheel diameter (mm)
const float wheel_c = PI * wheel_d; // Wheel circumference (mm)
const int counts_per_rev = 860; // Pulse per revolution

// Pins
const int L293D_IN1 = 2;
const int L293D_IN2 = 4;
const int L293D_IN3 = 16;
const int L293D_IN4 = 17;

const int BUZZER_PIN = 15;

// Globals
const int encoderPin1Left = 26; //Encoder Output 'A' must connected with intreput pin of arduino.
const int encoderPin2Left = 25; //Encoder Otput 'B' must connected with intreput pin of arduino.
volatile int lastEncodedLeft = 0; // Here updated value of encoder store.

volatile long encoderValueLeft = 0; // Raw encoder value
volatile unsigned long encoderAbsValueLeft = 0; // Raw encoder value

const int encoderPin1Right = 33; //Encoder Output 'A' must connected with intreput pin of arduino.
const int encoderPin2Right = 32; //Encoder Otput 'B' must connected with intreput pin of arduino.
volatile int lastEncodedRight = 0; // Here updated value of encoder store.

volatile long encoderValueRight = 0; // Raw encoder value
volatile unsigned long encoderAbsValueRight = 0; // Raw encoder value

hw_timer_t *StrightDrivingControlTimer = NULL;

BLEServer* pServer = NULL;
BLECharacteristic* pEncoderSensorCharacteristic = NULL;
BLECharacteristic* pCommandCharacteristic = NULL;

#define BLE_NAME "EDUBOT-ORANGE"
#define MY_ESP32_SERVICE_UUID                 "818796aa-2f20-11ec-8d3d-0242ac130003"
#define ENCODER_SENSOR_CHARACTERISTIC_UUID  "818799c0-2f20-11ec-8d3d-0242ac130003"
#define COMMAND_CHARACTERISTIC_UUID    "81879be6-2f20-11ec-8d3d-0242ac130003"

void drive(int power_L, int power_R);
void blake();
void resetEncoderLeft();
void resetEncoderRight();
void sound(int freq, uint32_t time);
void updateEncoderLeft();
void updateEncoderLeftForward();
void updateEncoderLeftBackward();
void updateEncoderRight();
void updateEncoderRightForward();
void updateEncoderRightBackward();

bool STRIGHT_DIRECTION = false;
bool ROTATION_DIRECTION = false;
bool SPIN_LEFT_DIRECTION = false;
bool SPIN_RIGHT_DIRECTION = false;
bool BACKWARD_DIRECTION = false;
bool FORWARD_DIRECTION = false;

unsigned long lastUpdateNotify = 0;
//unsigned long lastUpdateNotify = 0;

// Sample number of encoder ticks
long num_ticks_l = 0;
long num_ticks_r = 0;

// Used to determine which way to turn to adjust
long diff_l = 0;
long diff_r = 0;


// Remember previous encoder counts
long enc_l_prev = 0;
long enc_r_prev = 0;

class MyCharactertisticCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCommandCharacteristic) {
      detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
      detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
      detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
      detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
      STRIGHT_DIRECTION = false;
      ROTATION_DIRECTION = false;
      SPIN_LEFT_DIRECTION = false;
      SPIN_RIGHT_DIRECTION = false;
      BACKWARD_DIRECTION = false;
      FORWARD_DIRECTION = false;
      std::string value = pCommandCharacteristic->getValue();
      if (value.length() == 1)
      {
        if (value[0] == 0x50)
        {

          blake();
          power_l = motor_power;
          power_r = motor_power;
          encoderValueLeft = 0;
          encoderValueRight = 0;
          enc_l_prev = 0;
          enc_r_prev = 0;
          num_ticks_l = 0;
          num_ticks_r = 0;
          diff_l = 0;
          diff_r = 0;
          attachInterrupt(digitalPinToInterrupt(encoderPin1Left), updateEncoderLeftForward, CHANGE);
          attachInterrupt(digitalPinToInterrupt(encoderPin2Left), updateEncoderLeftForward, CHANGE);
          attachInterrupt(digitalPinToInterrupt(encoderPin1Right), updateEncoderRightForward, CHANGE);
          attachInterrupt(digitalPinToInterrupt(encoderPin2Right), updateEncoderRightForward, CHANGE);
          STRIGHT_DIRECTION = true;
          ROTATION_DIRECTION = false;
          SPIN_LEFT_DIRECTION = false;
          SPIN_RIGHT_DIRECTION = false;
          BACKWARD_DIRECTION = false;
          FORWARD_DIRECTION = true;
        }
        else if (value[0] == 0x51)
        {

          blake();
          power_l = motor_power;
          power_r = motor_power;
          encoderValueLeft = 0;
          encoderValueRight = 0;
          enc_l_prev = 0;
          enc_r_prev = 0;
          num_ticks_l = 0;
          num_ticks_r = 0;
          diff_l = 0;
          diff_r = 0;
          attachInterrupt(digitalPinToInterrupt(encoderPin1Left), updateEncoderLeftBackward, CHANGE);
          attachInterrupt(digitalPinToInterrupt(encoderPin2Left), updateEncoderLeftBackward, CHANGE);
          attachInterrupt(digitalPinToInterrupt(encoderPin1Right), updateEncoderRightBackward, CHANGE);
          attachInterrupt(digitalPinToInterrupt(encoderPin2Right), updateEncoderRightBackward, CHANGE);
          STRIGHT_DIRECTION = true;
          ROTATION_DIRECTION = false;
          SPIN_LEFT_DIRECTION = false;
          SPIN_RIGHT_DIRECTION = false;
          BACKWARD_DIRECTION = true;
          FORWARD_DIRECTION = false;
        }
        else if (value[0] == 0x52)
        {
          blake();
          power_l = motor_power;
          power_r = motor_power;
          encoderValueLeft = 0;
          encoderValueRight = 0;
          enc_l_prev = 0;
          enc_r_prev = 0;
          num_ticks_l = 0;
          num_ticks_r = 0;
          diff_l = 0;
          diff_r = 0;
          detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
          STRIGHT_DIRECTION = false;
          ROTATION_DIRECTION = true;
          SPIN_LEFT_DIRECTION = true;
          SPIN_RIGHT_DIRECTION = false;
          BACKWARD_DIRECTION = false;
          FORWARD_DIRECTION = false;
        }
        else if (value[0] == 0x53)
        {
          blake();
          power_l = motor_power;
          power_r = motor_power;
          encoderValueLeft = 0;
          encoderValueRight = 0;
          enc_l_prev = 0;
          enc_r_prev = 0;
          num_ticks_l = 0;
          num_ticks_r = 0;
          diff_l = 0;
          diff_r = 0;
          detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
          STRIGHT_DIRECTION = false;
          ROTATION_DIRECTION = true;
          SPIN_LEFT_DIRECTION = false;
          SPIN_RIGHT_DIRECTION = true;
          BACKWARD_DIRECTION = false;
          FORWARD_DIRECTION = false;
        }
        else if (value[0] == 0x54)
        {

          blake();
          power_l = motor_power;
          power_r = motor_power;
          encoderValueLeft = 0;
          encoderValueRight = 0;
          enc_l_prev = 0;
          enc_r_prev = 0;
          num_ticks_l = 0;
          num_ticks_r = 0;
          diff_l = 0;
          diff_r = 0;
          attachInterrupt(digitalPinToInterrupt(encoderPin1Left), updateEncoderLeft, CHANGE);
          attachInterrupt(digitalPinToInterrupt(encoderPin2Left), updateEncoderLeft, CHANGE);
          attachInterrupt(digitalPinToInterrupt(encoderPin1Right), updateEncoderRight, CHANGE);
          attachInterrupt(digitalPinToInterrupt(encoderPin2Right), updateEncoderRight, CHANGE);
          STRIGHT_DIRECTION = false;
          ROTATION_DIRECTION = false;
          SPIN_LEFT_DIRECTION = false;
          SPIN_RIGHT_DIRECTION = false;
          BACKWARD_DIRECTION = false;
          FORWARD_DIRECTION = false;
          detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
        }
        else if (value[0] == 0x55)
        {
          blake();
          power_l = motor_power;
          power_r = motor_power;
          encoderValueLeft = 0;
          encoderValueRight = 0;
          enc_l_prev = 0;
          enc_r_prev = 0;
          num_ticks_l = 0;
          num_ticks_r = 0;
          diff_l = 0;
          diff_r = 0;
          detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
          STRIGHT_DIRECTION = false;
          ROTATION_DIRECTION = false;
          SPIN_LEFT_DIRECTION = false;
          SPIN_RIGHT_DIRECTION = false;
          BACKWARD_DIRECTION = false;
          FORWARD_DIRECTION = false;
        }
        else if (value[0] == 0x56)
        {
          blake();
          power_l = motor_power;
          power_r = motor_power;
          resetEncoderLeft();
          resetEncoderRight();
          enc_l_prev = 0;
          enc_r_prev = 0;
          num_ticks_l = 0;
          num_ticks_r = 0;
          diff_l = 0;
          diff_r = 0;
          detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
          STRIGHT_DIRECTION = false;
          ROTATION_DIRECTION = false;
          SPIN_LEFT_DIRECTION = false;
          SPIN_RIGHT_DIRECTION = false;
          BACKWARD_DIRECTION = false;
          FORWARD_DIRECTION = false;
        }
        else
        {

          blake();
          power_l = motor_power;
          power_r = motor_power;
          resetEncoderLeft();
          resetEncoderRight();
          enc_l_prev = 0;
          enc_r_prev = 0;
          num_ticks_l = 0;
          num_ticks_r = 0;
          diff_l = 0;
          diff_r = 0;
          detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
          detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
          detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
          STRIGHT_DIRECTION = false;
          ROTATION_DIRECTION = false;
          SPIN_LEFT_DIRECTION = false;
          SPIN_RIGHT_DIRECTION = false;
          BACKWARD_DIRECTION = false;
          FORWARD_DIRECTION = false;
        }
      }
      else
      {

        blake();
        power_l = motor_power;
        power_r = motor_power;
        resetEncoderLeft();
        resetEncoderRight();
          enc_l_prev = 0;
          enc_r_prev = 0;
        num_ticks_l = 0;
        num_ticks_r = 0;
        diff_l = 0;
        diff_r = 0;
        detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
        detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
        detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
        detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
        STRIGHT_DIRECTION = false;
        ROTATION_DIRECTION = false;
        SPIN_LEFT_DIRECTION = false;
        SPIN_RIGHT_DIRECTION = false;
        BACKWARD_DIRECTION = false;
        FORWARD_DIRECTION = false;
      }
    }
};
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer *pServer) {
      blake();
      STRIGHT_DIRECTION = false;
      ROTATION_DIRECTION = false;
      SPIN_LEFT_DIRECTION = false;
      SPIN_RIGHT_DIRECTION = false;
      BACKWARD_DIRECTION = false;
      FORWARD_DIRECTION = false;
      sound(1000, 100);
      sound(2000, 100);
      sound(3000, 100);
      sound(4000, 100);
      sound(5000, 100);
      sound(0, 0);
    }
    void onDisconnect(BLEServer *pServer) {
      blake();
      STRIGHT_DIRECTION = false;
      ROTATION_DIRECTION = false;
      SPIN_LEFT_DIRECTION = false;
      SPIN_RIGHT_DIRECTION = false;
      BACKWARD_DIRECTION = false;
      FORWARD_DIRECTION = false;
      sound(5000, 100);
      sound(4000, 100);
      sound(3000, 100);
      sound(2000, 100);
      sound(1000, 100);
      sound(0, 0);
      ESP.restart();
    }
};
void onStrightDrivingControlTimer() {
  if (STRIGHT_DIRECTION && !ROTATION_DIRECTION) {
    // Remember previous encoder counts
    num_ticks_l = encoderValueLeft;
    num_ticks_r = encoderValueRight;

    // Drive
    if (FORWARD_DIRECTION && !BACKWARD_DIRECTION) {

      drive(power_l, power_r);
    }
    else if (!FORWARD_DIRECTION && BACKWARD_DIRECTION) {
      drive(-power_l, -power_r);
    }
    // Number of ticks counted since last time
    diff_l = num_ticks_l - enc_l_prev;
    diff_r = num_ticks_r - enc_r_prev;

    // Store current tick counter for next time
    enc_l_prev = num_ticks_l;
    enc_r_prev = num_ticks_r;

//    // If left is faster, slow it down and speed up right
//    if ( diff_l > diff_r ) {
//      if (FORWARD_DIRECTION && !BACKWARD_DIRECTION) {
//        power_l -= motor_offsetL;
//        power_r += motor_offsetR;
//      }
//      else if (!FORWARD_DIRECTION && BACKWARD_DIRECTION) {
//        power_l += motor_offsetL;
//        power_r -= motor_offsetR;
//      }
//    }
//
//    // If right is faster, slow it down and speed up left
//    if ( diff_l < diff_r ) {
//      if (FORWARD_DIRECTION && !BACKWARD_DIRECTION) {
//        power_l += motor_offsetL;
//        power_r -= motor_offsetR;
//      }
//      else if (!FORWARD_DIRECTION && BACKWARD_DIRECTION) {
//        power_l -= motor_offsetL;
//        power_r += motor_offsetR;
//      }
//    }
  }
  else if (!STRIGHT_DIRECTION && ROTATION_DIRECTION) {
    if (SPIN_LEFT_DIRECTION && !SPIN_RIGHT_DIRECTION) {
      drive(-power_l, power_r);
    }
    else if (!SPIN_LEFT_DIRECTION && SPIN_RIGHT_DIRECTION) {
      drive(power_l, -power_r);
    }
  }
  else {
    blake();
  }
}
void startStrightDrivingControlTimer() {

  if (StrightDrivingControlTimer == NULL) {
    StrightDrivingControlTimer = timerBegin(0, 80, true);
    //Name = timerBegin(timerN, prescale, up/down);
    //count up (true) or down (false).
    //80 = prescale => 80 MHz/80 = 1,000,000 Hz
    //timerN = 0…3

    timerAttachInterrupt(StrightDrivingControlTimer, &onStrightDrivingControlTimer, true);
    //timerAttachInterrupt(timer?, ISR , bool edge);
    //edge: if it is true, an alarm will generate an edge type interrupt.
    //edge (true) or level (false)
  }

  timerAlarmWrite(StrightDrivingControlTimer, 100, true);
  //timerAlarmWrite(timer?, Sampling Time, bool autoreload);
  //Sampling Time=> 100us = 100/(80,000,000 MHz/prescale 80)
  //autoreload: if it is true, timer will repeat.

  timerAlarmEnable(StrightDrivingControlTimer); //Just Enable

}
void startStrightDrivingControlTimer2() {

  if (StrightDrivingControlTimer == NULL) {
    StrightDrivingControlTimer = timerBegin(0, 80, true);
    //Name = timerBegin(timerN, prescale, up/down);
    //count up (true) or down (false).
    //80 = prescale => 80 MHz/80 = 1,000,000 Hz
    //timerN = 0…3

    timerAttachInterrupt(StrightDrivingControlTimer, &onStrightDrivingControlTimer, true);
    //timerAttachInterrupt(timer?, ISR , bool edge);
    //edge: if it is true, an alarm will generate an edge type interrupt.
    //edge (true) or level (false)
  }

  timerAlarmWrite(StrightDrivingControlTimer, 100, true);
  //timerAlarmWrite(timer?, Sampling Time, bool autoreload);
  //Sampling Time=> 100us = 100/(80,000,000 MHz/prescale 80)
  //autoreload: if it is true, timer will repeat.

  timerAlarmEnable(StrightDrivingControlTimer); //Just Enable

}
void setup() {
  blake();
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


  ledcSetup(0, 500, 16);
  ledcSetup(1, 500, 16);
  ledcSetup(2, 500, 16);
  ledcSetup(3, 500, 16);

  ledcSetup(5, 5000, 8);

  ledcAttachPin(L293D_IN1, 0);
  ledcAttachPin(L293D_IN2, 1);
  ledcAttachPin(L293D_IN3, 2);
  ledcAttachPin(L293D_IN4, 3);

  ledcAttachPin(BUZZER_PIN, 4);


  sound(500, 100);
  sound(0, 0);

  blake();
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

  blake();
  resetEncoderLeft();
  resetEncoderRight();
  startStrightDrivingControlTimer();
}

void loop() {
  if (millis() - lastUpdateNotify >= 100)
  {
    lastUpdateNotify = millis();
    unsigned long linear_dist = (wheel_c * ((float)(floor((encoderAbsValueLeft+encoderAbsValueRight)/2)))) / ((float)counts_per_rev);
    pEncoderSensorCharacteristic->setValue((uint8_t*)&linear_dist, 4);
    pEncoderSensorCharacteristic->notify();

    Serial.print("linear_dist(mm): ");
    Serial.println(linear_dist);
    
    
    Serial.print("Pow_L: ");
    Serial.println(power_l);
        Serial.print("Pow_R: ");
    Serial.println(power_r);

    Serial.print("L: ");
    Serial.println(encoderValueLeft);

    Serial.print("R: ");
    Serial.println(encoderValueRight);

    Serial.print("Diff_L: ");
    Serial.println(diff_l);

    Serial.print("Diff_R: ");
    Serial.println(diff_r);
  }
}
void drive(long power_L, long power_R) {

  // Constrain power to between -255 and 255
  power_L = constrain(power_L, -65535, 65535);
  power_R = constrain(power_R, -65535, 65535);

  // Left motor direction
  if ( power_L < 0 ) {
    ledcWrite(0, 0);
    ledcWrite(1, abs(power_L));
  } else {
    ledcWrite(0, power_L);
    ledcWrite(1, 0);
  }

  // Right motor direction
  if ( power_R < 0 ) {
    ledcWrite(2, abs(power_R));
    ledcWrite(3, 0);
  } else {
    ledcWrite(2, 0);
    ledcWrite(3, power_R);
  }
}
void blake() {
  ledcWrite(0, 0);
  ledcWrite(1, 0);
  ledcWrite(2, 0);
  ledcWrite(3, 0);
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
    encoderAbsValueLeft ++;
  }
  else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
    encoderValueLeft --;
    encoderAbsValueLeft ++;
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
    encoderAbsValueRight ++;
  }
  else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
    encoderValueRight ++;
    encoderAbsValueRight ++;
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
  }
  else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
    encoderValueRight ++;
    
    encoderAbsValueRight ++;
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
    
    encoderAbsValueRight ++;
  }
  else if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) {
    encoderValueRight ++;
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
