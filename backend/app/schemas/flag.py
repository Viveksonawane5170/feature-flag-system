
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class FlagCreate(BaseModel):
    key: str = Field(min_length=1, max_length=255)
    type: Literal["boolean", "string", "number"] = "boolean"
    default_value: Any = False
    enabled: bool = False
    description: str | None = None
    environment_id: int = Field(gt=0)
    owner_team: str | None = None


class FlagUpdate(BaseModel):
    key: str | None = Field(default=None, min_length=1, max_length=255)
    type: Literal["boolean", "string", "number"] | None = None
    default_value: Any = None
    enabled: bool | None = None
    description: str | None = None
    environment_id: int | None = Field(default=None, gt=0)
    owner_team: str | None = None


class FlagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    type: str
    default_value: Any
    enabled: bool
    description: str | None
    environment_id: int
    owner_team: str | None
