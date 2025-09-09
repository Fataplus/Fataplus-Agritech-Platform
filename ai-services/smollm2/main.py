"""
Fataplus SmolLM2 AI Service
Agricultural AI assistant powered by SmolLM2 model
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import uvicorn
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    pipeline,
    BitsAndBytesConfig
)
import psycopg2
from psycopg2.extras import RealDictCursor
import redis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model and dependencies
model = None
tokenizer = None
db_pool = None
redis_client = None

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message to process")
    context: Optional[Dict[str, Any]] = Field(None, description="Contextual information")
    user_id: Optional[str] = Field(None, description="User identifier")
    session_id: Optional[str] = Field(None, description="Session identifier")
    temperature: Optional[float] = Field(0.7, description="Response temperature", ge=0.1, le=1.0)
    max_tokens: Optional[int] = Field(512, description="Maximum response tokens", ge=50, le=2048)

class ContextSearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    domain: Optional[str] = Field("agritech", description="Knowledge domain")
    language: Optional[str] = Field("en", description="Response language")
    limit: Optional[int] = Field(5, description="Number of results", ge=1, le=20)

class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Generation prompt")
    context: Optional[Dict[str, Any]] = Field(None, description="Contextual information")
    max_tokens: Optional[int] = Field(1024, description="Maximum tokens", ge=50, le=2048)
    temperature: Optional[float] = Field(0.8, description="Creativity level", ge=0.1, le=1.0)

def load_smollm2_model():
    """Load SmolLM2 model with optimized settings"""
    global model, tokenizer

    try:
        model_name = "HuggingFaceTB/SmolLM2-1.7B-Instruct"

        # Configure quantization for memory efficiency
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4"
        )

        logger.info(f"Loading SmolLM2 model: {model_name}")

        tokenizer = AutoTokenizer.from_pretrained(model_name)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=quantization_config,
            device_map="auto",
            torch_dtype=torch.float16,
            trust_remote_code=True
        )

        logger.info("SmolLM2 model loaded successfully")
        return True

    except Exception as e:
        logger.error(f"Failed to load SmolLM2 model: {e}")
        return False

def init_database():
    """Initialize database connection pool"""
    global db_pool

    try:
        db_pool = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "fataplus"),
            user=os.getenv("DB_USER", "fataplus"),
            password=os.getenv("DB_PASSWORD", ""),
            cursor_factory=RealDictCursor
        )
        logger.info("Database connection established")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        return False

def init_redis():
    """Initialize Redis connection"""
    global redis_client

    try:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            db=int(os.getenv("REDIS_DB", "0")),
            decode_responses=True
        )
        redis_client.ping()
        logger.info("Redis connection established")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Fataplus SmolLM2 AI Service")

    # Initialize components
    model_loaded = load_smollm2_model()
    db_connected = init_database()
    redis_connected = init_redis()

    if not model_loaded:
        logger.warning("Model loading failed, but continuing with limited functionality")

    if not db_connected:
        logger.warning("Database connection failed, but continuing with limited functionality")

    if not redis_connected:
        logger.warning("Redis connection failed, but continuing with limited functionality")

    yield

    # Shutdown
    logger.info("Shutting down Fataplus SmolLM2 AI Service")

    # Clean up resources
    if model is not None:
        del model
        torch.cuda.empty_cache()

    if db_pool is not None:
        db_pool.close()

# Initialize FastAPI app
app = FastAPI(
    title="Fataplus SmolLM2 AI Service",
    description="Agricultural AI assistant powered by SmolLM2",
    version="2.0.1",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://platform.fata.plus",
        "https://*.fata.plus"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    # Implementation depends on your auth system
    # For now, accept any token (implement proper verification)
    return credentials.credentials

def get_context_from_db(query: str, domain: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search for relevant context in database"""
    if not db_pool:
        logger.warning("Database not available, returning empty context")
        return []

    try:
        with db_pool.cursor() as cursor:
            # Simple text search - in production, use full-text search or vector similarity
            cursor.execute("""
                SELECT id, title, content, metadata
                FROM contexts
                WHERE domain = %s AND content->>'summary' ILIKE %s
                LIMIT %s
            """, (domain, f"%{query}%", limit))

            results = cursor.fetchall()
            return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"Context search failed: {e}")
        return []

def cache_response(key: str, response: Dict[str, Any], ttl: int = 3600):
    """Cache response in Redis"""
    if redis_client:
        try:
            redis_client.setex(key, ttl, json.dumps(response))
        except Exception as e:
            logger.error(f"Cache write failed: {e}")

def get_cached_response(key: str) -> Optional[Dict[str, Any]]:
    """Get cached response from Redis"""
    if redis_client:
        try:
            cached = redis_client.get(key)
            return json.loads(cached) if cached else None
        except Exception as e:
            logger.error(f"Cache read failed: {e}")
    return None

