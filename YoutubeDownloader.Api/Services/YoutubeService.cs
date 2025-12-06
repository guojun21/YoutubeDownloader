using YoutubeDownloader.Core.Downloading;
using YoutubeDownloader.Core.Resolving;
using YoutubeExplode.Videos;

namespace YoutubeDownloader.Api.Services;

public class YoutubeService : IDisposable
{
    private readonly QueryResolver _resolver = new();
    private readonly VideoDownloader _downloader = new();
    private readonly Dictionary<string, DownloadProgress> _downloads = new();

    public async Task<SearchResult> SearchAsync(string query, CancellationToken ct = default)
    {
        var result = await _resolver.ResolveAsync(query, ct);
        
        return new SearchResult
        {
            Kind = result.Kind.ToString(),
            Title = result.Title,
            Videos = result.Videos.Select(v => new VideoInfo
            {
                Id = v.Id.Value,
                Title = v.Title,
                Author = v.Author.ChannelTitle,
                Duration = v.Duration?.ToString(@"hh\:mm\:ss") ?? "Live",
                ThumbnailUrl = v.Thumbnails.OrderByDescending(t => t.Resolution.Area).FirstOrDefault()?.Url ?? ""
            }).ToList()
        };
    }

    public async Task<List<DownloadOption>> GetDownloadOptionsAsync(string videoId, CancellationToken ct = default)
    {
        var options = await _downloader.GetDownloadOptionsAsync(videoId, true, ct);
        
        return options.Select(o => new DownloadOption
        {
            Container = o.Container.Name,
            Quality = o.VideoQuality?.Label ?? "Audio only",
            Size = FormatSize(o.StreamInfos.Sum(s => s.Size.Bytes))
        }).ToList();
    }

    public Task<string> StartDownloadAsync(string videoId, string container, string quality, string outputPath, CancellationToken ct = default)
    {
        var downloadId = Guid.NewGuid().ToString();
        _downloads[downloadId] = new DownloadProgress { Status = "Starting", Percentage = 0 };

        _ = Task.Run(async () =>
        {
            try
            {
                var video = await new YoutubeExplode.YoutubeClient().Videos.GetAsync(videoId, ct);
                var options = await _downloader.GetDownloadOptionsAsync(videoId, true, ct);
                
                var selectedOption = options.FirstOrDefault(o => 
                    o.Container.Name == container && 
                    (o.VideoQuality?.Label == quality || (quality == "Audio only" && o.VideoQuality == null))
                ) ?? options.First();

                var fileName = SanitizeFileName($"{video.Title}.{selectedOption.Container.Name}");
                var filePath = Path.Combine(outputPath, fileName);

                _downloads[downloadId].Status = "Downloading";
                _downloads[downloadId].FileName = fileName;

                var progress = new Progress<Gress.Percentage>(p =>
                {
                    _downloads[downloadId].Percentage = (int)(p.Fraction * 100);
                });

                await _downloader.DownloadVideoAsync(filePath, video, selectedOption, true, progress, ct);

                _downloads[downloadId].Status = "Completed";
                _downloads[downloadId].Percentage = 100;
                _downloads[downloadId].FilePath = filePath;
            }
            catch (Exception ex)
            {
                _downloads[downloadId].Status = "Failed";
                _downloads[downloadId].Error = ex.Message;
            }
        }, ct);

        return Task.FromResult(downloadId);
    }

    public DownloadProgress? GetDownloadProgress(string downloadId)
    {
        return _downloads.TryGetValue(downloadId, out var progress) ? progress : null;
    }

    private static string FormatSize(long bytes)
    {
        string[] sizes = ["B", "KB", "MB", "GB"];
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len /= 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }

    private static string SanitizeFileName(string fileName)
    {
        var invalid = Path.GetInvalidFileNameChars();
        return string.Join("_", fileName.Split(invalid, StringSplitOptions.RemoveEmptyEntries));
    }

    public void Dispose()
    {
        _resolver.Dispose();
        _downloader.Dispose();
    }
}

public class SearchResult
{
    public string Kind { get; set; } = "";
    public string Title { get; set; } = "";
    public List<VideoInfo> Videos { get; set; } = [];
}

public class VideoInfo
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Author { get; set; } = "";
    public string Duration { get; set; } = "";
    public string ThumbnailUrl { get; set; } = "";
}

public class DownloadOption
{
    public string Container { get; set; } = "";
    public string Quality { get; set; } = "";
    public string Size { get; set; } = "";
}

public class DownloadProgress
{
    public string Status { get; set; } = "";
    public int Percentage { get; set; }
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public string? Error { get; set; }
}
