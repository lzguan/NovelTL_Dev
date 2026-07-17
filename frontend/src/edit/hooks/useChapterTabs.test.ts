import { act, renderHook } from "@testing-library/react";
import { CProvId } from "../controller/types/idTypes";
import { useChapterTabs } from "./useChapterTabs";

const CHAPTER_A = CProvId("chapter-a");
const CHAPTER_B = CProvId("chapter-b");
const CHAPTER_C = CProvId("chapter-c");

describe("useChapterTabs", () => {
	it("opens tabs once and focuses an existing ready tab", () => {
		const { result } = renderHook(() => useChapterTabs());

		act(() => {
			expect(result.current.activate(CHAPTER_A)).toBe("open");
			result.current.markOpened(CHAPTER_A);
			expect(result.current.activate(CHAPTER_B)).toBe("open");
			expect(result.current.activate(CHAPTER_A)).toBe("open");
		});

		expect(result.current.tabs.map((tab) => tab.chapterId)).toEqual([CHAPTER_A, CHAPTER_B]);
		expect(result.current.activeChapterId).toBe(CHAPTER_A);
	});

	it("selects the right tab, then the left tab, when closing the active tab", () => {
		const { result } = renderHook(() => useChapterTabs());

		act(() => {
			result.current.activate(CHAPTER_A);
			result.current.markOpened(CHAPTER_A);
			result.current.activate(CHAPTER_B);
			result.current.markOpened(CHAPTER_B);
			result.current.activate(CHAPTER_C);
			result.current.markOpened(CHAPTER_C);
			result.current.activate(CHAPTER_B);
		});

		let firstClose: ReturnType<typeof result.current.close> | null = null;
		act(() => {
			firstClose = result.current.close(CHAPTER_B);
		});
		expect(firstClose).toEqual({ nextChapterId: CHAPTER_C, requestClose: true });
		expect(result.current.activeChapterId).toBe(CHAPTER_C);

		let secondClose: ReturnType<typeof result.current.close> | null = null;
		act(() => {
			secondClose = result.current.close(CHAPTER_C);
		});
		expect(secondClose).toEqual({ nextChapterId: CHAPTER_A, requestClose: true });
		expect(result.current.activeChapterId).toBe(CHAPTER_A);
	});

	it("defers reopening until cache eviction finishes", () => {
		const { result } = renderHook(() => useChapterTabs());

		act(() => {
			result.current.activate(CHAPTER_A);
			result.current.markOpened(CHAPTER_A);
			result.current.close(CHAPTER_A);
		});

		act(() => {
			expect(result.current.activate(CHAPTER_A)).toBe("wait");
		});
		expect(result.current.tabs).toEqual([{ chapterId: CHAPTER_A, status: "loading" }]);

		let shouldReopen = false;
		act(() => {
			shouldReopen = result.current.markClosed(CHAPTER_A);
		});
		expect(shouldReopen).toBe(true);
	});
});
