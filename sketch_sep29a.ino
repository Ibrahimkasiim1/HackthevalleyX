#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Nordic UART Service (NUS) UUIDs
#define NUS_SERVICE_UUID        "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define NUS_RX_CHAR_UUID        "6E400002-B5A3-F393-E0A9-E50E24DCCA9E" // phone -> ESP32 (Write/WriteNR)
#define NUS_TX_CHAR_UUID        "6E400003-B5A3-F393-E0A9-E50E24DCCA9E" // ESP32 -> phone (Notify)

BLECharacteristic *txChar;  // notify
BLECharacteristic *rxChar;  // write

class RxCallback: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) override {
    String value = pCharacteristic->getValue().c_str();  // make it Arduino String
    if (value.length() > 0) {
      Serial.print("[BLE RX] ");
      Serial.println(value);

      // Optional: echo back to phone
      txChar->setValue(value.c_str());  
      txChar->notify();
    }
  }

};

class ServerCallback: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    Serial.println("Phone connected");
  }
  void onDisconnect(BLEServer* pServer) override {
    Serial.println("Phone disconnected");
    // Restart advertising so you can reconnect
    pServer->getAdvertising()->start();
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Starting BLE UART...");

  BLEDevice::init("ESP32-UART"); // device name you’ll see on iPhone

  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallback());

  BLEService *service = server->createService(NUS_SERVICE_UUID);

  // TX: Notify (ESP32 -> phone)
  txChar = service->createCharacteristic(
    NUS_TX_CHAR_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  txChar->addDescriptor(new BLE2902()); // enables CCCD for notifications

  // RX: Write / Write Without Response (phone -> ESP32)
  rxChar = service->createCharacteristic(
    NUS_RX_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  rxChar->setCallbacks(new RxCallback());

  service->start();

  // Advertise as a connectable BLE peripheral with the UART service UUID
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(NUS_SERVICE_UUID);
  adv->setScanResponse(true);
  adv->setMinPreferred(0x06);  // optional: better iOS compatibility
  adv->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE UART advertising as 'ESP32-UART'");
}

void loop() {
  // Example: send a heartbeat to the phone every 5 seconds (if connected)
  static uint32_t lastMs = 0;
  if (millis() - lastMs > 5000) {
    lastMs = millis();
    const char* msg = "ESP32 heartbeat\n";
    txChar->setValue((uint8_t*)msg, strlen(msg));
    txChar->notify();
  }
}
