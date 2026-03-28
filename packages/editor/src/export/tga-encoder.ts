export function encodeTGA(imageData: ImageData): Uint8Array {
	const { width, height, data } = imageData;
	const headerSize = 18;
	const pixelCount = width * height;
	const buffer = new Uint8Array(headerSize + pixelCount * 4);

	buffer[0] = 0;
	buffer[1] = 0;
	buffer[2] = 2;
	buffer[8] = 0;
	buffer[9] = 0;
	buffer[10] = 0;
	buffer[11] = 0;
	buffer[12] = width & 0xff;
	buffer[13] = (width >> 8) & 0xff;
	buffer[14] = height & 0xff;
	buffer[15] = (height >> 8) & 0xff;
	buffer[16] = 32;
	buffer[17] = 8;

	let offset = headerSize;
	for (let y = height - 1; y >= 0; y--) {
		for (let x = 0; x < width; x++) {
			const srcIdx = (y * width + x) * 4;
			buffer[offset++] = data[srcIdx + 2]; // B
			buffer[offset++] = data[srcIdx + 1]; // G
			buffer[offset++] = data[srcIdx]; // R
			buffer[offset++] = data[srcIdx + 3]; // A
		}
	}

	return buffer;
}
