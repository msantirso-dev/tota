from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int | None = None
    role: UserRole | None = None


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.usuario


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime


class ProfileBase(BaseModel):
    display_name: str
    avatar_url: str | None = None
    high_contrast: bool = False
    voice_rate: float = 1.0
    voice_pitch: float = 1.0
    language: str = "es-AR"
    preferences: dict[str, Any] | None = None


class ProfileUpdate(ProfileBase):
    display_name: str | None = None


class ProfileResponse(ProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class BoardBase(BaseModel):
    name: str
    description: str | None = None
    is_default: bool = False
    grid_columns: int = 4


class BoardCreate(BoardBase):
    pass


class BoardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_default: bool | None = None
    grid_columns: int | None = None


class BoardResponse(BoardBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime


class CategoryBase(BaseModel):
    name: str
    color: str = "#6366f1"
    icon: str | None = None
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    board_id: int


class CategoryUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    icon: str | None = None
    sort_order: int | None = None


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    board_id: int
    created_at: datetime


class ButtonActionBase(BaseModel):
    action_type: str
    provider: str = "mock"
    config: dict[str, Any] | None = None
    requires_confirmation: bool = True


class ButtonActionResponse(ButtonActionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    button_id: int
    created_at: datetime


class ButtonBase(BaseModel):
    label: str
    spoken_text: str
    color: str = "#e0e7ff"
    icon: str | None = None
    image_url: str | None = None
    sort_order: int = 0
    is_emergency: bool = False
    category_id: int | None = None


class ButtonCreate(ButtonBase):
    board_id: int
    actions: list[ButtonActionBase] = []


class ButtonUpdate(BaseModel):
    label: str | None = None
    spoken_text: str | None = None
    color: str | None = None
    icon: str | None = None
    image_url: str | None = None
    sort_order: int | None = None
    is_emergency: bool | None = None
    category_id: int | None = None


class ButtonReorderRequest(BaseModel):
    board_id: int
    button_ids: list[int] = Field(min_length=1)


class ButtonResponse(ButtonBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    board_id: int
    created_at: datetime
    updated_at: datetime
    actions: list[ButtonActionResponse] = []


class BoardDetailResponse(BoardResponse):
    categories: list[CategoryResponse] = []
    buttons: list[ButtonResponse] = []


class PhraseBase(BaseModel):
    text: str
    spoken_text: str
    is_favorite: bool = False


class PhraseCreate(PhraseBase):
    pass


class PhraseUpdate(BaseModel):
    text: str | None = None
    spoken_text: str | None = None
    is_favorite: bool | None = None


class PhraseResponse(PhraseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    use_count: int
    created_at: datetime
    updated_at: datetime


class HistoryCreate(BaseModel):
    phrase_text: str
    button_ids: list[int] | None = None
    spoken: bool = True


class HistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    phrase_text: str
    button_ids: list[int] | None
    spoken: bool
    created_at: datetime


class SuggestionRequest(BaseModel):
    phrase: str
    use_ai: bool = False


class SuggestionResponse(BaseModel):
    input_phrase: str
    suggestions: list[str]
    source: str


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=30)


class ChatResponse(BaseModel):
    reply: str
    source: str


class ChatStatusResponse(BaseModel):
    provider: str
    available: bool
    model: str | None = None
    ollama_url: str | None = None


class AutomationActionBase(BaseModel):
    name: str
    description: str | None = None
    action_type: str
    provider: str = "mock"
    config: dict[str, Any] | None = None
    icon: str | None = None
    is_active: bool = True
    requires_confirmation: bool = True


class AutomationActionCreate(AutomationActionBase):
    pass


class AutomationActionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    action_type: str | None = None
    provider: str | None = None
    config: dict[str, Any] | None = None
    icon: str | None = None
    is_active: bool | None = None
    requires_confirmation: bool | None = None


class AutomationActionResponse(AutomationActionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class AutomationExecuteRequest(BaseModel):
    action_id: int
    confirmed: bool = False


class AutomationExecuteResponse(BaseModel):
    success: bool
    message: str
    provider: str
    requires_confirmation: bool = False


class EmergencyContactBase(BaseModel):
    name: str
    phone: str | None = None
    email: EmailStr | None = None
    relationship_type: str | None = None
    is_primary: bool = False


class EmergencyContactCreate(EmergencyContactBase):
    pass


class EmergencyContactUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    relationship_type: str | None = None
    is_primary: bool | None = None


class EmergencyContactResponse(EmergencyContactBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime


class EmergencyTriggerRequest(BaseModel):
    message: str = "Necesito ayuda urgente"
    confirmed: bool = False


class EmergencyTriggerResponse(BaseModel):
    success: bool
    message: str
    contacts_notified: int


class SettingBase(BaseModel):
    key: str
    value: dict[str, Any] | None = None


class SettingUpdate(BaseModel):
    value: dict[str, Any]


class SettingResponse(SettingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    created_at: datetime
    updated_at: datetime


class TTSRequest(BaseModel):
    text: str
    language: str = "es-AR"
    provider: str | None = None
    piper_url: str | None = None


class TTSResponse(BaseModel):
    text: str
    provider: str
    use_browser: bool
    audio_url: str | None = None
    audio_base64: str | None = None
    audio_content_type: str = "audio/wav"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
