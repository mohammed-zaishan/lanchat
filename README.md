# LAN Chat – Local Network Messenger + File Sharing
A modern, real-time LAN messaging app built with **Node.js**, **Socket.IO**, and a modern Material-inspired UI.  
Chat with any device on your local network, share files instantly, create groups, and discover online devices — all without internet access.

---

## Features

### Real-time Messaging
- Instant message delivery via Socket.IO  
- Public chat (General)  
- Private direct messages  
- Group conversations  

### File Sharing
- Upload files with full progress bar  
- Supports large files  
- Auto-broadcast file metadata to other devices  

### LAN Device Discovery
- See all devices connected on the LAN  
- Detect when devices join/leave  
- Device-specific avatars  
- Your device shown as initials in the header  

### Dark & Light Mode
- Material-style theme system  
- One-click toggle  
- Saves preference locally  

### Modern UI
- Full-height responsive layout (Slack-inspired)  
- Clean sidebar  
- Material icons  
- Smooth animations and transitions  

---

## Tech Stack

- **Node.js** – Backend server  
- **Express.js** – Static file hosting  
- **Socket.IO** – Real-time communication  
- **Multer** – File upload handler  
- **Bonjour/mDNS** (optional) – Pretty LAN hostname  
- **HTML + CSS + Vanilla JS** – Frontend  
- **Material Icons** – Iconography  

## Installation & Setup

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/lan-chat.git
cd lan-chat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
node server.js
```

Visit: 
Since running on port 80, you can change the port number in server.js
```
http://localhost
```

---

## Accessing From Other Devices on the Same Network

You can access the chat from ANY phone, tablet, PC, or laptop on the same Wi-Fi.

---

### **Pretty Hostname Using mDNS (Recommended)**

Allows you to open:

```
http://lanchat.local
```

#### Windows  
Install **Bonjour** (from iTunes or mDNSResponder toolkit).

#### macOS / Linux / iOS / Android  
mDNS works automatically.

---

## Project Structure

```
/public
    index.html
    styles.css
    app.js

/uploads
    <uploaded files>

server.js
README.md
```

---

## Development Tips

Use nodemon for auto-reload:

```bash
npm install -g nodemon
nodemon server.js
```

## Roadmap

Upcoming features:

- Typing indicators  
- Unread message counters  
- UDP-based device auto-discovery  
- Encrypted mode  
- Chat history persistence  
- PWA installable mode  
- Electron desktop packaging  

---

## Contributing

Contributions are welcome!

### How to contribute:
1. Fork the repo  
2. Create a feature branch  
3. Commit changes  
4. Open a pull request  

### Guidelines:
- Stick to Material-style UI  
- Avoid heavy dependencies  
- Keep code clean & modular  
- Test on at least one mobile device before submitting  

---

## License

Released under the **MIT License**.  
You are free to use, modify, and distribute this project.

---

## Support

If you find this useful:

- Star the repo  
- Report issues  
- Suggest new features  

Built with ❤️ for offline-first, local-first communication.
