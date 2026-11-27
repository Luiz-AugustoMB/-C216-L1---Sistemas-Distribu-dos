from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.core.config import get_settings


def hoje() -> date:
    # A data vem do fuso da sala de estudos, não do relógio do servidor (o container
    # roda em UTC). As regras recebem essa data pela dependência get_hoje, então os
    # testes conseguem trocar o relógio
    return datetime.now(ZoneInfo(get_settings().fuso_horario)).date()
