"""
Context Management API Routes
FastAPI routes for agricultural knowledge base management
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
import structlog

from .context_manager import context_manager, ContextDocument, Domain, ContentStatus, ContentType
from ..auth.auth_service import auth_service, User, Permission

logger = structlog.get_logger(__name__)

# Router
router = APIRouter(prefix="/context", tags=["Context Management"])

# Pydantic models
class ContextCreateRequest(BaseModel):
    """Context creation request model"""
    domain: str = Field(..., description="Agricultural domain")
    topic: str = Field(..., description="Main topic")
    subtopic: Optional[str] = Field(None, description="Sub-topic")
    title: Dict[str, str] = Field(..., description="Multi-language titles")
    content: Dict[str, Any] = Field(..., description="Structured content")
    metadata: Optional[Dict[str, Any]] = Field({}, description="Additional metadata")
    tags: Optional[List[str]] = Field([], description="Content tags")
    related_contexts: Optional[List[str]] = Field([], description="Related context IDs")

    @validator('domain')
    def validate_domain(cls, v):
        try:
            Domain(v)
            return v
        except ValueError:
            raise ValueError(f'Invalid domain: {v}')

class ContextUpdateRequest(BaseModel):
    """Context update request model"""
    title: Optional[Dict[str, str]] = None
    content: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    related_contexts: Optional[List[str]] = None
    status: Optional[str] = None

class ContextSearchRequest(BaseModel):
    """Context search request model"""
    query: str = Field(..., description="Search query")
    domain: Optional[str] = Field(None, description="Filter by domain")
    topic: Optional[str] = Field(None, description="Filter by topic")
    language: Optional[str] = Field("en", description="Search language")
    status: Optional[str] = Field("published", description="Content status")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    limit: int = Field(20, description="Maximum results", ge=1, le=100)

class ContextPublishRequest(BaseModel):
    """Context publish request model"""
    context_id: str = Field(..., description="Context ID to publish")

class TaxonomyQuery(BaseModel):
    """Taxonomy query model"""
    domain: Optional[str] = Field(None, description="Filter by domain")
    include_content_counts: bool = Field(True, description="Include content counts")

class QualityCheckRequest(BaseModel):
    """Quality check request model"""
    context_id: str = Field(..., description="Context ID to check")

# Dependencies
def require_content_permission():
    """Require content management permission"""
    def permission_checker(current_user: User = Depends(auth_service.get_current_user)):
        if not current_user.has_permission(Permission.WRITE_CONTENT):
            raise HTTPException(
                status_code=403,
                detail="Content management permission required"
            )
        return current_user
    return permission_checker

def require_publish_permission():
    """Require content publishing permission"""
    def permission_checker(current_user: User = Depends(auth_service.get_current_user)):
        if not current_user.has_permission(Permission.PUBLISH_CONTENT):
            raise HTTPException(
                status_code=403,
                detail="Content publishing permission required"
            )
        return current_user
    return permission_checker

# Routes
@router.post("/", response_model=Dict[str, Any])
async def create_context(
    context_data: ContextCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_content_permission())
):
    """Create new context document"""
    try:
        # Convert request to dict and add author
        context_dict = context_data.dict()
        context_dict["author"] = current_user.id

        context = context_manager.create_context(context_dict, current_user.id)

        if not context:
            raise HTTPException(status_code=500, detail="Failed to create context")

        # Trigger quality check in background
        background_tasks.add_task(context_manager.validate_context_quality, context.id)

        logger.info("Context created",
                   context_id=context.id,
                   author=current_user.id,
                   domain=context.domain.value)

        return {
            "message": "Context created successfully",
            "context": context.to_dict(),
            "quality_check_scheduled": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Context creation failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Context creation failed")

@router.get("/{context_id}", response_model=Dict[str, Any])
async def get_context(
    context_id: str,
    language: Optional[str] = Query("en", description="Response language"),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get context document by ID"""
    try:
        context = context_manager.get_context(context_id, language)

        if not context:
            raise HTTPException(status_code=404, detail="Context not found")

        # Check if user can access this context
        if context.status != ContentStatus.PUBLISHED and not current_user.has_permission(Permission.READ_CONTENT):
            raise HTTPException(status_code=403, detail="Access denied")

        return {
            "context": context.to_dict(),
            "language": language,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get context",
                    context_id=context_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get context")

@router.put("/{context_id}", response_model=Dict[str, Any])
async def update_context(
    context_id: str,
    updates: ContextUpdateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_content_permission())
):
    """Update context document"""
    try:
        update_data = {k: v for k, v in updates.dict().items() if v is not None}

        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")

        # Validate status if provided
        if "status" in update_data:
            try:
                ContentStatus(update_data["status"])
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid status")

        success = context_manager.update_context(context_id, update_data, current_user.id)

        if not success:
            raise HTTPException(status_code=404, detail="Context not found")

        # Re-run quality check if content was updated
        if "content" in update_data or "title" in update_data:
            background_tasks.add_task(context_manager.validate_context_quality, context_id)

        # Get updated context
        updated_context = context_manager.get_context(context_id)

        logger.info("Context updated",
                   context_id=context_id,
                   user_id=current_user.id,
                   fields=list(update_data.keys()))

        return {
            "message": "Context updated successfully",
            "context": updated_context.to_dict() if updated_context else None,
            "quality_check_scheduled": "content" in update_data or "title" in update_data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Context update failed",
                    context_id=context_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Context update failed")

@router.delete("/{context_id}", response_model=Dict[str, Any])
async def delete_context(
    context_id: str,
    current_user: User = Depends(require_content_permission())
):
    """Delete context document"""
    try:
        # For now, we'll archive instead of delete
        success = context_manager.archive_context(context_id, current_user.id)

        if not success:
            raise HTTPException(status_code=404, detail="Context not found")

        logger.info("Context archived",
                   context_id=context_id,
                   user_id=current_user.id)

        return {
            "message": "Context archived successfully",
            "context_id": context_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Context deletion failed",
                    context_id=context_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Context deletion failed")

@router.post("/search", response_model=Dict[str, Any])
async def search_contexts(
    search_request: ContextSearchRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Search context documents"""
    try:
        filters = {
            "domain": search_request.domain,
            "topic": search_request.topic,
            "status": search_request.status,
            "tags": search_request.tags
        }

        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}

        results = context_manager.search_contexts(
            search_request.query,
            filters,
            search_request.language,
            search_request.limit
        )

        search_results = []
        for result in results:
            search_results.append({
                "context": result.document.to_dict(),
                "relevance_score": result.relevance_score,
                "matched_terms": result.matched_terms,
                "highlights": result.highlights
            })

        logger.info("Context search performed",
                   user_id=current_user.id,
                   query=search_request.query,
                   results_count=len(search_results))

        return {
            "query": search_request.query,
            "filters": filters,
            "results": search_results,
            "total_results": len(search_results),
            "language": search_request.language,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Context search failed",
                    user_id=current_user.id,
                    query=search_request.query,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Search failed")

@router.post("/{context_id}/publish", response_model=Dict[str, Any])
async def publish_context(
    context_id: str,
    current_user: User = Depends(require_publish_permission())
):
    """Publish context document"""
    try:
        success = context_manager.publish_context(context_id, current_user.id)

        if not success:
            raise HTTPException(status_code=404, detail="Context not found")

        logger.info("Context published",
                   context_id=context_id,
                   user_id=current_user.id)

        return {
            "message": "Context published successfully",
            "context_id": context_id,
            "published_by": current_user.id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Context publish failed",
                    context_id=context_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Publish failed")

@router.post("/{context_id}/archive", response_model=Dict[str, Any])
async def archive_context(
    context_id: str,
    current_user: User = Depends(require_content_permission())
):
    """Archive context document"""
    try:
        success = context_manager.archive_context(context_id, current_user.id)

        if not success:
            raise HTTPException(status_code=404, detail="Context not found")

        logger.info("Context archived",
                   context_id=context_id,
                   user_id=current_user.id)

        return {
            "message": "Context archived successfully",
            "context_id": context_id,
            "archived_by": current_user.id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Context archive failed",
                    context_id=context_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Archive failed")

@router.get("/taxonomy/tree", response_model=Dict[str, Any])
async def get_taxonomy_tree(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get taxonomy tree structure"""
    try:
        domain_filter = Domain(domain) if domain else None
        taxonomy = context_manager.get_taxonomy(domain_filter)

        # Convert to hierarchical structure
        tree = {}
        root_nodes = []

        for node_id, node in taxonomy.items():
            node_dict = {
                "id": node.id,
                "name": node.name,
                "description": node.description,
                "level": node.level,
                "content_count": node.content_count,
                "children": []
            }

            if node.parent_id:
                # Add to parent's children
                if node.parent_id in tree:
                    tree[node.parent_id]["children"].append(node_dict)
            else:
                # Root node
                root_nodes.append(node_dict)

            tree[node_id] = node_dict

        logger.info("Taxonomy tree retrieved",
                   user_id=current_user.id,
                   domain=domain)

        return {
            "taxonomy": root_nodes,
            "total_nodes": len(taxonomy),
            "domain": domain,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Taxonomy retrieval failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Taxonomy retrieval failed")

@router.post("/{context_id}/quality", response_model=Dict[str, Any])
async def check_context_quality(
    context_id: str,
    current_user: User = Depends(require_content_permission())
):
    """Check context quality and get recommendations"""
    try:
        quality_report = context_manager.validate_context_quality(context_id)

        if not quality_report.get("valid", False):
            if "error" in quality_report:
                raise HTTPException(status_code=404, detail=quality_report["error"])

        logger.info("Quality check performed",
                   context_id=context_id,
                   user_id=current_user.id,
                   score=quality_report.get("quality_score", 0))

        return {
            "context_id": context_id,
            "quality_report": quality_report,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Quality check failed",
                    context_id=context_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Quality check failed")

@router.get("/stats/overview", response_model=Dict[str, Any])
async def get_context_stats(current_user: User = Depends(auth_service.get_current_user)):
    """Get context statistics overview"""
    try:
        stats = context_manager.get_context_stats()

        return {
            "stats": stats,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generated_by": current_user.id
        }

    except Exception as e:
        logger.error("Stats retrieval failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Stats retrieval failed")

@router.get("/list", response_model=Dict[str, Any])
async def list_contexts(
    page: int = Query(1, description="Page number", ge=1),
    limit: int = Query(20, description="Items per page", ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    author: Optional[str] = Query(None, description="Filter by author"),
    sort_by: str = Query("updated_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    current_user: User = Depends(auth_service.get_current_user)
):
    """List contexts with pagination and filtering"""
    try:
        # This would implement actual listing with pagination
        # For now, return placeholder response
        return {
            "contexts": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "total_pages": 0,
            "filters": {
                "status": status,
                "domain": domain,
                "author": author
            },
            "sort": {
                "by": sort_by,
                "order": sort_order
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Context listing failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Context listing failed")

@router.post("/bulk/publish", response_model=Dict[str, Any])
async def bulk_publish_contexts(
    context_ids: List[str],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_publish_permission())
):
    """Bulk publish multiple contexts"""
    try:
        successful = []
        failed = []

        for context_id in context_ids:
            try:
                success = context_manager.publish_context(context_id, current_user.id)
                if success:
                    successful.append(context_id)
                else:
                    failed.append({"id": context_id, "error": "Context not found"})
            except Exception as e:
                failed.append({"id": context_id, "error": str(e)})

        logger.info("Bulk publish completed",
                   user_id=current_user.id,
                   successful=len(successful),
                   failed=len(failed))

        return {
            "message": f"Bulk publish completed: {len(successful)} successful, {len(failed)} failed",
            "successful": successful,
            "failed": failed,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Bulk publish failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Bulk publish failed")

@router.post("/bulk/archive", response_model=Dict[str, Any])
async def bulk_archive_contexts(
    context_ids: List[str],
    current_user: User = Depends(require_content_permission())
):
    """Bulk archive multiple contexts"""
    try:
        successful = []
        failed = []

        for context_id in context_ids:
            try:
                success = context_manager.archive_context(context_id, current_user.id)
                if success:
                    successful.append(context_id)
                else:
                    failed.append({"id": context_id, "error": "Context not found"})
            except Exception as e:
                failed.append({"id": context_id, "error": str(e)})

        logger.info("Bulk archive completed",
                   user_id=current_user.id,
                   successful=len(successful),
                   failed=len(failed))

        return {
            "message": f"Bulk archive completed: {len(successful)} successful, {len(failed)} failed",
            "successful": successful,
            "failed": failed,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Bulk archive failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Bulk archive failed")
