## Links
- **Devpost:** [https://devpost.com/software/navsense-jp2e7z](https://devpost.com/software/navsense-jp2e7z)  
- **Demo Video:** [https://www.youtube.com/watch?v=W1nBMJ7L99Q](https://www.youtube.com/watch?v=W1nBMJ7L99Q)

---

## Inspiration
Audio directions occupy hearing, and screens pull eyes from the path, both risky for people relying on those senses. Haptics turn navigation into touch, offering safe, screen-free wayfinding for blind or low-vision and Deaf or hard-of-hearing users. The goal: guidance through a sense that stays open in motion.

---

## What It Does
**NavSense** connects two smart gloves to a mobile app, sending turn cues as distinct vibration patterns via Bluetooth Low Energy. The app uses the **Google Maps Directions API** to parse steps and assign haptic patterns for left, right, forward, pause, and reroute.  
A **voice agent** powered by **ElevenLabs** and a **Gemini model** handles speech input, rerouting, and quick questions. The gloves include **USB-C charging**, **LED indicators**, and **ML-based siren detection** for safety alerts.

---

## Who It Helps
- **Blind / low-vision users:** Get tactile navigation without blocking hearing.  
- **Deaf / hard-of-hearing users:** Follow routes through vibration cues.  
- **Runners & cyclists:** Enjoy hands-free, distraction-free guidance.  

Supports **UN SDGs**: 3 (Health), 9 (Innovation), 10 (Inequality), 11 (Sustainable Cities).

---

## How We Built It
Built with **React Native (iOS)**, **ESP32** microcontrollers, **BLE**, **Google Maps API**, **ElevenLabs**, and **Gemini AI**.  
Custom 3D-printed enclosures, rechargeable **18650 battery + BMS**, and motor-LED circuits handle power, feedback, and communication.

---

## Accomplishments
- First-ever iOS + BLE project for our team.  
- Working haptic navigation gloves.  
- Voice-driven, AI-powered route control.  
- Promotes accessibility and independence.

---

## What’s Next
We plan to expand vibration patterns, add **live safety tracking**, refine glove comfort, and broaden NavSense to runners, cyclists, and other hands-free users.
