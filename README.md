# Web.AR Explorer (Three.js & AR.js)

An interactive, premium augmented reality experience built using **Three.js** and **AR.js**. The application projects interactive 3D models onto a physical **Hiro Marker** tracked in real-time through your webcam. It features a futuristic, responsive glassmorphic HUD dashboard for adjusting models, scaling, color palettes, and animation speeds.

---

## 🚀 How to Run

Because webcams require a **secure context** (HTTPS or `localhost`), you cannot open `index.html` directly from your local filesystem (`file://`) in modern browsers. Doing so will block camera access.

You must serve the project files using a local development server.

### Option A: Using Node.js (Recommended)
If you have Node.js installed, run this command in your project directory:
```bash
npx -y http-server -p 8080
```
Then open your browser and navigate to: **`http://localhost:8080`**

### Option B: Using Python
If you have Python installed, run:
```bash
python -m http.server 8080
```
Then open your browser and navigate to: **`http://localhost:8080`**

---

## 📱 Running & Accessing on Other Devices (e.g. Mobile, Friends' Devices)

Because modern web browsers enforce **Secure Contexts (HTTPS)** for webcam access, simply opening `http://<your-local-ip>:8080` on another device (like your phone or a friend's device) will **block camera permissions**. 

To share and run this project on other devices, use one of the following methods to serve it over a secure HTTPS connection:

### Method 1: Using VS Code Port Forwarding (Easiest if using VS Code)
If you are using Visual Studio Code, you can expose your local server with built-in port forwarding:
1. Run your local server (using Node.js or Python as shown above on port `8080`).
2. Go to the **Ports** tab in VS Code (next to your Terminal).
3. Click **Forward a Port** and enter `8080`.
4. Right-click the forwarded port in the list, select **Port Visibility**, and set it to **Public**.
5. Copy the **Forwarded Address** (which will start with `https://...`).
6. Share this link with your friend or scan/open it on your phone!

### Method 2: Instant Public Tunneling (No installation needed)
You can create a temporary public HTTPS tunnel to your local server directly from your terminal.

*   **Option A: Using Pinggy (via SSH - no installation required)**
    While your local server is running on port `8080`, open a new terminal window and run:
    ```bash
    ssh -R 80:localhost:8080 a.pinggy.io
    ```
    This command will print a secure `https://...` link in your terminal. Copy and share it!

*   **Option B: Using Localtunnel (requires Node.js)**
    Open a new terminal window and run:
    ```bash
    npx localtunnel --port 8080
    ```
    Open the generated `https://...` link on your phone or share it with your friend.

### Method 3: Instant Deployment to Vercel (Free & Permanent)
Since this is a static website (HTML, CSS, JS), you can deploy it online for free in less than a minute. In your project directory, run:
```bash
npx vercel
```
1. Log in if prompted.
2. Confirm the project creation prompts (you can press Enter to accept all default settings).
3. Once completed, Vercel will give you a permanent, secure production URL (e.g. `https://your-project.vercel.app`) that anyone can open on any device!

---

## 🎯 How to Use the AR Space

1. **Enter AR Space**: Click the **ENTER AR SPACE** button on the splash screen and allow webcam/camera permissions when prompted.
2. **Retrieve the Hiro Marker**: 
   - Click **Show Hiro Marker** in the dashboard panel.
   - Scan the **QR Code** using your phone to open the marker image on your phone screen, or point your webcam directly at the marker on a second screen.
3. **Project & Interact**: Hold the Hiro marker in front of your camera. A 3D object will float and rotate right on top of it.
4. **Customize in Real-Time**:
   - Change geometry (Rotating Cube, Torus Knot, Glossy Sphere, Cyber Cylinder).
   - Alter colors using the HSL color palette.
   - Adjust the object's physical scale and rotation speed.

---

## 🛠️ Key Technical Modifications & Fixes

1. **Camera Zoom Adjustment**: 
   - Modified `animation.js` to scale the horizontal and vertical projection elements of the Three.js camera. By applying a `0.75x` factor, we successfully **zoomed out the camera** (widening the FOV), allowing the 3D model to be viewed fully without getting cropped close-up.
2. **AR.js Resize Handler Crash Fix**:
   - Resolved a critical console error in the window resize handler. Standard AR.js methods `onResizeElement()` and `copyElementSizeTo()` were corrected from the legacy `onResize()` and `copySizeTo()`, ensuring the camera view scales properly without throwing exceptions when resizing.

---

## 📦 Stack Details
- **Rendering Engine**: Three.js (r128)
- **AR Tracking**: AR.js (using `artoolkit` and `ar-threex`)
- **Styling**: Vanilla CSS with glassmorphism, responsive grids, and CSS animations.
