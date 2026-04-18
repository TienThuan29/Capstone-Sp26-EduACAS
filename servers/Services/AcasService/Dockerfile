FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8002

# Install Java 25 (required for JPlag)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    && wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add - \
    && echo "deb https://packages.adoptium.net/artifactory/deb $(cat /etc/os-release | grep VERSION_CODENAME | cut -d= -f2) main" > /etc/apt/sources.list.d/adoptium.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends temurin-25-jdk \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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
