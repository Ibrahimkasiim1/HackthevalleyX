#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Nordic UART Service (NUS) UUIDs
#define NUS_SERVICE_UUID        "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define NUS_RX_CHAR_UUID        "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define NUS_TX_CHAR_UUID        "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

BLECharacteristic *txChar;  // notify
BLECharacteristic *rxChar;  // write

const int ledPin1 = 13;
const int ledPin2 = 14;

enum PatternType { NONE, FAST, REGULAR, CONTINUOUS };
PatternType currentPattern = NONE;

void stopAll() {
  digitalWrite(ledPin1, LOW);
  digitalWrite(ledPin2, LOW);
  currentPattern = NONE;
  Serial.println("Stopped all vibration patterns");
  txChar->setValue("Vibration stopped");
  txChar->notify();
}

class RxCallback: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) override {
    String value = pCharacteristic->getValue().c_str();
    if (value.length() > 0) {
      Serial.print("[BLE RX] ");
      Serial.println(value);

      char cmd = value.charAt(0);
      switch (cmd) {
        case 'F':
          currentPattern = FAST;
          Serial.println("Fast vibration pattern (continuous fast pulses)");
          txChar->setValue("Fast vibration");
          txChar->notify();
          break;
        case 'R':
          currentPattern = REGULAR;
          Serial.println("Regular vibration pattern (continuous regular pulses)");
          txChar->setValue("Regular vibration");
          txChar->notify();
          break;
        case 'C':
          currentPattern = CONTINUOUS;
          Serial.println("Continuous vibration (constant ON)");
          txChar->setValue("Continuous vibration");
          txChar->notify();
          break;
        case 'S':
          stopAll();
          break;
        default:
          Serial.println("Unknown command");
          txChar->setValue("Unknown command");
          txChar->notify();
          break;
      }
    }
  }
};


void applyPattern() {
  static unsigned long lastMillis = 0;
  static bool pinState = false;

  if (currentPattern == FAST) {
    unsigned long now = millis();
    if (now - lastMillis >= 60) {  // 60ms cycle
      pinState = !pinState;
      digitalWrite(ledPin1, pinState ? HIGH : LOW);
      digitalWrite(ledPin2, pinState ? HIGH : LOW);
      lastMillis = now;
    }
  } else if (currentPattern == REGULAR) {
    unsigned long now = millis();
    if (now - lastMillis >= 300) {  // 300ms cycle
      pinState = !pinState;
      digitalWrite(ledPin1, pinState ? HIGH : LOW);
      digitalWrite(ledPin2, pinState ? HIGH : LOW);
      lastMillis = now;
    }
  } else if (currentPattern == CONTINUOUS) {
    digitalWrite(ledPin1, HIGH);
    digitalWrite(ledPin2, HIGH);
  } else if (currentPattern == NONE) {
    digitalWrite(ledPin1, LOW);
    digitalWrite(ledPin2, LOW);
  }
}


class ServerCallback: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    Serial.println("Phone connected");
  }
  void onDisconnect(BLEServer* pServer) override {
    Serial.println("Phone disconnected");
    pServer->getAdvertising()->start();
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Starting BLE UART...");

  pinMode(ledPin1, OUTPUT);
  digitalWrite(ledPin1, LOW);
  pinMode(ledPin2, OUTPUT);
  digitalWrite(ledPin2, LOW);

  BLEDevice::init("ESP32-UART-1");
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallback());

  BLEService *service = server->createService(NUS_SERVICE_UUID);

  // TX: Notify (ESP32 -> phone)
  txChar = service->createCharacteristic(
    NUS_TX_CHAR_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  txChar->addDescriptor(new BLE2902());

  // RX: Write / Write Without Response (phone -> ESP32)
  rxChar = service->createCharacteristic(
    NUS_RX_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  rxChar->setCallbacks(new RxCallback());

  service->start();

  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(NUS_SERVICE_UUID);
  adv->setScanResponse(true);
  adv->setMinPreferred(0x06);
  adv->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE UART advertising as 'ESP32-UART'");
}

void loop() {
  static uint32_t lastMs = 0;
  applyPattern();
  static uint32_t lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 5000) {
    lastHeartbeat = millis();
    const char* msg = "ESP32 heartbeat\n";
    txChar->setValue((uint8_t*)msg, strlen(msg));
    txChar->notify();
  }
}
