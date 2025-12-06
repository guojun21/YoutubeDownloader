feat: Migrate to Electron + React frontend with .NET API backend

BREAKING CHANGE: Complete UI rewrite from Avalonia to Electron + React

## Summary
This commit introduces a major architectural change: migrating the desktop UI from Avalonia to Electron + React, while preserving the core YouTube download functionality through a new .NET Web API backend.

## Changes

### Backend (.NET)
- **New API Service** (`YoutubeDownloader.Api/`)
  - ASP.NET Core Web API with REST endpoints
  - `/api/youtube/search` - Search videos by query
  - `/api/youtube/options/{videoId}` - Get download options
  - `/api/youtube/download` - Start video download
  - `/api/youtube/progress/{downloadId}` - Get download progress
  - Reuses existing `YoutubeDownloader.Core` logic

### Frontend (Electron + React)
- **New Electron App** (`electron-app/`)
  - React 19 + TypeScript + Vite 7
  - Modern dark theme UI with Material Design inspiration
  - Real-time download progress tracking
  - Video search and selection interface
  - Download format/quality selection modal

### Compatibility Fixes
- **.NET Framework Migration**
  - Updated `global.json` from .NET 10.0 to .NET 9.0
  - Updated `Directory.Build.props` target framework to `net9.0`
  - Converted C# 13 `extension` syntax to traditional extension methods
  - Fixed all extension method files to be compatible with .NET 9

- **Code Refactoring**
  - `GenericExtensions.cs` - Converted to traditional extension methods
  - `CollectionExtensions.cs` - Converted to traditional extension methods
  - `PathExtensions.cs` - Converted to static methods
  - `AsyncCollectionExtensions.cs` - Converted to traditional extension methods
  - `StringExtensions.cs` - Converted to traditional extension methods
  - `YoutubeExtensions.cs` - Converted to traditional extension methods
  - `VideoQualityPreference.cs` - Converted to traditional extension methods
  - `AvaloniaExtensions.cs` - Converted to traditional extension methods
  - `NotifyPropertyChangedExtensions.cs` - Converted to traditional extension methods
  - `DirectoryExtensions.cs` - Converted to static methods
  - `ProcessExtensions.cs` - Converted to static methods
  - `DisposableExtensions.cs` - Converted to traditional extension methods
  - Updated all call sites to use new method signatures

- **UI Improvements**
  - Disabled development build warning popup
  - Disabled automatic FFmpeg download (use system FFmpeg)

### Technical Stack
- **Frontend**: React 19, TypeScript, Vite 7, Electron, Axios, Lucide React
- **Backend**: ASP.NET Core 9.0, YoutubeExplode (reused from Core)
- **Build**: Electron Builder for packaging

### Features
- ✅ YouTube video search
- ✅ Video download with format/quality selection
- ✅ Real-time download progress
- ✅ Download history tracking
- ✅ Modern, responsive UI

### Migration Notes
- Original Avalonia UI preserved in `YoutubeDownloader/` directory
- New Electron app runs alongside .NET API backend
- Default download location: `~/Downloads/`
- Requires FFmpeg installed system-wide

## Testing
- ✅ Search functionality working
- ✅ Video download working
- ✅ Progress tracking working
- ✅ Backend API endpoints tested

## Files Changed
- Modified: 20 files (compatibility fixes)
- Added: 2 new directories (electron-app/, YoutubeDownloader.Api/)
- Total: ~50+ new files added

