FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8002

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Services/AcasService/AcasService.csproj", "Services/AcasService/"]
RUN dotnet restore "Services/AcasService/AcasService.csproj"
COPY . .
WORKDIR "/src/Services/AcasService"
RUN dotnet build "AcasService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AcasService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AcasService.dll"]

