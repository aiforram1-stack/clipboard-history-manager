const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 512,
        height: 512,
        show: false,
        frame: false,
        transparent: true,
        webPreferences: {
            offscreen: true
        }
    });

    await win.loadFile(path.join(__dirname, 'icon-template.html'));

    // Wait a bit for rendering
    setTimeout(async () => {
        try {
            const image = await win.capturePage();
            const buffer = image.toPNG();
            fs.writeFileSync(path.join(__dirname, '../assets/icon.png'), buffer);
            console.log('Icon generated successfully');
            app.quit();
        } catch (err) {
            console.error('Failed to generate icon:', err);
            app.exit(1);
        }
    }, 1000);
});