def generate_agricultural_prompt(base_prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
    """Generate agricultural-specific prompt with context"""
    system_prompt = """You are an expert agricultural technology consultant specializing in African agriculture.
You have extensive knowledge of modern farming techniques, precision agriculture, and sustainable farming practices.

Your expertise includes:
- Precision farming techniques
- IoT sensor integration
- Data-driven decision making
- Sustainable agriculture practices
- Climate-smart agriculture
- Digital farm management

When providing advice:
1. Consider local climate conditions and soil types
2. Account for available technology and budget constraints
3. Emphasize sustainable and profitable farming methods
4. Provide practical, actionable recommendations
5. Always prioritize farmer success and agricultural sustainability"""

    if context:
        # Add context-specific information
        if "location" in context:
            system_prompt += f"\n\nRegional focus: {context['location']}"
        if "crop_type" in context:
            system_prompt += f"\nPrimary crop: {context['crop_type']}"
        if "farm_size" in context:
            system_prompt += f"\nFarm size: {context['farm_size']} hectares"

    return f"{system_prompt}\n\nUser: {base_prompt}\n\nAssistant:"

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Fataplus SmolLM2 AI Service",
        "version": "2.0.1",
        "model": "SmolLM2-1.7B-Instruct",
        "status": "running" if model is not None else "model_not_loaded",
        "endpoints": {
            "chat": "/chat",
            "context_search": "/context/search",
            "generate": "/generate",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "smollm2-ai-service",
        "version": "2.0.1",
        "components": {
            "model": "loaded" if model is not None else "not_loaded",
            "database": "connected" if db_pool else "disconnected",
            "redis": "connected" if redis_client else "disconnected"
        }
    }

    # Check if all critical components are working
    if model is None:
        health_status["status"] = "degraded"

    return health_status

@app.post("/chat")
async def chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_token)
):
    """Chat with SmolLM2 AI assistant"""
    try:
        # Check cache first
        cache_key = f"chat:{hash(request.message + str(request.context))}"
        cached_response = get_cached_response(cache_key)
        if cached_response:
            return cached_response

        if model is None or tokenizer is None:
            raise HTTPException(
                status_code=503,
                detail="AI model not available. Please try again later."
            )

        # Get relevant context
        context_data = []
        if request.context and "query" in request.context:
            context_data = get_context_from_db(
                request.context["query"],
                request.context.get("domain", "agritech"),
                3
            )

        # Generate agricultural prompt
        prompt = generate_agricultural_prompt(request.message, request.context)

        # Tokenize input
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)

        # Move to GPU if available
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}

        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=request.max_tokens or 512,
                temperature=request.temperature or 0.7,
                top_p=0.9,
                top_k=40,
                repetition_penalty=1.1,
                do_sample=True,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id
            )

        # Decode response
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Extract assistant's response (remove the prompt)
        if "Assistant:" in response_text:
            response_text = response_text.split("Assistant:")[-1].strip()

        response = {
            "response": response_text,
            "model": "SmolLM2-1.7B-Instruct",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "context_used": len(context_data) > 0,
            "context_count": len(context_data),
            "tokens_used": len(tokenizer.encode(response_text)),
            "user_id": request.user_id,
            "session_id": request.session_id
        }

        # Cache response
        background_tasks.add_task(cache_response, cache_key, response, 1800)  # 30 minutes

        return response

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

@app.post("/context/search")
async def search_context(
    request: ContextSearchRequest,
    token: str = Depends(verify_token)
):
    """Search agricultural knowledge base"""
    try:
        # Check cache
        cache_key = f"context_search:{hash(request.query + request.domain)}"
        cached_response = get_cached_response(cache_key)
        if cached_response:
            return cached_response

        # Search database
        results = get_context_from_db(
            request.query,
            request.domain,
            request.limit
        )

        response = {
            "query": request.query,
            "domain": request.domain,
            "results": results,
            "total_results": len(results),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Cache for 1 hour
        cache_response(cache_key, response, 3600)

        return response

    except Exception as e:
        logger.error(f"Context search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/generate")
async def generate(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_token)
):
    """Generate content using SmolLM2"""
    try:
        # Check cache
        cache_key = f"generate:{hash(request.prompt + str(request.context))}"
        cached_response = get_cached_response(cache_key)
        if cached_response:
            return cached_response

        if model is None or tokenizer is None:
            raise HTTPException(
                status_code=503,
                detail="AI model not available. Please try again later."
            )

        # Generate prompt
        prompt = request.prompt
        if request.context:
            prompt = generate_agricultural_prompt(request.prompt, request.context)

        # Tokenize and generate
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)

        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=request.max_tokens or 1024,
                temperature=request.temperature or 0.8,
                top_p=0.9,
                top_k=50,
                repetition_penalty=1.1,
                do_sample=True,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id
            )

        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Clean up response
        if "Assistant:" in generated_text:
            generated_text = generated_text.split("Assistant:")[-1].strip()

        response = {
            "generated_text": generated_text,
            "model": "SmolLM2-1.7B-Instruct",
            "prompt": request.prompt,
            "tokens_used": len(tokenizer.encode(generated_text)),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Cache for 2 hours
        background_tasks.add_task(cache_response, cache_key, response, 7200)

        return response

    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8002")),
        reload=False,
        log_level="info"
    )
