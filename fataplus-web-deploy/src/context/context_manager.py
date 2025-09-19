"""
Fataplus Context Management System
Comprehensive agricultural knowledge base management with AI-powered features
"""

import os
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import structlog

logger = structlog.get_logger(__name__)


class ContentType(Enum):
    """Types of agricultural content"""
    ARTICLE = "article"
    GUIDE = "guide"
    CASE_STUDY = "case_study"
    RESEARCH = "research"
    NEWS = "news"
    TUTORIAL = "tutorial"
    FAQ = "faq"
    DATASET = "dataset"


class Domain(Enum):
    """Agricultural domains"""
    AGRITECH = "agritech"
    AGRIBUSINESS = "agribusiness"
    AGRICOACHING = "agricoaching"


class ContentStatus(Enum):
    """Content lifecycle status"""
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DEPRECATED = "deprecated"


@dataclass
class ContextDocument:
    """Agricultural context document"""
    id: str
    domain: Domain
    topic: str
    subtopic: Optional[str]
    title: Dict[str, str]  # Multi-language titles
    content: Dict[str, Any]  # Structured content
    metadata: Dict[str, Any]
    status: ContentStatus
    author: str
    reviewer: Optional[str]
    tags: List[str]
    related_contexts: List[str]
    quality_score: float
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "domain": self.domain.value,
            "topic": self.topic,
            "subtopic": self.subtopic,
            "title": self.title,
            "content": self.content,
            "metadata": self.metadata,
            "status": self.status.value,
            "author": self.author,
            "reviewer": self.reviewer,
            "tags": self.tags,
            "related_contexts": self.related_contexts,
            "quality_score": self.quality_score,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "published_at": self.published_at.isoformat() if self.published_at else None
        }


@dataclass
class TaxonomyNode:
    """Taxonomy node for organizing content"""
    id: str
    name: Dict[str, str]  # Multi-language names
    parent_id: Optional[str]
    domain: Domain
    level: int
    description: Dict[str, str]
    children: List[str] = None
    content_count: int = 0

    def __post_init__(self):
        if self.children is None:
            self.children = []


@dataclass
class SearchResult:
    """Search result with relevance scoring"""
    document: ContextDocument
    relevance_score: float
    matched_terms: List[str]
    highlights: Dict[str, List[str]]


