using System.Text;
using Azure;
using Azure.AI.FormRecognizer.DocumentAnalysis;
using System.Linq;
using System.Collections.Generic;
using AcasService.Application.Utils;
namespace AcasService.Application.Commands.OCR
{
    public interface IAzureOcrCommand
    {
        Task<string> AnalyzeToMarkdownAsync(Stream fileStream);
    }
    public class AzureOcrCommand : IAzureOcrCommand
    {
        private readonly DocumentAnalysisClient _client;

        public AzureOcrCommand(AzureFormRecognizerConfig config)
        {
            var credential = new AzureKeyCredential(config.ApiKey);
            _client = new DocumentAnalysisClient(
                new Uri(config.Endpoint),
                credential
            );
        }

        public async Task<string> AnalyzeToMarkdownAsync(Stream fileStream)
        {
            var operation = await _client.AnalyzeDocumentAsync(
                WaitUntil.Completed,
                "prebuilt-layout",
                fileStream
            );

            var result = operation.Value;
            var sb = new StringBuilder();

            var styleMap = BuildStyleMap(result);

            var items = new List<RenderItem>();
            var tableSpans = new List<(int Start, int End)>();

            foreach (var table in result.Tables)
            {
                foreach (var cell in table.Cells)
                {
                    foreach (var span in cell.Spans)
                    {
                        tableSpans.Add((span.Index, span.Index + span.Length));
                    }
                }

                if (table.Cells.Count > 0)
                {
                    var cellsWithSpans = table.Cells.Where(c => c.Spans.Count > 0).ToList();

                    if (cellsWithSpans.Count > 0)
                    {
                        var firstSpan = cellsWithSpans.MinBy(c => c.Spans[0].Index)?.Spans[0];
                        if (firstSpan.HasValue)
                        {
                            items.Add(new RenderItem
                            {
                                Type = RenderItemType.Table,
                                Offset = firstSpan.Value.Index,
                                Table = table
                            });
                        }
                    }
                }
            }

            foreach (var page in result.Pages)
            {
                foreach (var line in page.Lines)
                {
                    if (line.Spans.Count == 0) continue;

                    var spanStart = line.Spans[0].Index;
                    var spanEnd = spanStart + line.Spans[0].Length;

                    bool insideTable = tableSpans.Any(ts => spanStart >= ts.Start && spanEnd <= ts.End);

                    if (!insideTable)
                    {
                        items.Add(new RenderItem
                        {
                            Type = RenderItemType.Line,
                            Offset = spanStart,
                            Line = line
                        });
                    }
                }
            }

            var sortedItems = items.OrderBy(i => i.Offset).ToList();

            bool insideCodeBlock = false;
            string previousLineContent = "";

            foreach (var item in sortedItems)
            {
                if (item.Type == RenderItemType.Table)
                {
                    if (insideCodeBlock)
                    {
                        sb.AppendLine("```");
                        sb.AppendLine();
                        insideCodeBlock = false;
                    }

                    sb.AppendLine();
                    AppendMarkdownTable(sb, item.Table!);
                    sb.AppendLine();
                }
                else if (item.Type == RenderItemType.Line)
                {
                    var content = item.Line!.Content;
                    if (string.IsNullOrWhiteSpace(content)) continue;

                    var styledContent = ApplyStyles(content, item.Offset, styleMap);

                    bool isCode = LooksLikeCode(content);

                    if (isCode)
                    {
                        if (!insideCodeBlock)
                        {
                            sb.AppendLine("```java");
                            insideCodeBlock = true;
                        }
                        sb.AppendLine(content);
                    }
                    else
                    {
                        if (insideCodeBlock)
                        {
                            sb.AppendLine("```");
                            sb.AppendLine();
                            insideCodeBlock = false;
                        }

                        var paragraph = result.Paragraphs.FirstOrDefault(p =>
                            p.Spans.Any(s => s.Index == item.Offset));

                        if (paragraph?.Role == ParagraphRole.Title)
                        {
                            sb.AppendLine($"# {styledContent}");
                        }
                        else if (paragraph?.Role == ParagraphRole.SectionHeading)
                        {
                            sb.AppendLine($"## {styledContent}");
                        }
                        else if (LooksLikeHeading(content))
                        {
                            sb.AppendLine($"### {styledContent}");
                        }
                        else
                        {
                            sb.AppendLine(styledContent);
                        }
                    }

                    previousLineContent = content;
                }
            }

            if (insideCodeBlock)
            {
                sb.AppendLine("```");
            }

            return sb.ToString();
        }

     

