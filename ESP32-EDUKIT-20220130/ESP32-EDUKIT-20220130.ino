/*
    Based on Neil Kolban example for IDF: https://github.com/nkolban/esp32-snippets/blob/master/cpp_utils/tests/BLE%20Tests/SampleWrite.cpp
    Ported to Arduino ESP32 by Evandro Copercini
    // See the following for generating UUIDs:
  // https://www.uuidgenerator.net/
*/
/*
   navigator.bluetooth.requestDevice({

    filters: [{
        name: 'ESP32'
      }],
      optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e',
      '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
      '6e400003-b5a3-f393-e0a9-e50e24dcca9e']
    }).
*/
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

const unsigned long UPDATE_INTERVAL_MS = 1000;
unsigned long lastUpdate = 0;

// variable for storing the potentiometer value

BLEServer* pServer = NULL;
BLECharacteristic* pWeightSensorCharacteristic = NULL;
BLECharacteristic* pEncoderSensorCharacteristic = NULL;
BLECharacteristic* pMotorActuatorCharacteristic = NULL;

#define BLE_NAME "ESP32-EDUKIT1" //must match filters name in bluetoothterminal.js- navigator.bluetooth.requestDevice
#define MY_ESP32_SERVICE_UUID                 "818796aa-2f20-11ec-8d3d-0242ac130003" //- must match optional services on navigator.bluetooth.requestDevice
#define WEIGHT_SENSOR_CHARACTERISTIC_UUID     "818798d0-2f20-11ec-8d3d-0242ac130003" //- must match optional services on navigator.bluetooth.requestDevice
#define ENCODER_L_SENSOR_CHARACTERISTIC_UUID  "818799c0-2f20-11ec-8d3d-0242ac130003" //- must match optional services on navigator.bluetooth.requestDevice
#define ENCODER_R_SENSOR_CHARACTERISTIC_UUID  "81879a7e-2f20-11ec-8d3d-0242ac130003" //- must match optional services on navigator.bluetooth.requestDevice
#define MOTOR_ACTUATOR_CHARACTERISTIC_UUID    "81879be6-2f20-11ec-8d3d-0242ac130003" //- must match optional services on navigator.bluetooth.requestDevice

#define pinEncoder35 35
#define BUZZER_PIN 27

#define DIR1PIN 13
//#define PWM1PIN 23
#define DIR2PIN 26
//#define PWM2PIN 22

uint16_t weight_value = 0;
uint16_t encoder_value = 0;

static volatile unsigned int encCnt35;
static volatile bool __attachedINT35 = false;

void enc35Changed()
{
  encCnt35++;
}

void resetEnc35()
{
  encCnt35 = 0;
}

unsigned int readEnc35()
{
  return encCnt35;
}

void encoder_reset(int channel)
{
  switch (channel)
  {
    case 35: encCnt35 = 0; break;
  }
}
unsigned int encoder(int channel)
{
  switch (channel)
  {
    case 35: if (!__attachedINT35)
      {
        __attachedINT35 = true;
        // encoder INT0
        encCnt35 = 0; // Clear slot counter
        pinMode(pinEncoder35, INPUT_PULLUP);
        attachInterrupt(35, enc35Changed, CHANGE);
        // end encoder
      }
      return encCnt35;
      break;
  }
}
void encoder(int channel, int preloadValue)
{
  switch (channel)
  {
    case 35: if (!__attachedINT35)
      {
        __attachedINT35 = true;
        // encoder INT0
        pinMode(pinEncoder35, INPUT_PULLUP);
        attachInterrupt(35, enc35Changed, CHANGE);
        // end encoder
      }
      encCnt35 = preloadValue; // Clear slot counter
      break;
  }
}

