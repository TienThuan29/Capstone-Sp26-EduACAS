using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AcasService.Repositories.Caching.Redis;

public interface IRedisCacheBaseRepository<T> where T : class
{
      Task<TValue?> GetAsync<TValue>(string key) where TValue : class;

      Task SetAsync<TValue>(string key, TValue data) where TValue : class;

      Task RemoveAsync(string key);

      Task<TValue?> GetOrSetAsync<TValue>(string key, Func<Task<TValue?>> factory, TimeSpan? expireTime = null) where TValue : class;
}



public class RedisCacheBaseRepository<T> : IRedisCacheBaseRepository<T> where T : class
{
      private readonly IDistributedCache _cache;
      private readonly ILogger<RedisCacheBaseRepository<T>> _logger;
      private readonly TimeSpan? _absoluteExpireTime = null;
      private readonly TimeSpan? _slidingExpireTime = null;

      private readonly JsonSerializerOptions _jsonOptions = new()
      {
            // support camel case
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
      };

      public RedisCacheBaseRepository(
            IDistributedCache cache, 
            ILogger<RedisCacheBaseRepository<T>> logger,
            TimeSpan? absoluteExpireTime = null,
            TimeSpan? slidingExpireTime = null)
      {
            _cache = cache;
            _logger = logger;
            _absoluteExpireTime = absoluteExpireTime;
            _slidingExpireTime = slidingExpireTime;
      }

      public async Task<TValue?> GetAsync<TValue>(string key) where TValue : class
      {
            try
            {
                  var cachedData = await _cache.GetStringAsync(key);
                  if (string.IsNullOrEmpty(cachedData))
                  {
                        return null;
                  }

                  return JsonSerializer.Deserialize<TValue>(cachedData, _jsonOptions);
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, "Error getting cache for key: {Key}", key);
                  return null;
            }
      }

      public async Task SetAsync<TValue>(string key, TValue data) where TValue : class
      {
            try
            {
                  var options = new DistributedCacheEntryOptions();

                  if (_absoluteExpireTime.HasValue)
                        options.AbsoluteExpirationRelativeToNow = _absoluteExpireTime;

                  if (_slidingExpireTime.HasValue)
                        options.SlidingExpiration = _slidingExpireTime;

                  var serializedData = JsonSerializer.Serialize(data, _jsonOptions);
                  await _cache.SetStringAsync(key, serializedData, options);
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, "Error setting cache for key: {Key}", key);
            }
      }

      public async Task RemoveAsync(string key)
      {
            try
            {
                  await _cache.RemoveAsync(key);
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, "Error removing cache for key: {Key}", key);
            }
      }

      public async Task<TValue?> GetOrSetAsync<TValue>(string key, Func<Task<TValue?>> factory, TimeSpan? expireTime = null) where TValue : class
      {
            var cachedData = await GetAsync<TValue>(key);
            if (cachedData != null)
            {
                  return cachedData;
            }

            var data = await factory();

            if (data != null)
            {
                  await SetAsync(key, data);
            }

            return data;
      }
}