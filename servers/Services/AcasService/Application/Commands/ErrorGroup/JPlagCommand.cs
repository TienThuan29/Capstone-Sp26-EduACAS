using System.Diagnostics;
using System.Globalization;
using System.IO.Compression;
using System.Text.Json;
using System.Text.RegularExpressions;
using AcasService.Models;
using Microsoft.Extensions.Logging;
using AcasService.Application.Utils;

namespace AcasService.Application.Commands.ErrorGroup;

public interface IJPlagCommand
{
    Task<List<JPlagMatch>> RunSimilarityCheckAsync(
        string language,
        List<Models.Submission> submissions,
        string? baseCode = null,
        string? baseCodeFileName = null,
        int? customMinTokenMatch = null,
        double? customMinSimilarity = null);


    
    int CalculateRecommendedMinTokenMatch(List<Models.Submission> submissions, string? baseCode = null);
}

public class JPlagCommand : IJPlagCommand
{

    private readonly string _jarPath;
    private readonly ILogger<JPlagCommand> _logger;

    public JPlagCommand(ILogger<JPlagCommand> logger)
    {
        _logger = logger;
        _jarPath = Path.Combine(AppContext.BaseDirectory, "Application", "Thirdparty", "jplag.jar");
    }

    public async Task<List<JPlagMatch>> RunSimilarityCheckAsync(
        string language,
        List<Models.Submission> submissions,
        string? baseCode = null,
        string? baseCodeFileName = null,
        int? customMinTokenMatch = null,
        double? customMinSimilarity = null)
    {
        if (submissions == null || submissions.Count < 2)
        {
            _logger.LogWarning("Không đủ số lượng bài nộp để so sánh (ít nhất 2 bài).");
            return new List<JPlagMatch>();
        }

        string sessionId = Guid.NewGuid().ToString();
        string tempDir = Path.Combine(Path.GetTempPath(), "AcasJPlag", sessionId);
        string submissionDir = Path.Combine(tempDir, "submissions");
        string baseCodeDir = Path.Combine(tempDir, "basecode");
        string resultBaseName = Path.Combine(tempDir, "results");
        string resultZipPath = resultBaseName + ".jplag";

        try
        {
            _logger.LogWarning("Bắt đầu chuẩn bị dữ liệu cho JPlag với Base-Code (Session: {SessionId}, Language: {Lang})", sessionId, language);
            string ext = LanguageUtils.GetExtensionForLanguage(language);
            Directory.CreateDirectory(submissionDir);

            if (submissions.Count > 100)
            {
                _logger.LogWarning("CẢNH BÁO: Số lượng bài nộp lớn ({Count}). Quá trình JPlag có thể tốn nhiều tài nguyên.", submissions.Count);
            }

            foreach (var sub in submissions)
            {
                if (string.IsNullOrWhiteSpace(sub.Source))
                {
                    _logger.LogInformation("Bỏ qua bài nộp {SubId} do nội dung trống.", sub.Id);
                    continue;
                }

                string studentDir = Path.Combine(submissionDir, sub.Id);
                Directory.CreateDirectory(studentDir);
                string filePath = Path.Combine(studentDir, $"solution.{ext}");
                string source = sub.Source ?? "";
                if (language.ToLower().Contains("csharp") || language.ToLower().Contains("cs"))
                {
                    source = System.Text.RegularExpressions.Regex.Replace(source, @"namespace\s+[A-Za-z0-9_.]+(\s*\{)?", "namespace Unified {");
                    source = System.Text.RegularExpressions.Regex.Replace(source, @"(public\s+|private\s+|internal\s+|partial\s+)*class\s+[A-Za-z0-9_]+", "class Submission");
                }
                else if (language.ToLower().Contains("python"))
                {
                    source = System.Text.RegularExpressions.Regex.Replace(source, @"class\s+[A-Za-z0-9_]+", "class Submission");
                    source = System.Text.RegularExpressions.Regex.Replace(source, @"def\s+[A-Za-z0-9_]+", "def function_name");
                }
                else if (language.ToLower().Contains("javascript") || language.ToLower().Contains("typescript") || language.ToLower().Contains("js") || language.ToLower().Contains("ts"))
                {
                    source = System.Text.RegularExpressions.Regex.Replace(source, @"class\s+[A-Za-z0-9_]+", "class Submission");
                    source = System.Text.RegularExpressions.Regex.Replace(source, @"function\s+[A-Za-z0-9_]*", "function function_name");
                    source = System.Text.RegularExpressions.Regex.Replace(source, @"(const|let|var)\s+[A-Za-z0-9_]+", "$1 variable_name");
                }
                await File.WriteAllTextAsync(filePath, source);
                _logger.LogInformation("Đã tạo file: {FilePath} (Size: {Size})", filePath, sub.Source.Length);
            }

            if (!string.IsNullOrWhiteSpace(baseCode))
            {
                Directory.CreateDirectory(baseCodeDir);
                string baseCodeFile = baseCodeFileName ?? $"basecode.{ext}";
                string baseCodePath = Path.Combine(baseCodeDir, baseCodeFile);
                await File.WriteAllTextAsync(baseCodePath, baseCode);
                _logger.LogWarning("Đã tạo base-code file tại: {BaseCodePath} (Size: {Size})", baseCodePath, baseCode.Length);
            }
            else
            {
                _logger.LogInformation("Không có base-code được cung cấp, bỏ qua bước tạo base-code directory.");
            }

            await Task.Delay(500);

            int minTokenMatch = customMinTokenMatch ?? CalculateRecommendedMinTokenMatch(submissions, baseCode);
            double minSimilarity = customMinSimilarity ?? 0.0;
            string jplagLang = MapLanguageForJPlag(language);

            if (Directory.Exists(submissionDir))
            {
                var subDirs = Directory.GetDirectories(submissionDir);
                _logger.LogWarning("Cấu trúc thư mục quét: {Dir} chứa {Count} thư mục con.", submissionDir, subDirs.Length);
                foreach (var d in subDirs)
                {
                    var files = Directory.GetFiles(d, "*.*", SearchOption.AllDirectories);
                    _logger.LogWarning("  - SubDir {Name}: {Count} files ({Files})",
                        Path.GetFileName(d), files.Length, string.Join(", ", files.Select(Path.GetFileName)));
                }
            }

            var processInfo = new ProcessStartInfo
            {
                FileName = "java",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            processInfo.ArgumentList.Add("-Djava.awt.headless=true");
            processInfo.ArgumentList.Add("-jar");
            processInfo.ArgumentList.Add(_jarPath);
            processInfo.ArgumentList.Add("--mode");
            processInfo.ArgumentList.Add("RUN");
            processInfo.ArgumentList.Add("-l");
            processInfo.ArgumentList.Add(jplagLang);
            processInfo.ArgumentList.Add("-r");
            processInfo.ArgumentList.Add(resultBaseName);
            processInfo.ArgumentList.Add("-t");
            processInfo.ArgumentList.Add(minTokenMatch.ToString());
            processInfo.ArgumentList.Add("--encoding");
            processInfo.ArgumentList.Add("UTF-8");
            processInfo.ArgumentList.Add("--normalize");
            processInfo.ArgumentList.Add("--overwrite");

            if (!string.IsNullOrWhiteSpace(baseCode) && Directory.Exists(baseCodeDir))
            {
                processInfo.ArgumentList.Add("-bc");
                processInfo.ArgumentList.Add(baseCodeDir);
                _logger.LogWarning("Thêm --base-code argument: {BaseCodeDir}", baseCodeDir);
            }

            processInfo.ArgumentList.Add(submissionDir);

            _logger.LogWarning("Thực thi JPlag: java {Args}", string.Join(" ", processInfo.ArgumentList));

            using var process = Process.Start(processInfo);
            if (process == null) throw new Exception("Không thể khởi động tiến trình Java.");

            var outputTask = process.StandardOutput.ReadToEndAsync();
            var errTask = process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            string output = await outputTask;
            string err = await errTask;

            if (!string.IsNullOrWhiteSpace(output)) _logger.LogCritical("JPlag STDOUT: {Output}", output);
            if (!string.IsNullOrWhiteSpace(err)) _logger.LogCritical("JPlag STDERR: {Error}", err);

            if (process.ExitCode != 0)
            {
                throw new Exception($"JPlag thất bại với Exit Code {process.ExitCode}. Lỗi: {err} Output: {output}");
            }

            _logger.LogWarning("JPlag hoàn tất thành công. Đang phân tích kết quả...");
            var rawResults = await ExtractMatchesFromArchiveAsync(resultZipPath);

            
            var results = rawResults.Where(m => m.SimilarityScore >= minSimilarity).ToList();

            _logger.LogWarning("Đã tìm thấy {Count} cặp tương đồng từ JPlag (sau khi lọc C# >= {Sim}%).", results.Count, minSimilarity * 100);
            foreach (var m in results.Take(10))
            {
                _logger.LogWarning("  - Match: {S1} vs {S2} ({Sim}%)", m.Submission1Id, m.Submission2Id, Math.Round(m.SimilarityScore * 100, 2));
            }
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra trong quá trình chạy JPlag Similarity Check với Base-Code");
            throw;
        }
        finally
        {
            if (Directory.Exists(tempDir))
            {
                try
                {
                    Directory.Delete(tempDir, true);
                    _logger.LogWarning("Đã xóa thư mục tạm: {TempDir}", tempDir);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Không thể xóa thư mục tạm: {TempDir}", tempDir);
                }
            }
        }
    }


    private int EstimateTokenCount(string sourceCode, string language)
    {
        if (string.IsNullOrWhiteSpace(sourceCode)) return 0;

        string code = sourceCode;
        string mappedLang = MapLanguageForJPlag(language);

        if (mappedLang == "python3" || mappedLang == "rlang")
        {
            code = Regex.Replace(code, @"#.*?$", "", RegexOptions.Multiline);
        }
        else
        {
            code = Regex.Replace(code, @"/\*.*?\*/|//.*?$", "", RegexOptions.Singleline | RegexOptions.Multiline);
        }
        code = Regex.Replace(code, @"([""'])(?:(?=(\\?))\2.)*?\1", "STRING", RegexOptions.Singleline);
        return Regex.Matches(code, @"[a-zA-Z0-9_]+|[^\s\w]").Count;
    }

    public int CalculateRecommendedMinTokenMatch(List<Models.Submission> submissions, string? baseCode = null)
    {
        string language = submissions.FirstOrDefault(s => !string.IsNullOrEmpty(s.LanguageId))?.LanguageId ?? "";
        int baseCodeTokens = string.IsNullOrWhiteSpace(baseCode) ? 0 : EstimateTokenCount(baseCode, language);
        
        var tokenCounts = new List<int>();

        foreach (var sub in submissions)
        {
            if (string.IsNullOrWhiteSpace(sub.Source)) continue;
            int totalCount = EstimateTokenCount(sub.Source, language);
            int studentCount = Math.Max(totalCount - baseCodeTokens, 1);
            if (studentCount > 0) tokenCounts.Add(studentCount);
        }

        if (tokenCounts.Count == 0) return 4;

        tokenCounts.Sort();
        int medianTokens = tokenCounts[tokenCounts.Count / 2];

        int matchRule = medianTokens switch
        {
            <= 50 => 4,     
            <= 150 => 6,    
            <= 300 => 8,    
            <= 700 => 10,   
            <= 1500 => 12,  
            _ => 14         
        };
        return Math.Max(matchRule, 3);
    }

    private async Task<List<JPlagMatch>> ExtractMatchesFromArchiveAsync(string zipPath)
    {
        var results = new List<JPlagMatch>();

        try
        {
            if (!File.Exists(zipPath)) return results;

            using var archive = System.IO.Compression.ZipFile.OpenRead(zipPath);
            
            var comparisonEntries = archive.Entries
                .Where(e => e.FullName.StartsWith("comparisons/", StringComparison.OrdinalIgnoreCase) && 
                            e.FullName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var entry in comparisonEntries)
            {
                try 
                {
                    using var stream = entry.Open();
                    using var reader = new StreamReader(stream);
                    string jsonContent = await reader.ReadToEndAsync();

                    using var doc = System.Text.Json.JsonDocument.Parse(jsonContent);
                    var root = doc.RootElement;

                    if (root.ValueKind != System.Text.Json.JsonValueKind.Object) continue;

                    string sub1Id = root.TryGetProperty("first_submission", out var id1a) ? id1a.GetString() ?? "" :
                                   (root.TryGetProperty("firstSubmissionId", out var id1e) ? id1e.GetString() ?? "" :
                                   (root.TryGetProperty("submission1", out var id1b) ? id1b.GetString() ?? "" :
                                   (root.TryGetProperty("id1", out var id1c) ? id1c.GetString() ?? "" : "")));
                                   
                    string sub2Id = root.TryGetProperty("second_submission", out var id2a) ? id2a.GetString() ?? "" :
                                   (root.TryGetProperty("secondSubmissionId", out var id2e) ? id2e.GetString() ?? "" :
                                   (root.TryGetProperty("submission2", out var id2b) ? id2b.GetString() ?? "" :
                                   (root.TryGetProperty("id2", out var id2c) ? id2c.GetString() ?? "" : "")));

                    if (string.IsNullOrEmpty(sub1Id) || string.IsNullOrEmpty(sub2Id)) 
                    {
                        var js = jsonContent.Length > 200 ? jsonContent.Substring(0, 200) + "..." : jsonContent;
                        _logger.LogCritical("BỎ QUA FILE DO KHÔNG TÌM THẤY ID SINH VIÊN: {File} - RAW JSON: {Raw}", entry.FullName, js);
                        continue;
                    }

                    double firstSim = root.TryGetProperty("firstSimilarity", out var fsp) ? fsp.GetDouble() : 0;
                    double secondSim = root.TryGetProperty("secondSimilarity", out var ssp) ? ssp.GetDouble() : 0;
                    
                    double similarity = Math.Max(firstSim, secondSim);
                    
                    if (similarity == 0)
                    {
                        var keys = string.Join(", ", root.EnumerateObject().Select(p => p.Name));
                        _logger.LogCritical("KHÔNG TÌM THẤY TỶ LỆ TRÙNG LẶP! CÁC KEYS: {Keys}", keys);
                    }
                    
                    if (similarity > 1.0) similarity /= 100.0;

                    var match = new JPlagMatch
                    {
                        Submission1Id = sub1Id,
                        Submission2Id = sub2Id,
                        SimilarityScore = (float)similarity,
                        Details = new List<JPlagMatchDetail>()
                    };

                    if (root.TryGetProperty("matches", out var matchesArray) && matchesArray.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        foreach (var matchEl in matchesArray.EnumerateArray())
                        {
                            try 
                            {
                                var detail = new JPlagMatchDetail();
                                
                                detail.Tokens = matchEl.TryGetProperty("lengthOfFirst", out var lof) ? lof.GetInt32() :
                                               (matchEl.TryGetProperty("tokens", out var tk) ? tk.GetInt32() : 
                                               (matchEl.TryGetProperty("length", out var len) ? len.GetInt32() : 0));

                                _logger.LogCritical("JPLAG 6.3 MATCH ELEMENT: {Json}", matchEl.GetRawText());

                                if (matchEl.TryGetProperty("startInFirst", out var sifNode) && sifNode.ValueKind == System.Text.Json.JsonValueKind.Object)
                                {
                                    detail.StartLine1 = sifNode.TryGetProperty("line", out var sl1) ? sl1.GetInt32() : 0;
                                    detail.EndLine1 = matchEl.TryGetProperty("endInFirst", out var eifNode) && eifNode.TryGetProperty("line", out var el1) ? el1.GetInt32() : detail.StartLine1;
                                    
                                    var sisNode = matchEl.TryGetProperty("startInSecond", out var sis) ? sis : default;
                                    detail.StartLine2 = sisNode.ValueKind == System.Text.Json.JsonValueKind.Object && sisNode.TryGetProperty("line", out var sl2) ? sl2.GetInt32() : 0;
                                    detail.EndLine2 = matchEl.TryGetProperty("endInSecond", out var eisNode) && eisNode.TryGetProperty("line", out var el2) ? el2.GetInt32() : detail.StartLine2;
                                }
                                else if (matchEl.TryGetProperty("start1", out var st1) && st1.ValueKind == System.Text.Json.JsonValueKind.Object)
                                {
                                    detail.StartLine1 = st1.TryGetProperty("startLine", out var sl1) ? sl1.GetInt32() : 0;
                                    detail.EndLine1 = matchEl.TryGetProperty("end1", out var e1) && e1.TryGetProperty("endLine", out var el1) ? el1.GetInt32() : detail.StartLine1;
                                    
                                    var st2 = matchEl.TryGetProperty("start2", out var start2Node) ? start2Node : default;
                                    detail.StartLine2 = st2.ValueKind == System.Text.Json.JsonValueKind.Object && st2.TryGetProperty("startLine", out var sl2) ? sl2.GetInt32() : 0;
                                    detail.EndLine2 = matchEl.TryGetProperty("end2", out var e2) && e2.TryGetProperty("endLine", out var el2) ? el2.GetInt32() : detail.StartLine2;
                                }
                                else if (matchEl.TryGetProperty("start1", out var flatSt1) && flatSt1.ValueKind == System.Text.Json.JsonValueKind.Number)
                                {
                                    detail.StartLine1 = flatSt1.GetInt32();
                                    detail.EndLine1 = matchEl.TryGetProperty("end1", out var fe1) ? fe1.GetInt32() : detail.StartLine1;
                                    detail.StartLine2 = matchEl.TryGetProperty("start2", out var fs2) ? fs2.GetInt32() : 0;
                                    detail.EndLine2 = matchEl.TryGetProperty("end2", out var fe2) ? fe2.GetInt32() : detail.StartLine2;
                                }
                                
                                if (detail.StartLine1 > 0 && detail.StartLine2 > 0)
                                {
                                    match.Details.Add(detail);
                                }
                            } 
                            catch { 
                                _logger.LogWarning("Lỗi parse match element: {Json}", matchEl.GetRawText());
                            }
                        }
                    }

                    results.Add(match);
                    _logger.LogInformation("Đã map thành công cặp: {S1} vs {S2} ({Sim}%)", sub1Id, sub2Id, Math.Round(similarity * 100, 2));
                }
                catch (Exception ex)
                {
                     _logger.LogWarning("Lỗi parse file {File}: {Msg}", entry.FullName, ex.Message);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi nghiêm trọng khi giải nén ZIP của JPlag.");
        }

        return results;
    }
    private string MapLanguageForJPlag(string lang) => lang.ToLower() switch {
        "csharp" or "c#" => "csharp",
        "java" => "java",
        "python" or "python3" => "python3",
        "cpp" or "c++" or "c" => "cpp",
        "go" or "golang" => "go",
        "kotlin" => "kotlin",
        "rust" => "rust",
        "javascript" => "javascript",
        "typescript" => "typescript",
        "swift" => "swift",
        "scala" => "scala",
        "rlang" => "rlang",
        _ => "text"
    };
}
