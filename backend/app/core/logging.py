import sys
import os
from loguru import logger

LOG_DIR = os.path.join(os.path.dirname(__file__), "../../../logs")
LOG_FILE = os.path.join(LOG_DIR, "openclaw.log")

JSON_FORMAT = (
    '{{"time":"{time:YYYY-MM-DD HH:mm:ss.SSS}", '
    '"level":"{level}", '
    '"module":"{name}", '
    '"function":"{function}", '
    '"line":{line}, '
    '"trace_id":"{extra[trace_id]}", '
    '"message":"{message}"}}'
)

CONSOLE_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)


def setup_logging() -> None:
    os.makedirs(LOG_DIR, exist_ok=True)

    logger.remove()

    logger.configure(extra={"trace_id": "-"})

    logger.add(
        sys.stdout,
        format=CONSOLE_FORMAT,
        level="INFO",
        colorize=True,
        enqueue=True,
    )

    logger.add(
        LOG_FILE,
        rotation="100 MB",
        retention="7 days",
        level="DEBUG",
        format=JSON_FORMAT,
        enqueue=True,
        serialize=False,
    )

    logger.info("OpenClaw logging initialised — stdout + {}", LOG_FILE)


def get_logger(trace_id: str = "-"):
    return logger.bind(trace_id=trace_id)
