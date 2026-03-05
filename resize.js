const { Jimp } = require('jimp');
const path = require('path');

async function run() {
    try {
        const inputPath = path.join(__dirname, 'public', 'Logo Nodin app cropped.png');
        const outputPath = path.join(__dirname, 'public', 'Logo Nodin app resized.png');

        const image = await Jimp.read(inputPath);

        // Force resize to 256x256 for electron builder
        image.resize({ w: 256, h: 256 });

        await image.write(outputPath);
        console.log('Resized successfully.');
    } catch (err) {
        console.error('Error resizing image:', err);
    }
}

run();
