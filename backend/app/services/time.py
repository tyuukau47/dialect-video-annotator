def format_duration_ms(total_ms: int) -> str:
    hours = total_ms // 3_600_000
    minutes = (total_ms % 3_600_000) // 60_000
    seconds = (total_ms % 60_000) // 1000
    milliseconds = total_ms % 1000
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{milliseconds:03d}"

