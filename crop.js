const { Jimp } = require('jimp');
const path = require('path');

async function run() {
    try {
        const inputPath = path.join(__dirname, 'public', 'Logo Nodin app.png');
        const outputPath = path.join(__dirname, 'public', 'Logo Nodin app cropped.png');

        const image = await Jimp.read(inputPath);
        image.autocrop();
        await image.write(outputPath);
        console.log('Cropped successfully.');
    } catch (err) {
        console.error('Error cropping image:', err);
    }
}

run();
