from app.main import health


def test_health_retorna_status_ok():
    assert health() == {"status": "ok"}
