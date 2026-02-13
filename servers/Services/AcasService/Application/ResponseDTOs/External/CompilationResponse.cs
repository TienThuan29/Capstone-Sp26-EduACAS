using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs.External;

public class ResultLine
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

public class BuildEnvDownloadInfo
{
    [JsonPropertyName("step")]
    public string Step { get; set; } = string.Empty;

    [JsonPropertyName("packageUrl")]
    public string PackageUrl { get; set; } = string.Empty;

    [JsonPropertyName("time")]
    public int Time { get; set; }
}

public class ExecutionOptions
{
    [JsonPropertyName("timeoutMs")]
    public int? TimeoutMs { get; set; }

    [JsonPropertyName("maxErrorOutput")]
    public int? MaxErrorOutput { get; set; }

    [JsonPropertyName("env")]
    public Dictionary<string, string>? Env { get; set; }

    [JsonPropertyName("wrapper")]
    public object? Wrapper { get; set; }

    [JsonPropertyName("maxOutput")]
    public int? MaxOutput { get; set; }

    [JsonPropertyName("ldPath")]
    public List<string>? LdPath { get; set; }

    [JsonPropertyName("appHome")]
    public string? AppHome { get; set; }

    [JsonPropertyName("customCwd")]
    public string? CustomCwd { get; set; }

    [JsonPropertyName("createAndUseTempDir")]
    public bool? CreateAndUseTempDir { get; set; }

    [JsonPropertyName("input")]
    public object? Input { get; set; }
}

public class CompilationResult
{
    [JsonPropertyName("code")]
    public int Code { get; set; }

    [JsonPropertyName("timedOut")]
    public bool TimedOut { get; set; }

    [JsonPropertyName("okToCache")]
    public bool? OkToCache { get; set; }

    [JsonPropertyName("buildResult")]
    public BuildResult? BuildResult { get; set; }

    [JsonPropertyName("buildsteps")]
    public List<CompilationResult>? Buildsteps { get; set; }

    [JsonPropertyName("inputFilename")]
    public string? InputFilename { get; set; }

    [JsonPropertyName("asm")]
    public List<object>? Asm { get; set; }

    [JsonPropertyName("asmSize")]
    public int? AsmSize { get; set; }

    [JsonPropertyName("devices")]
    public Dictionary<string, CompilationResult>? Devices { get; set; }

    [JsonPropertyName("stdout")]
    public List<ResultLine> Stdout { get; set; } = new List<ResultLine>();

    [JsonPropertyName("stderr")]
    public List<ResultLine> Stderr { get; set; } = new List<ResultLine>();

    [JsonPropertyName("truncated")]
    public bool? Truncated { get; set; }

    [JsonPropertyName("didExecute")]
    public bool? DidExecute { get; set; }

    [JsonPropertyName("validatorTool")]
    public bool? ValidatorTool { get; set; }

    [JsonPropertyName("executableFilename")]
    public string? ExecutableFilename { get; set; }

    [JsonPropertyName("execResult")]
    public CompilationResult? ExecResult { get; set; }

    [JsonPropertyName("gnatDebugOutput")]
    public List<ResultLine>? GnatDebugOutput { get; set; }

    [JsonPropertyName("gnatDebugTreeOutput")]
    public List<ResultLine>? GnatDebugTreeOutput { get; set; }

    [JsonPropertyName("tools")]
    public List<object>? Tools { get; set; }

    [JsonPropertyName("dirPath")]
    public string? DirPath { get; set; }

    [JsonPropertyName("compilationOptions")]
    public List<string>? CompilationOptions { get; set; }

    [JsonPropertyName("downloads")]
    public List<BuildEnvDownloadInfo>? Downloads { get; set; }

    [JsonPropertyName("gccDumpOutput")]
    public object? GccDumpOutput { get; set; }

    [JsonPropertyName("languageId")]
    public string? LanguageId { get; set; }

    [JsonPropertyName("result")]
    public CompilationResult? Result { get; set; }

    [JsonPropertyName("ppOutput")]
    public object? PpOutput { get; set; }

    [JsonPropertyName("optOutput")]
    public List<object>? OptOutput { get; set; }

    [JsonPropertyName("optPath")]
    public string? OptPath { get; set; }

