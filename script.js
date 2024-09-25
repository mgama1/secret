const asciiToBinary = (message) => {
    return message.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
};

const binaryToAscii = (binaryStr) => {
    return binaryStr.match(/.{1,8}/g).map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
};

const replaceLSB = (byte, bit) => {
    return (byte & ~1) | bit;
};

const getEOMIndex = (binaryMsg) => {
    const eomBinary = asciiToBinary('\eom');
    const index = binaryMsg.indexOf(eomBinary);
    return index === -1 ? false : index;
};

document.getElementById('encodeButton').addEventListener('click', () => {
    const fileInput = document.getElementById('imageInput');
    const message = document.getElementById('message').value + '\eom'; // Add end of message tag

    if (!fileInput.files.length || !message) {
        alert("Please upload an image and enter a message.");
        return;
    }

    const image = new Image();
    const reader = new FileReader();
    reader.onload = function (event) {
        image.src = event.target.result;
        image.onload = () => {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const binaryMsg = asciiToBinary(message);
            let msgIndex = 0;

            for (let i = 0; i < imgData.data.length && msgIndex < binaryMsg.length; i += 4) {
                // Modify the red channel only (imgData.data[i] corresponds to the red value)
                imgData.data[i] = replaceLSB(imgData.data[i], parseInt(binaryMsg[msgIndex]));
                msgIndex++;
            }

            ctx.putImageData(imgData, 0, 0);
            const encodedImage = canvas.toDataURL();
            document.getElementById('resultImage').src = encodedImage;
        };
    };
    reader.readAsDataURL(fileInput.files[0]);
});

document.getElementById('decodeButton').addEventListener('click', () => {
    const fileInput = document.getElementById('imageInput');
    if (!fileInput.files.length) {
        alert("Please upload an image.");
        return;
    }

    const image = new Image();
    const reader = new FileReader();
    reader.onload = function (event) {
        image.src = event.target.result;
        image.onload = () => {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;

            // Use requestAnimationFrame to ensure image is drawn before decoding
            requestAnimationFrame(() => {
                ctx.drawImage(image, 0, 0);

                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let binaryMsg = '';

                for (let i = 0; i < imgData.data.length; i += 4) {
                    binaryMsg += (imgData.data[i] & 1).toString(); // Extract LSB from red channel
                    if (i % 32 === 0) {
                        const eom = getEOMIndex(binaryMsg);
                        if (eom) break;
                    }
                }

                const decodedMsg = binaryToAscii(binaryMsg);
                const eomIndex = getEOMIndex(binaryMsg);
                if (eomIndex !== false) {
                    document.getElementById('decodedMessage').innerText = decodedMsg.slice(0, eomIndex / 8);
                } else {
                    document.getElementById('decodedMessage').innerText = "No message found.";
                }
            });
        };
    };
    reader.readAsDataURL(fileInput.files[0]);
});
