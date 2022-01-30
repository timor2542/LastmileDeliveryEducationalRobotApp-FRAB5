#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

#define L293D_IN1 2
#define L293D_IN2 4
#define L293D_IN3 16
#define L293D_IN4 17

#define BUZZER_PIN 15

const unsigned long UPDATE_INTERVAL_MS = 1000;
unsigned long lastUpdate = 0;

bool _reset = false;
//bool _ack_connected = false;
uint8_t Round = 0;
//uint8_t Round2 = 0;

BLEServer* pServer = NULL;
BLECharacteristic* pWeightSensorCharacteristic = NULL;
BLECharacteristic* pEncoderSensorCharacteristic = NULL;
BLECharacteristic* pCommandCharacteristic = NULL;

#define BLE_NAME "ESP32-EDUBOT1" //must match filters name in bluetoothterminal.js- navigator.bluetooth.requestDevice
#define MY_ESP32_SERVICE_UUID                 "818796aa-2f20-11ec-8d3d-0242ac130003" //- must match optional services on navigator.bluetooth.requestDevice
#define WEIGHT_SENSOR_CHARACTERISTIC_UUID     "818798d0-2f20-11ec-8d3d-0242ac130003" //- must match optional services on navigator.bluetooth.requestDevice
#define ENCODER_SENSOR_CHARACTERISTIC_UUID  "818799c0-2f20-11ec-8d3d-0242ac130003" //- must match optional services on navigator.bluetooth.requestDevice
#define COMMAND_CHARACTERISTIC_UUID    "81879be6-2f20-11ec-8d3d-0242ac130003" //- must match optional services on navigator.bluetooth.requestDevice

volatile long weightValue = 0;

const int encoderPin1Left = 26; //Encoder Output 'A' must connected with intreput pin of arduino.
const int encoderPin2Left = 25; //Encoder Otput 'B' must connected with intreput pin of arduino.
volatile int lastEncodedLeft = 0; // Here updated value of encoder store.
volatile long encoderValueLeft = 0; // Raw encoder value
volatile long lastencoderValueLeft = 0; // Raw encoder value

const int encoderPin1Right = 33; //Encoder Output 'A' must connected with intreput pin of arduino.
const int encoderPin2Right = 32; //Encoder Otput 'B' must connected with intreput pin of arduino.
volatile int lastEncodedRight = 0; // Here updated value of encoder store.
volatile long encoderValueRight = 0; // Raw encoder value
volatile long lastencoderValueRight = 0; // Raw encoder value

void fd(uint16_t pwm1, uint16_t pwm2);
void bk(uint16_t pwm1, uint16_t pwm2);
void sl(uint16_t pwm);
void sr(uint16_t pwm);
void ao();
void resetEncoderLeft();
void resetEncoderRight();

bool isRotatedDirection = false;

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCommandCharacteristic) {
      std::string value = pCommandCharacteristic->getValue();

      if (value.length() == 1)
      {
        if (value[0] == 0x50)
        {
          fd(10000, 11000);
        }
        else if (value[0] == 0x51)
        {
            bk(10000, 10000);
        }
        else if (value[0] == 0x52)
        {
          sl(10000);
        }
        else if (value[0] == 0x53)
        {
          sr(10000);
        }
        else if (value[0] == 0x54)
        {
          ao();
        }
        else if (value[0] == 0x55)
        {
          ao();
          resetEncoderLeft();
          resetEncoderRight();
          _reset = true;
        }
        else if (value[0] == 0x56)
        {
          ao();
          resetEncoderLeft();
          resetEncoderRight();
        }
        else
        {
          ao();
        }
      }
      else
      {
        ao();
      }
    }

};

