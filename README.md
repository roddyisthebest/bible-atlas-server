<div align="center">
  <h1>📍 Bible Atlas Server</h1>
  <p><strong>A comprehensive API for biblical places and geographical data</strong></p>
  
  <p>
    <a href="https://bible-atlas-server.xyz" target="_blank">
      <img src="https://img.shields.io/badge/🌐_Live_API-bible--atlas--server.xyz-blue?style=for-the-badge" alt="Live API" />
    </a>
  </p>
  
  <p>
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

## 🌟 Overview

Bible Atlas Server is a robust REST API that provides comprehensive data about biblical places, their geographical locations, historical context, and relationships. Built with NestJS and TypeScript, it serves as the backend for biblical geography applications and research tools.

### ✨ Key Features

- 🗺️ **Comprehensive Place Database** - Thousands of biblical locations with detailed information
- 🔍 **Advanced Search** - Search by name (English/Korean), biblical references, place types
- 📍 **Geospatial Data** - Precise coordinates and GeoJSON support for mapping
- 🔗 **Place Relationships** - Parent-child relationships between ancient and modern locations
- 📖 **Biblical References** - Verse citations and contextual information
- 👤 **User Features** - Bookmarks, likes, notes, and personal collections
- 🏷️ **Categorization** - Places organized by types (settlement, mountain, river, etc.)
- 🌐 **Multilingual** - Support for English and Korean descriptions

## 🚀 Live API

**Base URL:** `https://bible-atlas-server.xyz`

### 📋 Key Endpoints

```bash
# Get all places with search and filtering
GET /place?name=jerusalem&isModern=false&limit=10

# Get place details with relationships
GET /place/{id}

# Get places with coordinates for mapping
GET /place/with-representative-point

# Get place types and categories
GET /place-type

# Get biblical book statistics
GET /place/bible-book-count

# Get places by alphabet prefix
GET /place/prefix-count
```

### 🔍 Search Examples

```bash
# Search by name (supports both English and Korean)
curl "https://bible-atlas-server.xyz/place?name=jerusalem"

# Filter by place type
curl "https://bible-atlas-server.xyz/place?placeTypes=settlement,mountain"

# Get places by biblical book
curl "https://bible-atlas-server.xyz/place?bibleBook=Gen"

# Get ancient places only
curl "https://bible-atlas-server.xyz/place?isModern=false"
```

## 🛠️ Tech Stack

- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with role-based access
- **Deployment:** Docker + GitHub Actions
- **Reverse Proxy:** Caddy with automatic HTTPS
- **Data Processing:** Cheerio for web scraping, Axios for HTTP requests

## 🏗️ Architecture

```
📦 bible-atlas-server/
├── 🔐 src/auth/          # Authentication & authorization
├── 📍 src/place/         # Place entities & business logic
├── 🏷️ src/place-type/    # Place categorization
├── 👤 src/user/          # User management
├── 📝 src/place-report/  # User-generated reports
├── 💡 src/proposal/      # Place suggestions
└── 🔧 src/common/        # Shared utilities
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/roddyisthebest/bible-atlas-server.git
cd bible-atlas-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run typeorm:migration:run

# Start development server
npm run start:dev
```

### 🐳 Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d

# The API will be available at http://localhost:3000
```

## 📊 Data Sources

The Bible Atlas Server aggregates data from multiple scholarly sources:

- **OpenBible.info** - Primary source for place identifications and relationships
- **Archaeological Surveys** - Modern archaeological site data
- **Biblical Texts** - Verse references and contextual information
- **Geographical Databases** - Coordinate data and GeoJSON geometries

## 🔄 Data Processing Pipeline

1. **Web Scraping** - Automated data collection from biblical geography sources
2. **Data Cleaning** - Deduplication and normalization
3. **Relationship Mapping** - Connecting ancient places with modern locations
4. **Geocoding** - Converting place names to precise coordinates
5. **Database Import** - Structured storage with full-text search capabilities

## 🌍 API Features

### Place Management
- ✅ CRUD operations for biblical places
- ✅ Advanced search with multiple filters
- ✅ Geospatial queries and mapping support
- ✅ Place relationships and hierarchies

### User Features
- ✅ User authentication and profiles
- ✅ Bookmarking and favorites
- ✅ Personal notes and annotations
- ✅ Place reporting and corrections

### Data Analytics
- ✅ Biblical book statistics
- ✅ Place type distributions
- ✅ Alphabetical indexing
- ✅ Usage analytics and metrics

## 🔧 Development

### Available Scripts

```bash
# Development
npm run start:dev      # Start with hot reload
npm run start:debug    # Start with debugging

# Production
npm run build          # Build for production
npm run start:prod     # Start production server

# Database
npm run typeorm:migration:generate  # Generate migrations
npm run typeorm:migration:run       # Run migrations

# Testing
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Test coverage
```

### 🔐 Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=bible_atlas

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=4343
NODE_ENV=development
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenBible.info](https://www.openbible.info) for geographical data
- [NestJS](https://nestjs.com) for the amazing framework
- All contributors and supporters of this project

---

<div align="center">
  <p>Made with ❤️ for biblical geography research</p>
  <p>
    <a href="https://bible-atlas-server.xyz">🌐 Live API</a> |
    <a href="https://github.com/roddyisthebest/bible-atlas-server/issues">🐛 Report Bug</a> |
    <a href="https://github.com/roddyisthebest/bible-atlas-server/issues">💡 Request Feature</a>
  </p>
</div>
