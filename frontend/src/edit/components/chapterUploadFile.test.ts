import { parseChapterUploadV1 } from "./chapterUploadFile";

describe("parseChapterUploadV1", () => {
	it("summarizes a valid upload document", () => {
		const result = parseChapterUploadV1(
			JSON.stringify({
				chapters: [
					{
						chapterContentText: "One",
						chapterIsPublic: true,
						chapterNum: 1,
						chapterTitle: "First",
					},
					{ chapterContentText: "", chapterNum: 4 },
				],
			}),
		);

		expect(result).toEqual({
			ok: true,
			summary: {
				chapterCount: 2,
				draftCount: 1,
				maxChapterNum: 4,
				minChapterNum: 1,
				publicCount: 1,
			},
		});
	});

	it("rejects malformed JSON", () => {
		expect(parseChapterUploadV1('{"chapters":')).toEqual({
			error: "The selected file is not valid JSON.",
			ok: false,
		});
	});

	it.each([
		{ chapters: [] },
		{ chapters: [{ chapterContentText: "Text", chapterNum: 1.5 }] },
		{ chapters: [{ chapterNum: 1 }] },
	])("rejects documents outside the V1 schema", (document) => {
		expect(parseChapterUploadV1(JSON.stringify(document))).toEqual({
			error: "The selected file does not match the V1 chapter upload format.",
			ok: false,
		});
	});
});
