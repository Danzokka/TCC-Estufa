#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include "CONFIG.h"

class SERVER
{
    private :
        const char* ssid = "Dantas_2.4G";
        const char* password = "29281917";
        const char* server = "http://localhost:3000";
        const char* endpoint = "/data";
    public :
        SERVER();
        bool begin();
        void send(String data);
};

extern SERVER server;