void setup() {

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


  ledcSetup(0, 500, 15);
  ledcSetup(1, 500, 15);
  ledcSetup(2, 500, 15);
  ledcSetup(3, 500, 15);

  ledcSetup(4, 2000, 8);

  ledcAttachPin(L293D_IN1, 0);
  ledcAttachPin(L293D_IN2, 1);
  ledcAttachPin(L293D_IN3, 2);
  ledcAttachPin(L293D_IN4, 3);

  ledcAttachPin(BUZZER_PIN, 4);


  sound(500, 100);
  sound(0, 0);

  ao();

  BLEDevice::init(BLE_NAME);
  pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(MY_ESP32_SERVICE_UUID);
  pWeightSensorCharacteristic = pService->createCharacteristic(
                                  WEIGHT_SENSOR_CHARACTERISTIC_UUID,
                                  BLECharacteristic::PROPERTY_READ |
                                  BLECharacteristic::PROPERTY_NOTIFY
                                );
  pEncoderSensorCharacteristic = pService->createCharacteristic(
                                   ENCODER_SENSOR_CHARACTERISTIC_UUID,
                                   BLECharacteristic::PROPERTY_READ |
                                   BLECharacteristic::PROPERTY_NOTIFY
                                 );
  pCommandCharacteristic = pService->createCharacteristic(
                             COMMAND_CHARACTERISTIC_UUID,
                             BLECharacteristic::PROPERTY_WRITE
                           );
  pCommandCharacteristic->setCallbacks(new MyCallbacks());
  //
  pWeightSensorCharacteristic->addDescriptor(new BLE2902());
  pEncoderSensorCharacteristic->addDescriptor(new BLE2902());
  pCommandCharacteristic->addDescriptor(new BLE2902());
  //
  pService->start();
  //
  BLEAdvertising *pAdvertising = pServer->getAdvertising();
  pAdvertising->start();

  sound(2000, 100);
  sound(0, 0);
}

void loop() {
  // put your main code here, to run repeatedly:
  if (millis() - lastUpdate >= UPDATE_INTERVAL_MS)
  {
    lastUpdate = millis();


    weightValue = random(0, 1000);

    //    Serial.println("Weight value: ");
    //    Serial.println(weightValue);
    //    Serial.println();
    //
    //    Serial.println("Encoder value: ");
    //    Serial.println(encoderValueLeft);
    //    Serial.println();
    //    Serial.println(P.c_str());
    pWeightSensorCharacteristic->setValue((uint8_t*)&weightValue, 4);
    pEncoderSensorCharacteristic->setValue((uint8_t*)&encoderValueLeft, 4);

    pWeightSensorCharacteristic->notify();
    pEncoderSensorCharacteristic->notify();
//    if (_ack_connected)
//    {
//      if (Round2 == 2) {
//        Serial.println("Connected!");
//        _ack_connected = false;
//        Round2 = 0;
//        sound(0, 0);
//        }
//      else {
//        sound(1000 * Round, 0);
//        Round2++;
//      }
//    }
    if (_reset)
    {
      if (Round == 3) {
        Serial.println("Restarting...");
        digitalWrite(2, LOW);
        _reset = false;
        Round = 0;
        ESP.restart();
      }
      else {
        Serial.println("Reset is on...");
        digitalWrite(2, HIGH);
        sound(1000 * Round, 0);
        Round++;
      }
    }
  }
}
void fd(uint16_t pwm1, uint16_t pwm2) {
  isRotatedDirection = false;
  attachInterrupt(digitalPinToInterrupt(encoderPin1Left), updateEncoderLeft, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Left), updateEncoderLeft, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin1Right), updateEncoderRight, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Right), updateEncoderRight, CHANGE);
//  long p = 0;
//  if (pow >= 0 && pow <= 100)
  if(pwm1 >= 0 && pwm1 <= 32767 && pwm2 >= 0 && pwm2 <= 32767)
  {
//    p = ((long)pow * 4095) / 100;
    ledcWrite(0, 0);
//    ledcWrite(1, (int)p);
//    ledcWrite(2, (int)p);
    ledcWrite(1, pwm1);
    ledcWrite(2, pwm2);
    ledcWrite(3, 0);
  }
  else {
    ledcWrite(0, 0);
    ledcWrite(1, 0);
    ledcWrite(2, 0);
    ledcWrite(3, 0);
  }
}
void bk(uint16_t pwm1, uint16_t pwm2) {
  isRotatedDirection = false;
  attachInterrupt(digitalPinToInterrupt(encoderPin1Left), updateEncoderLeft, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Left), updateEncoderLeft, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin1Right), updateEncoderRight, CHANGE);
  attachInterrupt(digitalPinToInterrupt(encoderPin2Right), updateEncoderRight, CHANGE);