class ContextManager:
    """Advanced context management system"""

    def __init__(self):
        # Database connections
        self.db_pool = self._init_database()
        self.redis_client = self._init_redis()

        # Configuration
        self.default_language = os.getenv("DEFAULT_LANGUAGE", "en")
        self.supported_languages = ["en", "fr", "sw", "ar", "pt"]
        self.quality_threshold = float(os.getenv("QUALITY_THRESHOLD", "0.7"))

        # Cache configuration
        self.cache_ttl = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour

        logger.info("Context manager initialized")

    def _init_database(self):
        """Initialize database connection pool"""
        try:
            return psycopg2.connect(
                host=os.getenv("DB_HOST", "localhost"),
                port=int(os.getenv("DB_PORT", "5432")),
                database=os.getenv("DB_NAME", "fataplus"),
                user=os.getenv("DB_USER", "fataplus"),
                password=os.getenv("DB_PASSWORD", ""),
                cursor_factory=RealDictCursor
            )
        except Exception as e:
            logger.error("Failed to connect to database", error=str(e))
            raise

    def _init_redis(self):
        """Initialize Redis connection"""
        try:
            return redis.Redis(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", "6379")),
                db=int(os.getenv("REDIS_DB", "0")),
                decode_responses=True
            )
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            return None

    def create_context(self, context_data: Dict[str, Any], author: str) -> Optional[ContextDocument]:
        """Create new context document"""
        try:
            context_id = f"ctx_{uuid.uuid4().hex[:16]}"

            # Validate required fields
            if not all(k in context_data for k in ["domain", "topic", "title", "content"]):
                raise ValueError("Missing required fields")

            # Create context document
            context = ContextDocument(
                id=context_id,
                domain=Domain(context_data["domain"]),
                topic=context_data["topic"],
                subtopic=context_data.get("subtopic"),
                title=context_data["title"],
                content=context_data["content"],
                metadata=context_data.get("metadata", {}),
                status=ContentStatus.DRAFT,
                author=author,
                reviewer=None,
                tags=context_data.get("tags", []),
                related_contexts=context_data.get("related_contexts", []),
                quality_score=0.0,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                published_at=None
            )

            # Save to database
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO contexts (
                        id, domain, topic, subtopic, title, content, metadata,
                        status, author, reviewer, tags, related_contexts,
                        quality_score, created_at, updated_at, published_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    context.id,
                    context.domain.value,
                    context.topic,
                    context.subtopic,
                    json.dumps(context.title),
                    json.dumps(context.content),
                    json.dumps(context.metadata),
                    context.status.value,
                    context.author,
                    context.reviewer,
                    context.tags,
                    context.related_contexts,
                    context.quality_score,
                    context.created_at,
                    context.updated_at,
                    context.published_at
                ))

                self.db_pool.commit()

            # Clear related caches
            self._clear_context_cache(context_id)

            logger.info("Context created", context_id=context_id, author=author)

            return context

        except Exception as e:
            logger.error("Failed to create context", author=author, error=str(e))
            self.db_pool.rollback()
            return None

    def update_context(self, context_id: str, updates: Dict[str, Any], updated_by: str) -> bool:
        """Update context document"""
        try:
            with self.db_pool.cursor() as cursor:
                # Build update query dynamically
                update_fields = []
                update_values = []

                for field, value in updates.items():
                    if field in ["title", "content", "metadata", "tags", "related_contexts"]:
                        update_fields.append(f"{field} = %s")
                        update_values.append(json.dumps(value))
                    elif field == "status":
                        update_fields.append("status = %s")
                        update_values.append(value)
                    elif field == "reviewer":
                        update_fields.append("reviewer = %s")
                        update_values.append(value)
                    elif field in ["domain", "topic", "subtopic"]:
                        update_fields.append(f"{field} = %s")
                        update_values.append(value)

                if not update_fields:
                    return False

                update_fields.append("updated_at = %s")
                update_values.append(datetime.now(timezone.utc))

                update_values.append(context_id)

                query = f"""
                    UPDATE contexts
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                """

                cursor.execute(query, update_values)

                if cursor.rowcount > 0:
                    self.db_pool.commit()

                    # Clear cache
                    self._clear_context_cache(context_id)

                    # Log the update
                    logger.info("Context updated",
                              context_id=context_id,
                              updated_by=updated_by,
                              fields=list(updates.keys()))

                    return True

                return False

        except Exception as e:
            logger.error("Failed to update context",
                        context_id=context_id,
                        updated_by=updated_by,
                        error=str(e))
            self.db_pool.rollback()
            return False

    def get_context(self, context_id: str, language: str = None) -> Optional[ContextDocument]:
        """Get context document by ID"""
        try:
            # Check cache first
            cache_key = f"context:{context_id}:{language or self.default_language}"
            cached = self._get_cached_context(cache_key)
            if cached:
                return cached

            with self.db_pool.cursor() as cursor:
                cursor.execute("SELECT * FROM contexts WHERE id = %s", (context_id,))
                result = cursor.fetchone()

                if not result:
                    return None

                context = self._row_to_context_document(result)

                # Cache the result
                self._cache_context(cache_key, context)

                return context

        except Exception as e:
            logger.error("Failed to get context", context_id=context_id, error=str(e))
            return None

    def search_contexts(self, query: str, filters: Dict[str, Any] = None,
                       language: str = None, limit: int = 20) -> List[SearchResult]:
        """Advanced context search with relevance scoring"""
        try:
            if not filters:
                filters = {}

            # Build search query
            search_conditions = []
            search_params = []

            # Text search in title and content
            if query:
                search_conditions.append("""
                    (title->>%s ILIKE %s OR content->>'summary' ILIKE %s)
                """)
                lang = language or self.default_language
                search_term = f"%{query}%"
                search_params.extend([lang, search_term, search_term])

            # Apply filters
            if "domain" in filters:
                search_conditions.append("domain = %s")
                search_params.append(filters["domain"])

            if "topic" in filters:
                search_conditions.append("topic = %s")
                search_params.append(filters["topic"])

            if "status" in filters:
                search_conditions.append("status = %s")
                search_params.append(filters["status"])

            if "tags" in filters:
                search_conditions.append("tags && %s")
                search_params.append(filters["tags"])

            # Build final query
            where_clause = " AND ".join(search_conditions) if search_conditions else "TRUE"

            sql_query = f"""
                SELECT *,
                       CASE
                           WHEN title->>%s ILIKE %s THEN 1.0
                           WHEN content->>'summary' ILIKE %s THEN 0.8
                           ELSE 0.6
                       END as relevance_score
                FROM contexts
                WHERE {where_clause} AND status = 'published'
                ORDER BY relevance_score DESC, updated_at DESC
                LIMIT %s
            """

            # Add language and search parameters for scoring
            lang = language or self.default_language
            search_term = f"%{query}%" if query else ""
            search_params.extend([lang, search_term, search_term, limit])

            with self.db_pool.cursor() as cursor:
                cursor.execute(sql_query, search_params)
                results = cursor.fetchall()

                search_results = []
                for row in results:
                    context = self._row_to_context_document(row)
                    relevance_score = float(row.get("relevance_score", 0.5))

                    # Extract matched terms and highlights
                    matched_terms, highlights = self._extract_search_highlights(
                        context, query, language or self.default_language
                    )

                    search_result = SearchResult(
                        document=context,
                        relevance_score=relevance_score,
                        matched_terms=matched_terms,
                        highlights=highlights
                    )

                    search_results.append(search_result)

                return search_results

        except Exception as e:
            logger.error("Context search failed", query=query, error=str(e))
            return []

    def publish_context(self, context_id: str, reviewer: str) -> bool:
        """Publish context document"""
        try:
            updates = {
                "status": ContentStatus.PUBLISHED.value,
                "reviewer": reviewer,
                "published_at": datetime.now(timezone.utc)
            }

            success = self.update_context(context_id, updates, reviewer)

            if success:
                # Update taxonomy counts
                context = self.get_context(context_id)
                if context:
                    self._update_taxonomy_counts(context.topic, 1)

                logger.info("Context published",
                          context_id=context_id,
                          reviewer=reviewer)

            return success

        except Exception as e:
            logger.error("Failed to publish context",
                        context_id=context_id,
                        reviewer=reviewer,
                        error=str(e))
            return False

    def archive_context(self, context_id: str, archived_by: str) -> bool:
        """Archive context document"""
        try:
            updates = {
                "status": ContentStatus.ARCHIVED.value
            }

            success = self.update_context(context_id, updates, archived_by)

            if success:
                # Update taxonomy counts
                context = self.get_context(context_id)
                if context:
                    self._update_taxonomy_counts(context.topic, -1)

                logger.info("Context archived",
                          context_id=context_id,
                          archived_by=archived_by)

            return success

        except Exception as e:
            logger.error("Failed to archive context",
                        context_id=context_id,
                        archived_by=archived_by,
                        error=str(e))
            return False

    def get_taxonomy(self, domain: Domain = None) -> Dict[str, TaxonomyNode]:
        """Get taxonomy structure"""
        try:
            with self.db_pool.cursor() as cursor:
                if domain:
                    cursor.execute("""
                        SELECT * FROM taxonomies
                        WHERE domain = %s
                        ORDER BY level, name->>'en'
                    """, (domain.value,))
                else:
                    cursor.execute("""
                        SELECT * FROM taxonomies
                        ORDER BY domain, level, name->>'en'
                    """)

                results = cursor.fetchall()

                taxonomy = {}
                for row in results:
                    node = TaxonomyNode(
                        id=row["id"],
                        name=row["name"],
                        parent_id=row.get("parent_id"),
                        domain=Domain(row["domain"]),
                        level=row["level"],
                        description=row["description"],
                        content_count=row.get("content_count", 0)
                    )

                    # Build hierarchy
                    if node.parent_id:
                        if node.parent_id in taxonomy:
                            taxonomy[node.parent_id].children.append(node.id)
                    else:
                        node.level = 0  # Root level

                    taxonomy[node.id] = node

                return taxonomy

        except Exception as e:
            logger.error("Failed to get taxonomy", error=str(e))
            return {}

    def get_context_stats(self) -> Dict[str, Any]:
        """Get comprehensive context statistics"""
        try:
            with self.db_pool.cursor() as cursor:
                # Overall statistics
                cursor.execute("""
                    SELECT
                        COUNT(*) as total_contexts,
                        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_contexts,
                        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_contexts,
                        COUNT(CASE WHEN status = 'review' THEN 1 END) as review_contexts,
                        COUNT(DISTINCT domain) as domains_count,
                        COUNT(DISTINCT topic) as topics_count,
                        AVG(quality_score) as avg_quality_score
                    FROM contexts
                """)

                overall_stats = cursor.fetchone()

                # Domain breakdown
                cursor.execute("""
                    SELECT
                        domain,
                        COUNT(*) as context_count,
                        AVG(quality_score) as avg_quality
                    FROM contexts
                    WHERE status = 'published'
                    GROUP BY domain
                    ORDER BY context_count DESC
                """)

                domain_stats = cursor.fetchall()

                # Recent activity
                cursor.execute("""
                    SELECT
                        DATE_TRUNC('day', created_at) as date,
                        COUNT(*) as contexts_created
                    FROM contexts
                    WHERE created_at >= NOW() - INTERVAL '30 days'
                    GROUP BY DATE_TRUNC('day', created_at)
                    ORDER BY date DESC
                """)

                activity_stats = cursor.fetchall()

                return {
                    "overall": dict(overall_stats),
                    "by_domain": [dict(row) for row in domain_stats],
                    "activity": [dict(row) for row in activity_stats],
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

        except Exception as e:
            logger.error("Failed to get context stats", error=str(e))
            return {}

    def validate_context_quality(self, context_id: str) -> Dict[str, Any]:
        """Validate and score context quality"""
        try:
            context = self.get_context(context_id)
            if not context:
                return {"valid": False, "error": "Context not found"}

            quality_checks = {
                "has_title": bool(context.title.get(self.default_language)),
                "has_summary": bool(context.content.get("summary", {}).get(self.default_language)),
                "has_content": bool(context.content.get("details")),
                "has_metadata": bool(context.metadata),
                "has_tags": len(context.tags) > 0,
                "has_author": bool(context.author),
                "content_length": len(str(context.content)) > 100,
                "language_coverage": len([lang for lang in self.supported_languages
                                        if context.title.get(lang)]) / len(self.supported_languages)
            }

            # Calculate quality score
            weights = {
                "has_title": 0.2,
                "has_summary": 0.15,
                "has_content": 0.2,
                "has_metadata": 0.1,
                "has_tags": 0.1,
                "has_author": 0.1,
                "content_length": 0.1,
                "language_coverage": 0.05
            }

            quality_score = sum(
                weights[check] * (1.0 if quality_checks[check] else 0.0)
                for check in weights.keys()
            )

            # Language coverage bonus
            if quality_checks["language_coverage"] > 0.5:
                quality_score += 0.05

            quality_score = min(quality_score, 1.0)

            # Update quality score in database
            self.update_context(context_id, {"quality_score": quality_score}, "system")

            return {
                "context_id": context_id,
                "quality_score": quality_score,
                "checks": quality_checks,
                "recommendations": self._generate_quality_recommendations(quality_checks),
                "valid": quality_score >= self.quality_threshold
            }

        except Exception as e:
            logger.error("Quality validation failed", context_id=context_id, error=str(e))
            return {"valid": False, "error": str(e)}

    def _row_to_context_document(self, row: Dict[str, Any]) -> ContextDocument:
        """Convert database row to ContextDocument"""
        return ContextDocument(
            id=row["id"],
            domain=Domain(row["domain"]),
            topic=row["topic"],
            subtopic=row["subtopic"],
            title=row["title"],
            content=row["content"],
            metadata=row["metadata"],
            status=ContentStatus(row["status"]),
            author=row["author"],
            reviewer=row["reviewer"],
            tags=row["tags"],
            related_contexts=row["related_contexts"],
            quality_score=float(row["quality_score"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            published_at=row["published_at"]
        )

    def _extract_search_highlights(self, context: ContextDocument, query: str,
                                 language: str) -> Tuple[List[str], Dict[str, List[str]]]:
        """Extract search highlights and matched terms"""
        matched_terms = []
        highlights = {}

        if not query:
            return matched_terms, highlights

        query_lower = query.lower()

        # Check title
        title_text = context.title.get(language, "")
        if query_lower in title_text.lower():
            matched_terms.append("title")
            highlights["title"] = [title_text]

        # Check summary
        summary_text = context.content.get("summary", {}).get(language, "")
        if query_lower in summary_text.lower():
            matched_terms.append("summary")
            highlights["summary"] = [summary_text]

        # Check tags
        for tag in context.tags:
            if query_lower in tag.lower():
                matched_terms.append("tags")
                highlights.setdefault("tags", []).append(tag)

        return matched_terms, highlights

    def _update_taxonomy_counts(self, topic: str, delta: int):
        """Update taxonomy content counts"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    UPDATE taxonomies
                    SET content_count = GREATEST(0, content_count + %s)
                    WHERE name->>'en' = %s
                """, (delta, topic))
                self.db_pool.commit()
        except Exception as e:
            logger.error("Failed to update taxonomy counts", topic=topic, error=str(e))

    def _cache_context(self, key: str, context: ContextDocument):
        """Cache context document"""
        if self.redis_client:
            try:
                self.redis_client.setex(key, self.cache_ttl, json.dumps(context.to_dict()))
            except Exception as e:
                logger.error("Failed to cache context", key=key, error=str(e))

    def _get_cached_context(self, key: str) -> Optional[ContextDocument]:
        """Get cached context document"""
        if self.redis_client:
            try:
                cached = self.redis_client.get(key)
                if cached:
                    data = json.loads(cached)
                    return self._dict_to_context_document(data)
            except Exception as e:
                logger.error("Failed to get cached context", key=key, error=str(e))
        return None

    def _dict_to_context_document(self, data: Dict[str, Any]) -> ContextDocument:
        """Convert dictionary to ContextDocument"""
        return ContextDocument(
            id=data["id"],
            domain=Domain(data["domain"]),
            topic=data["topic"],
            subtopic=data["subtopic"],
            title=data["title"],
            content=data["content"],
            metadata=data["metadata"],
            status=ContentStatus(data["status"]),
            author=data["author"],
            reviewer=data["reviewer"],
            tags=data["tags"],
            related_contexts=data["related_contexts"],
            quality_score=data["quality_score"],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            published_at=datetime.fromisoformat(data["published_at"]) if data["published_at"] else None
        )

    def _clear_context_cache(self, context_id: str):
        """Clear context-related caches"""
        if self.redis_client:
            try:
                # Clear specific context caches
                pattern = f"context:{context_id}:*"
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)

                # Clear search caches (would need more sophisticated invalidation)
                logger.info("Context cache cleared", context_id=context_id)

            except Exception as e:
                logger.error("Failed to clear context cache", context_id=context_id, error=str(e))

    def _generate_quality_recommendations(self, checks: Dict[str, Any]) -> List[str]:
        """Generate quality improvement recommendations"""
        recommendations = []

        if not checks["has_title"]:
            recommendations.append("Add a descriptive title in at least one language")

        if not checks["has_summary"]:
            recommendations.append("Add a concise summary of the content")

        if not checks["has_content"]:
            recommendations.append("Add detailed content with practical information")

        if not checks["has_metadata"]:
            recommendations.append("Add metadata including difficulty level and reading time")

        if not checks["has_tags"]:
            recommendations.append("Add relevant tags for better discoverability")

        if not checks["has_author"]:
            recommendations.append("Specify the content author or source")

        if not checks["content_length"]:
            recommendations.append("Expand content to provide more comprehensive information")

        if checks["language_coverage"] < 0.5:
            recommendations.append("Add content in additional languages for broader reach")

        return recommendations


# Global context manager instance
context_manager = ContextManager()