    [JsonPropertyName("stackUsageOutput")]
    public List<object>? StackUsageOutput { get; set; }

    [JsonPropertyName("stackUsagePath")]
    public string? StackUsagePath { get; set; }

    [JsonPropertyName("astOutput")]
    public List<ResultLine>? AstOutput { get; set; }

    [JsonPropertyName("irOutput")]
    public object? IrOutput { get; set; }

    [JsonPropertyName("clangirOutput")]
    public List<ResultLine>? ClangirOutput { get; set; }

    [JsonPropertyName("optPipelineOutput")]
    public object? OptPipelineOutput { get; set; }

    [JsonPropertyName("cfg")]
    public object? Cfg { get; set; }

    [JsonPropertyName("rustMirOutput")]
    public List<ResultLine>? RustMirOutput { get; set; }

    [JsonPropertyName("rustMacroExpOutput")]
    public List<ResultLine>? RustMacroExpOutput { get; set; }

    [JsonPropertyName("rustHirOutput")]
    public List<ResultLine>? RustHirOutput { get; set; }

    [JsonPropertyName("haskellCoreOutput")]
    public List<ResultLine>? HaskellCoreOutput { get; set; }

    [JsonPropertyName("haskellStgOutput")]
    public List<ResultLine>? HaskellStgOutput { get; set; }

    [JsonPropertyName("haskellCmmOutput")]
    public List<ResultLine>? HaskellCmmOutput { get; set; }

    [JsonPropertyName("clojureMacroExpOutput")]
    public List<ResultLine>? ClojureMacroExpOutput { get; set; }

    [JsonPropertyName("yulOutput")]
    public List<ResultLine>? YulOutput { get; set; }

    [JsonPropertyName("forceBinaryView")]
    public bool? ForceBinaryView { get; set; }

    [JsonPropertyName("artifacts")]
    public List<object>? Artifacts { get; set; }

    [JsonPropertyName("hints")]
    public List<string>? Hints { get; set; }

    [JsonPropertyName("retreivedFromCache")]
    public bool? RetreivedFromCache { get; set; }

    [JsonPropertyName("retreivedFromCacheTime")]
    public int? RetreivedFromCacheTime { get; set; }

    [JsonPropertyName("packageDownloadAndUnzipTime")]
    public int? PackageDownloadAndUnzipTime { get; set; }

    [JsonPropertyName("packageStoreTime")]
    public int? PackageStoreTime { get; set; }

    [JsonPropertyName("execTime")]
    public int? ExecTime { get; set; }

    [JsonPropertyName("processExecutionResultTime")]
    public double? ProcessExecutionResultTime { get; set; }

    [JsonPropertyName("objdumpTime")]
    public int? ObjdumpTime { get; set; }

    [JsonPropertyName("parsingTime")]
    public int? ParsingTime { get; set; }

    [JsonPropertyName("queueTime")]
    public int? QueueTime { get; set; }

    [JsonPropertyName("source")]
    public string? Source { get; set; }

    [JsonPropertyName("instructionSet")]
    public string? InstructionSet { get; set; }

    [JsonPropertyName("popularArguments")]
    public Dictionary<string, object>? PopularArguments { get; set; }

    [JsonPropertyName("s3Key")]
    public string? S3Key { get; set; }
}

public class BuildResult : CompilationResult
{
    [JsonPropertyName("downloads")]
    public new List<BuildEnvDownloadInfo> Downloads { get; set; } = new List<BuildEnvDownloadInfo>();

    [JsonPropertyName("executableFilename")]
    public new string ExecutableFilename { get; set; } = string.Empty;

    [JsonPropertyName("compilationOptions")]
    public new List<string> CompilationOptions { get; set; } = new List<string>();

    [JsonPropertyName("preparedLdPaths")]
    public List<string>? PreparedLdPaths { get; set; }

    [JsonPropertyName("defaultExecOptions")]
    public ExecutionOptions? DefaultExecOptions { get; set; }

    [JsonPropertyName("packageStoreTime")]
    public new int? PackageStoreTime { get; set; }
}

public class RunBatchResponse : CompilationResult
{
    [JsonPropertyName("execResults")]
    public List<CompilationResult> ExecResults { get; set; } = new();
}