void move_forward();
void move_backward();
void spin_left();
void spin_right();
void stop_moving();
void sound(int freq, uint32_t time);
bool _reset = false;
uint8_t Round = 0;

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pMotorActuatorCharacteristic) {
      std::string value = pMotorActuatorCharacteristic->getValue();
      if (value.length() == 1)
      {
        if (value[0] == 0x50)
        {
          move_forward();
        }
        else if (value[0] == 0x51)
        {
          move_backward();
        }
        else if (value[0] == 0x52)
        {
          spin_left();
        }
        else if (value[0] == 0x53)
        {
          spin_right();
        }
        else if (value[0] == 0x54)
        {
          stop_moving();
        }
        else if (value[0] == 0x55)
        {
          //          delay(3000);
          stop_moving();
          resetEnc35();
          _reset = true;
        }
        else if (value[0] == 0x56)
        {
          //          delay(3000);
          stop_moving();
          resetEnc35();
        }
        else
        {
          stop_moving();
        }
      }
      else
      {
        stop_moving();
      }
    }
};

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer *pServer){
        digitalWrite(2, HIGH);
        stop_moving();
        sound(1000, 100);
        sound(2000, 100);
        sound(3000, 100);
        sound(4000, 100);
        sound(5000, 100);
        sound(0, 0);
  }
  void onDisconnect(BLEServer *pServer){
        digitalWrite(2, LOW);
        stop_moving();
        sound(5000, 100);
        sound(4000, 100);
        sound(3000, 100);
        sound(2000, 100);
        sound(1000, 100);
        sound(0, 0);
        ESP.restart();
  }
};
void setup() {
  pinMode(2, OUTPUT);
  pinMode(DIR1PIN, OUTPUT);
  pinMode(DIR2PIN, OUTPUT);
  ledcSetup(4, 2000, 8);
  ledcAttachPin(BUZZER_PIN, 4);
  //  ledcSetup(0, 100, 12);
  //  ledcSetup(1, 100, 12);
  //  ledcAttachPin(PWM1PIN, 0);
  //  ledcAttachPin(PWM2PIN, 1);
  pinMode(25, INPUT_PULLUP);
  attachInterrupt(25, resetEnc35, RISING);
  stop_moving();
  Serial.begin(115200);

  BLEDevice::init(BLE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(MY_ESP32_SERVICE_UUID);
  pWeightSensorCharacteristic = pService->createCharacteristic(
                                  WEIGHT_SENSOR_CHARACTERISTIC_UUID,
                                  BLECharacteristic::PROPERTY_READ |
                                  BLECharacteristic::PROPERTY_NOTIFY
                                );
  pEncoderSensorCharacteristic = pService->createCharacteristic(
                                   ENCODER_L_SENSOR_CHARACTERISTIC_UUID,
                                   BLECharacteristic::PROPERTY_READ |
                                   BLECharacteristic::PROPERTY_NOTIFY
                                 );
  pMotorActuatorCharacteristic = pService->createCharacteristic(
                                   MOTOR_ACTUATOR_CHARACTERISTIC_UUID,
                                   BLECharacteristic::PROPERTY_WRITE
                                 );
  pMotorActuatorCharacteristic->setCallbacks(new MyCallbacks());
  //
  pWeightSensorCharacteristic->addDescriptor(new BLE2902());
  pEncoderSensorCharacteristic->addDescriptor(new BLE2902());
  pMotorActuatorCharacteristic->addDescriptor(new BLE2902());
  //
  pService->start();
  //
  BLEAdvertising *pAdvertising = pServer->getAdvertising();
  pAdvertising->start();
}

void loop() {
  // put your main code here, to run repeatedly:
  if (millis() - lastUpdate >= UPDATE_INTERVAL_MS)
  {
    lastUpdate = millis();

    weight_value = map(analogRead(34), 0, 4095, 0, 1000);
    encoder_value = encoder(35);

    Serial.println("Weight value: ");
    Serial.println(weight_value);
    Serial.println();

    Serial.println("Encoder value: ");
    Serial.println(encoder_value);
    Serial.println();

    pWeightSensorCharacteristic->setValue((uint8_t*)&weight_value, 2);
    pEncoderSensorCharacteristic->setValue((uint8_t*)&encoder_value, 2);

    pWeightSensorCharacteristic->notify();
    pEncoderSensorCharacteristic->notify();
  }
}
void move_forward()
{
  digitalWrite(DIR1PIN, HIGH);
  digitalWrite(DIR2PIN, HIGH);
  //  ledcWrite(0, 2047);
  //  ledcWrite(1, 2047);
}
void move_backward()
{
  digitalWrite(DIR1PIN, HIGH);
  digitalWrite(DIR2PIN, HIGH);
  //  ledcWrite(0, 2047);
  //  ledcWrite(1, 2047);
}
void spin_left()
{
  digitalWrite(DIR1PIN, HIGH);
  digitalWrite(DIR2PIN, LOW);
  //  ledcWrite(0, 2047);
  //  ledcWrite(1, 2047);
}
void spin_right()
{
  digitalWrite(DIR1PIN, LOW);
  digitalWrite(DIR2PIN, HIGH);
  //  ledcWrite(0, 2047);
  //  ledcWrite(1, 2047);
}
void stop_moving()
{
  digitalWrite(DIR1PIN, LOW);
  digitalWrite(DIR2PIN, LOW);
}
void sound(int freq, uint32_t time) {
  ledcWriteTone(4, freq);
  delay(time);
  //  ledcWriteTone(4, 0);
}
