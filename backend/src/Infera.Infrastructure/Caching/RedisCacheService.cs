using System.Text.Json;
using Infera.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Infera.Infrastructure.Caching;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<RedisCacheService> _logger;
    private const string PrefixIndexKeyPrefix = "prefix-index:";

    public RedisCacheService(IConnectionMultiplexer? redis, ILogger<RedisCacheService> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    // Redis baglantisi yoksa (baslangicta kurulamadi) ya da o an erisilemezse cache tamamen
    // devre disi kalir -- uygulama islevselligini etkilemez, sadece bu istekler DB'ye duser.
    private IDatabase? TryGetDb()
    {
        if (_redis is null || !_redis.IsConnected) return null;
        try { return _redis.GetDatabase(); }
        catch { return null; }
    }

    public async Task<T?> GetAsync<T>(
    string key,
    CancellationToken ct = default) where T : class
    {
        var db = TryGetDb();

        if (db is null)
            return null;

        try
        {
            var value = await db.StringGetAsync(key);

            if (!value.HasValue)
                return null;

            return JsonSerializer.Deserialize<T>(value.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Redis okuma başarısız oldu. Key: {Key}",
                key);

            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan expiry, CancellationToken ct = default) where T : class
    {
        var db = TryGetDb();
        if (db is null) return; // cache yazilamadi, sorun degil -- bir sonraki istek yine DB'den okur

        try
        {
            var json = JsonSerializer.Serialize(value);
            await db.StringSetAsync(key, json, expiry);

            var prefix = GetPrefix(key);
            if (prefix is not null)
                await db.SetAddAsync(PrefixIndexKeyPrefix + prefix, key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis yazma başarısız oldu. Key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        var db = TryGetDb();
        if (db is null) return;

        try { await db.KeyDeleteAsync(key); }
        catch (Exception ex) { _logger.LogWarning(ex, "Redis silme başarısız oldu. Key: {Key}", key); }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        var db = TryGetDb();
        if (db is null) return;

        try
        {
            var indexKey = PrefixIndexKeyPrefix + prefix;
            var members = await db.SetMembersAsync(indexKey);

            if (members.Length > 0)
            {
                var keys = members.Select(m => (RedisKey)m.ToString()).ToArray();
                await db.KeyDeleteAsync(keys);
            }

            await db.KeyDeleteAsync(indexKey);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis prefix temizleme başarısız oldu. Prefix: {Prefix}", prefix);
        }
    }

    private static string? GetPrefix(string key)
    {
        var lastColon = key.LastIndexOf(':');
        return lastColon > 0 ? key[..(lastColon + 1)] : null;
    }
}