//  long p = 0;
//  if (pow >= 0 && pow <= 100)
  if(pwm1 >= 0 && pwm1 <= 32767 && pwm2 >= 0 && pwm2 <= 32767)
  {
//    p = ((long)pow * 4095) / 100;
//    ledcWrite(0, (int)p);
    ledcWrite(0, pwm1);
    ledcWrite(1, 0);
    ledcWrite(2, 0);
//    ledcWrite(3, (int)p);
    ledcWrite(3, pwm2);
  }
  else {
    ledcWrite(0, 0);
    ledcWrite(1, 0);
    ledcWrite(2, 0);
    ledcWrite(3, 0);
  }

}
void sl(uint16_t pwm) {
  isRotatedDirection = true;
  detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
//  long p = 0;
//  if (pow >= 0 && pow <= 100)
  if(pwm >= 0 && pwm <= 32767)
  {
//    p = ((long)pow * 4095) / 100;
//    ledcWrite(0, (int)p);
    ledcWrite(0, pwm);
    ledcWrite(1, 0);
//    ledcWrite(2, (int)p);
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
void sr(uint16_t pwm) {
  isRotatedDirection = true;
  detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
//  long p = 0;
//  if (pow >= 0 && pow <= 100)
  if(pwm >= 0 && pwm <= 32767)
  {
//    p = ((long)pow * 4095) / 100;
    ledcWrite(0, 0);
//    ledcWrite(1, (int)p);
    ledcWrite(1, pwm);
    ledcWrite(2, 0);
//    ledcWrite(3, (int)p);
    ledcWrite(3, pwm);
  }
  else {
    ledcWrite(0, 0);
    ledcWrite(1, 0);
    ledcWrite(2, 0);
    ledcWrite(3, 0);
  }
}
void ao() {
  if (!isRotatedDirection) {
    attachInterrupt(digitalPinToInterrupt(encoderPin1Left), updateEncoderLeft, CHANGE);
    attachInterrupt(digitalPinToInterrupt(encoderPin2Left), updateEncoderLeft, CHANGE);
    attachInterrupt(digitalPinToInterrupt(encoderPin1Right), updateEncoderRight, CHANGE);
    attachInterrupt(digitalPinToInterrupt(encoderPin2Right), updateEncoderRight, CHANGE);
  }
  else {
    isRotatedDirection = false;
  }
  ledcWrite(0, 0);
  ledcWrite(1, 0);
  ledcWrite(2, 0);
  ledcWrite(3, 0);
  detachInterrupt(digitalPinToInterrupt(encoderPin1Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Left));
  detachInterrupt(digitalPinToInterrupt(encoderPin1Right));
  detachInterrupt(digitalPinToInterrupt(encoderPin2Right));
}
void sound(int freq, uint32_t time) {
  ledcWriteTone(4, freq);
  delay(time);
  //  ledcWriteTone(4, 0);
}

void updateEncoderLeft() {
  int MSB = digitalRead(encoderPin1Left); //MSB = most significant bit
  int LSB = digitalRead(encoderPin2Left); //LSB = least significant bit

  int encoded = (MSB << 1) | LSB; //converting the 2 pin value to single number
  int sum  = (lastEncodedLeft << 2) | encoded; //adding it to the previous encoded value

  if (sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) encoderValueLeft --;
  if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) encoderValueLeft ++;

  lastEncodedLeft = encoded; //store this value for next time

}
void updateEncoderRight() {
  int MSB = digitalRead(encoderPin1Right); //MSB = most significant bit
  int LSB = digitalRead(encoderPin2Right); //LSB = least significant bit

  int encoded = (MSB << 1) | LSB; //converting the 2 pin value to single number
  int sum  = (lastEncodedRight << 2) | encoded; //adding it to the previous encoded value

  if (sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) encoderValueRight ++;
  if (sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) encoderValueRight --;

  lastEncodedRight = encoded; //store this value for next time

}
void resetEncoderLeft() {
  encoderValueLeft = 0;
}
void resetEncoderRight() {
  encoderValueRight = 0;
}
