from src.autolabels.nerimplementations import Cluener, CluenerModelParams
import pytest # type: ignore
from typing import Callable, Generator

def test_pure_chinese_fantasy_basic(chapter_loader : Callable[[str], Generator[str, None, None]]):
    cluener = Cluener()
    chapters = chapter_loader('chinese/pure_chinese_fantasy')
    for chapter in chapters:
        res, err = cluener.model.predict(chapter, CluenerModelParams())
        print(res)
        print(err)