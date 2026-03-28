export function dilateSeams(imageData: ImageData, radius: number): ImageData {
	const { width, height } = imageData;
	const src = new Uint8ClampedArray(imageData.data);
	const dst = new Uint8ClampedArray(imageData.data);

	for (let iter = 0; iter < radius; iter++) {
		src.set(dst);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const idx = (y * width + x) * 4;
				if (dst[idx + 3] > 0) continue;

				const neighbors = [
					[x - 1, y],
					[x + 1, y],
					[x, y - 1],
					[x, y + 1],
				];

				for (const [nx, ny] of neighbors) {
					if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
					const nIdx = (ny * width + nx) * 4;
					if (src[nIdx + 3] > 0) {
						dst[idx] = src[nIdx];
						dst[idx + 1] = src[nIdx + 1];
						dst[idx + 2] = src[nIdx + 2];
						dst[idx + 3] = src[nIdx + 3];
						break;
					}
				}
			}
		}
	}

	return new ImageData(dst, width, height);
}