        private Dictionary<int, StyleInfo> BuildStyleMap(AnalyzeResult result)
        {
            var map = new Dictionary<int, StyleInfo>();

            if (result.Styles == null) return map;

            foreach (var style in result.Styles)
            {
                foreach (var span in style.Spans)
                {
                    for (int i = span.Index; i < span.Index + span.Length; i++)
                    {
                        if (!map.ContainsKey(i))
                        {
                            map[i] = new StyleInfo();
                        }

                        if (style.IsHandwritten == true)
                        {
                        }
                        else
                        {
                            if (style.Confidence > 0.7)
                            {
                               
                            }
                        }
                    }
                }
            }

            return map;
        }

        private string ApplyStyles(string text, int offset, Dictionary<int, StyleInfo> styleMap)
        {
            
            return text;
        }

        

        private bool LooksLikeCode(string line)
        {
            var trimmed = line.Trim();
            if (trimmed.Length < 5) return false;

            bool hasIndentation = line.Length > 0 && char.IsWhiteSpace(line[0]) && line.TrimStart().Length > 0;

            bool hasKeywords = trimmed.Contains("public ") || trimmed.Contains("private ") || trimmed.Contains("protected ") ||
                               trimmed.Contains("class ") || trimmed.Contains("interface ") || trimmed.Contains("void ") ||
                               trimmed.Contains("int ") || trimmed.Contains("String ") || trimmed.Contains("import ") ||
                               trimmed.Contains("package ") || trimmed.Contains("using ");

            bool hasBraces = trimmed.Contains("{") || trimmed.Contains("}");
            bool endsWithSemi = trimmed.EndsWith(";");
            bool hasParens = trimmed.Contains("(") && trimmed.Contains(")");

            if (hasKeywords && (hasBraces || endsWithSemi || hasParens)) return true;
            if (hasBraces) return true;
            if (trimmed.StartsWith("if (") || trimmed.StartsWith("for (") || trimmed.StartsWith("while (") || trimmed.StartsWith("return "))
                return true;

            if (hasIndentation && (hasKeywords || endsWithSemi)) return true;            int nonAsciiCount = trimmed.Count(c => c > 127);
            if (nonAsciiCount > 3 && !trimmed.StartsWith("//")) return false;

            return false;
        }

        private bool LooksLikeHeading(string line)
        {
            if (line.Length > 100) return false;
            if (line.EndsWith(".") || line.EndsWith(",")) return false;

            bool isQuestionLabel = System.Text.RegularExpressions.Regex.IsMatch(line,
                @"^(Câu|Bài|Part|Question|Chapter|Problem)\s+\d+.*",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            bool isAllCaps = line.All(c => char.IsUpper(c) || char.IsWhiteSpace(c) || char.IsDigit(c) || char.IsPunctuation(c));

            return isQuestionLabel || isAllCaps;
        }

        private void AppendMarkdownTable(StringBuilder md, DocumentTable table)
        {
            var rows = table.Cells
                .GroupBy(c => c.RowIndex)
                .OrderBy(g => g.Key)
                .Select(g => g
                    .OrderBy(c => c.ColumnIndex)
                    .Select(c => c.Content?.Trim() ?? "")
                    .ToList())
                .ToList();

            if (rows.Count == 0) return;

        
            md.AppendLine("| " + string.Join(" | ", rows[0]) + " |");
            md.AppendLine("| " + string.Join(" | ", rows[0].Select(_ => "---")) + " |");

            
            foreach (var row in rows.Skip(1))
            {
                md.AppendLine("| " + string.Join(" | ", row) + " |");
            }
        }

        

        private class RenderItem
        {
            public RenderItemType Type { get; set; }
            public int Offset { get; set; }
            public DocumentTable? Table { get; set; }
            public DocumentLine? Line { get; set; }
        }

        private enum RenderItemType
        {
            Line,
            Table
        }

        private class StyleInfo
        {
            public bool IsBold { get; set; }
            public bool IsItalic { get; set; }
        }
    }
}
