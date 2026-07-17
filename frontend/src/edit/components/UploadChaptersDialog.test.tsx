import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createChaptersByUploadChaptersUploadPost } from "@/api/endpoints/default/default";
import { NovelType, Visibility, type Novel } from "@/api/models";
import { UploadChaptersDialog } from "./UploadChaptersDialog";

vi.mock("@/api/endpoints/default/default", async (importOriginal) => {
	const original = await importOriginal<typeof import("@/api/endpoints/default/default")>();
	return {
		...original,
		createChaptersByUploadChaptersUploadPost: vi.fn(),
	};
});

beforeAll(() => {
	Object.defineProperties(HTMLElement.prototype, {
		hasPointerCapture: { configurable: true, value: () => false },
		releasePointerCapture: { configurable: true, value: () => undefined },
		scrollIntoView: { configurable: true, value: () => undefined },
		setPointerCapture: { configurable: true, value: () => undefined },
	});
});

const novels: Novel[] = [
	{
		languageCode: "ja",
		novelId: "00000000-0000-4000-8000-000000000001",
		novelTitle: "Test Novel",
		novelType: NovelType.original,
		novelVisibility: Visibility.NUMBER_0,
		sourceWorkId: "00000000-0000-4000-8000-000000000002",
	},
];

function fileWithText(contents: string, name = "chapters.json") {
	const file = new File([contents], name, { type: "application/json" });
	Object.defineProperty(file, "text", {
		configurable: true,
		value: () => Promise.resolve(contents),
	});
	return file;
}

function renderDialog(onOpenChange = vi.fn()) {
	return render(<UploadChaptersDialog novels={novels} onOpenChange={onOpenChange} open />);
}

async function selectNovel() {
	const trigger = screen.getByRole("combobox", { name: "Novel" });
	fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: "mouse" });
	fireEvent.click(await screen.findByRole("option", { name: "Test Novel" }));
}

describe("UploadChaptersDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(createChaptersByUploadChaptersUploadPost).mockResolvedValue({
			data: [
				{
					chapterId: "chapter-1",
					chapterIsPublic: true,
					chapterNum: 1,
					chapterTitle: "One",
					novelId: novels[0].novelId,
				},
				{
					chapterId: "chapter-2",
					chapterIsPublic: false,
					chapterNum: 3,
					chapterTitle: "Three",
					novelId: novels[0].novelId,
				},
			],
			headers: new Headers(),
			status: 200,
		});
	});

	it("summarizes a valid file and submits the original File", async () => {
		renderDialog();
		const file = fileWithText(
			JSON.stringify({
				chapters: [
					{
						chapterContentText: "One",
						chapterIsPublic: true,
						chapterNum: 1,
					},
					{ chapterContentText: "Three", chapterNum: 3 },
				],
			}),
		);

		fireEvent.change(screen.getByLabelText("Chapter file"), {
			target: { files: [file] },
		});

		expect(await screen.findByText("chapters.json")).toBeVisible();
		expect(screen.getByText("1–3")).toBeVisible();
		await selectNovel();
		fireEvent.click(screen.getByRole("button", { name: "Upload chapters" }));

		await waitFor(() =>
			expect(createChaptersByUploadChaptersUploadPost).toHaveBeenCalledWith({
				file,
				novelId: novels[0].novelId,
				version: "v1",
			}),
		);
		expect(await screen.findByText("2 chapters were created successfully.")).toBeVisible();
	});

	it.each([
		["malformed JSON", fileWithText('{"chapters":')],
		["an invalid V1 document", fileWithText(JSON.stringify({ chapters: [] }))],
	])("rejects %s before submission", async (_description, file) => {
		renderDialog();
		await selectNovel();

		fireEvent.change(screen.getByLabelText("Chapter file"), {
			target: { files: [file] },
		});

		expect(await screen.findByRole("alert")).toBeVisible();
		expect(screen.getByRole("button", { name: "Upload chapters" })).toBeDisabled();
		expect(createChaptersByUploadChaptersUploadPost).not.toHaveBeenCalled();
	});

	it("preserves the selected file and novel when the server rejects the upload", async () => {
		vi.mocked(createChaptersByUploadChaptersUploadPost).mockResolvedValueOnce({
			data: { detail: "A chapter number already exists." },
			headers: new Headers(),
			status: 409,
		});
		renderDialog();
		const file = fileWithText(
			JSON.stringify({
				chapters: [{ chapterContentText: "One", chapterNum: 1 }],
			}),
		);
		await selectNovel();
		fireEvent.change(screen.getByLabelText("Chapter file"), {
			target: { files: [file] },
		});
		await screen.findByText("chapters.json");

		fireEvent.click(screen.getByRole("button", { name: "Upload chapters" }));

		expect(await screen.findByText("A chapter number already exists.")).toBeVisible();
		expect(screen.getByText("chapters.json")).toBeVisible();
		expect(screen.getByRole("combobox", { name: "Novel" })).toHaveTextContent("Test Novel");
	});

	it("resets after completing the upload", async () => {
		const onOpenChange = vi.fn();
		renderDialog(onOpenChange);
		const file = fileWithText(
			JSON.stringify({
				chapters: [{ chapterContentText: "One", chapterNum: 1 }],
			}),
		);
		await selectNovel();
		fireEvent.change(screen.getByLabelText("Chapter file"), {
			target: { files: [file] },
		});
		await screen.findByText("chapters.json");
		fireEvent.click(screen.getByRole("button", { name: "Upload chapters" }));
		await screen.findByText("2 chapters were created successfully.");

		fireEvent.click(screen.getByRole("button", { name: "Done" }));

		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(screen.getByRole("combobox", { name: "Novel" })).toHaveTextContent("Select a novel");
		expect(screen.getByRole("button", { name: "Upload chapters" })).toBeDisabled();
	});
});
