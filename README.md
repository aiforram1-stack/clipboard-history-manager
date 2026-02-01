# Clipboard History Manager

A **simple and powerful** clipboard tool for Mac and Windows.

It remembers everything you copy (text, links, code) so you never lose anything. It runs quietly in your menu bar.

![Clipboard Manager on macOS|600](assets/app-screenshot.png)

_Running on macOS with the Balenciaga-inspired minimalist dark theme._

---

## Features

- **Never Lose a Copy** - It automatically saves everything you copy.
- **Easy Access** - Just click the tray icon to see your history.
- **One-Click Copy** - Click any item to copy it again.
- **Search** - Find old clips instantly.
- **Privacy Focused** - Everything is saved on your computer, never sent to the cloud.

---

## How to Install and Run

This guide is for beginners. You will need a free tool called **Node.js** to run this app.

### Step 1: Install Node.js
If you don't have it, download and install the "LTS" version from:
[https://nodejs.org/](https://nodejs.org/)

### Step 2: Download the App
1. Click the green **Code** button at the top of this GitHub page.
2. Select **Download ZIP**.
3. Unzip the downloaded file.

### Step 3: Run the App
**On Mac:**
1. Open the **Terminal** app (Command + Space, type "Terminal").
2. Type `cd ` (with a space) and drag the unzipped folder into the terminal window. Press Enter.
3. Type `npm install` and press Enter. Wait for it to finish.
4. Type `npm start` and press Enter.

**On Windows:**
1. Open the unzipped folder.
2. Right-click inside the folder and select **Open in Terminal** (or Open PowerShell).
3. Type `npm install` and press Enter. Wait for it to finish.
4. Type `npm start` and press Enter.

The app will start! Look for the clipboard icon in your menu bar (Mac) or system tray (Windows).

## Building for Distribution

### macOS

```bash
npm run build:mac
```

Output: `dist/` folder containing `.dmg` and `.zip` files

### Windows

```bash
npm run build:win
```

Output: `dist/` folder containing installer and portable executable

---

## Usage

1. Launch the app
2. Copy any text from any application using Cmd+C (Mac) or Ctrl+C (Windows)
3. The copied text appears as a new tile in the app
4. Hover over a tile to reveal copy and delete buttons
5. Click the copy button to re-copy that text to your clipboard
6. Use the search bar to filter through your history
7. Click the trash icon to clear all history

The app runs in your system tray. Click the tray icon to show or hide the window.

---

## Project Structure

```
clipboard-history-manager/
├── main.js          # Electron main process, clipboard monitoring
├── preload.js       # Secure IPC bridge
├── index.html       # App UI layout
├── styles.css       # CSS styling
├── renderer.js      # Frontend logic
├── package.json     # Dependencies and scripts
└── assets/
    └── icon.png     # App icon
```

---

## Technical Details

- **Clipboard Monitoring**: Polls system clipboard every 500ms
- **Storage**: Uses electron-store for persistent local storage
- **Max History**: Stores up to 50 items (configurable)
- **Duplicate Handling**: Existing items are moved to top instead of creating duplicates

---

## License

MIT
