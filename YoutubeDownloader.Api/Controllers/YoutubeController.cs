using Microsoft.AspNetCore.Mvc;
using YoutubeDownloader.Api.Services;

namespace YoutubeDownloader.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class YoutubeController(YoutubeService youtubeService) : ControllerBase
{
    [HttpGet("search")]
    public async Task<ActionResult<SearchResult>> Search([FromQuery] string query, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest("Query is required");

        try
        {
            var result = await youtubeService.SearchAsync(query, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("options/{videoId}")]
    public async Task<ActionResult<List<DownloadOption>>> GetOptions(string videoId, CancellationToken ct)
    {
        try
        {
            var options = await youtubeService.GetDownloadOptionsAsync(videoId, ct);
            return Ok(options);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("download")]
    public async Task<ActionResult<DownloadResponse>> StartDownload([FromBody] DownloadRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.VideoId))
            return BadRequest("VideoId is required");

        try
        {
            var outputPath = request.OutputPath ?? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                "Downloads"
            );

            var downloadId = await youtubeService.StartDownloadAsync(
                request.VideoId,
                request.Container ?? "mp4",
                request.Quality ?? "720p",
                outputPath,
                ct
            );

            return Ok(new DownloadResponse { DownloadId = downloadId });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("progress/{downloadId}")]
    public ActionResult<DownloadProgress> GetProgress(string downloadId)
    {
        var progress = youtubeService.GetDownloadProgress(downloadId);
        if (progress == null)
            return NotFound();

        return Ok(progress);
    }
}

public class DownloadRequest
{
    public string VideoId { get; set; } = "";
    public string? Container { get; set; }
    public string? Quality { get; set; }
    public string? OutputPath { get; set; }
}

public class DownloadResponse
{
    public string DownloadId { get; set; } = "";
}

