#include "EDUBOT_PID.h"

EDUBOT_PID::EDUBOT_PID () {
  // Variables - double
  double output;
  double lastErr;
  double errSum;

  // Variables - long
  unsigned long lastTime;

  // Variables - bool
  bool doConstrain;
  bool init;

  // Variables - double - tuining
  double Kp;
  double Ki;
  double Kd;
  double divisor;
  double minOut;
  double maxOut;
  double setPoint;
}

void EDUBOT_PID::begin () {
  Kp = 1;
  Ki = 1;
  Kd = 1;
  divisor = 10;
  doLimit = false;
  init = true;
}

void EDUBOT_PID::setpoint (double newSetpoint) {
  setPoint = newSetpoint;
}

void EDUBOT_PID::tune (double _Kp, double _Ki, double _Kd) {
  if (_Kp < 0 || _Ki < 0 || _Kd < 0) return;
  Kp = _Kp;
  Ki = _Ki;
  Kd = _Kd;
}

void EDUBOT_PID::limit(double min, double max) {
  minOut = min;
  maxOut = max;
  doLimit = true;
}

void EDUBOT_PID::printGraph (double sensorInput, String verbose) {
  Serial.print(sensorInput);
  if (verbose == VERBOSE) {
    Serial.print(",");
    Serial.print(output);
  }
  Serial.print(",");
  Serial.println(setPoint);
}


void EDUBOT_PID::minimize (double newMinimize) {
  divisor = newMinimize;
}

// Getters
double EDUBOT_PID::getOutput () {
  return output;
}


double EDUBOT_PID::compute (double sensor, String graph, String verbose) {
  // Return false if it could not execute;
  // This is the actual PID algorithm executed every loop();

  // Failsafe, return if the begin() method hasn't been called
  if (!init) return 0;

  // Calculate time difference since last time executed
  unsigned long now = millis();
  double timeChange = (double)(now - lastTime);

  // Calculate error (P, I and D)
  double error = setPoint - sensor;
  errSum += error * timeChange;
  if (doLimit) {
    errSum = constrain(errSum, minOut * 1.1, maxOut * 1.1); 
  }
  double dErr = (error - lastErr) / timeChange;

  // Calculate the new output by adding all three elements together
  double newOutput = (Kp * error + Ki * errSum + Kd * dErr) / divisor;

  // If limit is specifyed, limit the output
  if (doLimit) {
    output = constrain(newOutput, minOut, maxOut);
  } else {
    output = newOutput;  
  }

  // Update lastErr and lastTime to current values for use in next execution
  lastErr = error;
  lastTime = now;

  // Draw the garph if GRAPH mode
  if (graph == GRAPH) {
    printGraph(sensor, verbose);
  }

  // Return the current output
  return output;
}
bool EDUBOT_PID::getInit(){
  return init;
}
void EDUBOT_PID::on(){
  init = true;
}
void EDUBOT_PID::off(){
  init = false;
}
