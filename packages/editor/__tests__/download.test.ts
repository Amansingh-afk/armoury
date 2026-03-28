import { describe, expect, it, vi } from "vitest";
import { downloadBlob } from "../src/export/download";

describe("downloadBlob", () => {
	it("creates an anchor element with the correct filename and triggers click", () => {
		const createElementSpy = vi.spyOn(document, "createElement");
		const clickMock = vi.fn();
		const revokeURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
		vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

		createElementSpy.mockReturnValue({
			href: "",
			download: "",
			click: clickMock,
			style: {},
		} as unknown as HTMLAnchorElement);

		const blob = new Blob(["test"], { type: "application/octet-stream" });
		downloadBlob(blob, "test.tga");

		expect(clickMock).toHaveBeenCalledOnce();
		expect(revokeURLSpy).toHaveBeenCalledWith("blob:test");

		createElementSpy.mockRestore();
		revokeURLSpy.mockRestore();
	});
});
