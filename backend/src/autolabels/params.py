from typing import Literal, Self

from pydantic import Field, model_validator

from src.autolabels.constants import SepPriority
from src.schemas import SkipDefaultModel

ModelName = Literal["cluener", "do_nothing"]


class NERModelParamsBase(SkipDefaultModel):
    """
    Pydantic schema for base NER model parameters. No attributes provided.

    Implementations should inherit from this class and add a model_name attribute for discrimination.
    """

    pass


class CluenerParams(NERModelParamsBase):
    """
    Pydantic schema for a Cluener model.

    Attributes:
        chunk_size: Integer between 1 and 512. Determines max size of chunks passed to NER model. Has default value 500.
        separators: Dictionary of the form `char : SepPriority`. The predict algorithm will prioritize chunks ending in higher priority separators. Has default value (read the code to see what it is.)
        force_chunk: If no separators found in some interval, force the chunker to chunk mid-sentence. Has default value False.

    Notes:
        To validate this model without injecting default values, call `CluenerModelParams.model_validate(..., context={'skip_default_values' : True})`.
    """

    model_name: Literal["cluener"] = Field(default="cluener")

    chunk_size: int = Field(default=500, gt=0, le=512)
    separators: dict[str, SepPriority] = Field(
        default={
            "\n": SepPriority.HIGH,
            "。": SepPriority.MED,
            "！": SepPriority.MED,
            "？": SepPriority.MED,
            ".": SepPriority.MED,
            "!": SepPriority.MED,
            "?": SepPriority.MED,
            "，": SepPriority.LOW,
            "；": SepPriority.LOW,
            "：": SepPriority.LOW,
            ",": SepPriority.LOW,
            ";": SepPriority.LOW,
            ":": SepPriority.LOW,
        }
    )
    force_chunk: bool = False

    @model_validator(mode="after")
    def verify_separators(self) -> Self:
        if not all(len(key) == 1 for key in self.separators):
            raise ValueError("A separator does not have length 1")
        return self


class DoNothingParams(NERModelParamsBase):
    """
    Pydantic schema for a DoNothing model.

    Attributes:
        model_name: Literal "do_nothing".
    """

    model_name: Literal["do_nothing"] = Field(default="do_nothing")


NERParams = CluenerParams | DoNothingParams
