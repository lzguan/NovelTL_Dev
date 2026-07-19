import { fireEvent, render, screen } from "@testing-library/react";
import { CProvId, type ProvChapter } from "../../controller/types/idTypes";
import { Prov } from "../../controller/types/helperTypes";
import { ChapterTabs } from "./ChapterTabs";

const CHAPTER_A = CProvId("chapter-a");
const CHAPTER_B = CProvId("chapter-b");
const chapters: ProvChapter[] = [
	Prov({
		chapterId: CHAPTER_A,
		chapterNum: 1,
		chapterTitle: "Beginning",
		chapterIsPublic: false,
		novelId: "novel",
	}),
	Prov({
		chapterId: CHAPTER_B,
		chapterNum: 2,
		chapterTitle: "Middle",
		chapterIsPublic: false,
		novelId: "novel",
	}),
];

describe("ChapterTabs", () => {
	it("activates and closes chapters through separate accessible controls", () => {
		const onActivate = vi.fn();
		const onClose = vi.fn();
		render(
			<ChapterTabs
				tabs={[
					{ chapterId: CHAPTER_A, status: "ready" },
					{ chapterId: CHAPTER_B, status: "loading" },
				]}
				chapters={chapters}
				activeChapterId={CHAPTER_A}
				onActivate={onActivate}
				onClose={onClose}
			/>,
		);

		expect(screen.getByRole("tab", { name: "Ch.1: Beginning" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		fireEvent.click(screen.getByRole("tab", { name: "Ch.2: Middle" }));
		fireEvent.click(screen.getByRole("button", { name: "Close Ch.1: Beginning" }));

		expect(onActivate).toHaveBeenCalledWith(CHAPTER_B);
		expect(onClose).toHaveBeenCalledWith(CHAPTER_A);
	});
});
