from src.requests.cache import TTLCache, redis_cache


def get_redis_cache() -> TTLCache:
    return redis_cache
