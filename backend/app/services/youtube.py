from urllib.parse import parse_qs, urlparse


def extract_youtube_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if "youtu.be" in host:
        video_id = parsed.path.strip("/")
        return video_id or None

    if "youtube.com" in host:
        if parsed.path == "/watch":
            return parse_qs(parsed.query).get("v", [None])[0]
        if parsed.path.startswith("/embed/"):
            return parsed.path.split("/embed/")[-1] or None
        if parsed.path.startswith("/shorts/"):
            return parsed.path.split("/shorts/")[-1] or None

    return None

