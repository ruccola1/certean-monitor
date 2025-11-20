# API Integration - Critical Rules

**Date:** 2025-11-20  
**Status:** MANDATORY - DO NOT VIOLATE

---

## The Problem

During implementation of Step 1 and Step 2, fake/simulated endpoints were created that:
- Sleep for X seconds
- Return hardcoded dummy data
- Don't call any real AI
- Don't do any real research
- Provide zero actual value

**This is completely unacceptable and wasted significant time.**

---

## The Rule

### NEVER CREATE FAKE/SIMULATED API SOLUTIONS

When implementing ANY backend functionality (Steps 1, 2, 3, 4, 5, etc.):

### ❌ NEVER DO THIS:

```python
# FAKE - DO NOT DO THIS
async def execute_step1(product_id: str):
    await asyncio.sleep(8)  # Fake processing time
    
    # Hardcoded dummy data
    fake_results = {
        "assessments": [
            {
                "componentName": "Main Circuit Board",
                "complianceRequirements": ["EMC Directive..."],
                # ... more fake data
            }
        ],
        "aiModel": "Simulated (Demo)"  # NOT REAL
    }
    
    return fake_results
```

**Why this is wrong:**
- Provides no actual compliance intelligence
- Doesn't use the real AI that already exists
- Wastes user's time
- Creates technical debt
- Misleads stakeholders

### ✅ ALWAYS DO THIS:

```python
# REAL - Use actual certean-ai API
async def execute_step1(product_id: str):
    # 1. Get product data
    product = await get_product(product_id)
    
    # 2. Call REAL certean-ai pipeline
    from backend.workflows.pipeline_engine import pipeline_engine
    
    # 3. Execute REAL Step 1 with:
    #    - Real Tavily searches (4 parallel searches)
    #    - Real AI analysis (OpenAI + Claude + Perplexity)
    #    - Real prompts from MongoDB
    #    - Real compliance expert persona
    
    result = await pipeline_engine.execute_pipeline(
        pipeline_id=product_id,
        steps=[
            # Real Step 1 configuration
            PipelineStep(
                step_id="compliance_investigation",
                step_type="prompt",
                config={
                    "prompt_name": "compliance_investigation",  # REAL prompt from DB
                    # ... real configuration
                }
            )
        ],
        initial_input={
            "product_decomposition": product.get("step0Results"),
            "target_countries": product.get("markets"),
            # ... real data
        }
    )
    
    # 4. Return ACTUAL results from real AI
    return result
```

---

## What the REAL System Does

The `certean-ai` repository at `/Users/nicolaszander/Desktop/certean/dev/certean-ai` has:

### Real Pipeline Engine
- **File:** `backend/workflows/pipeline_engine.py`
- Sequential step execution
- Variable passing between steps
- Real service integration

### Real Services
- **OpenAI Service:** `backend/services/openai_service.py`
- **Claude Service:** `backend/services/claude_service.py`
- **Perplexity Service:** `backend/services/perplexity_service.py`
- **Tavily Service:** `backend/services/tavily_service.py` (web research)
- **Vector Service:** `backend/services/vector_service.py` (Pinecone)

### Real Prompts
- **Stored in MongoDB:** `c_ai` database, `prompts` collection
- Professional compliance expert personas
- Anti-hallucination protocols
- Structured output formatting

### Real Step 1 Process (Compliance Investigation)
According to `TECHNICAL_SPECIFICATION.md`:

1. **4 Parallel Tavily Searches:**
   - `{product} compliance requirements {countries} regulations`
   - `{product} safety standards certification {countries}`
   - `{product} regulatory testing requirements {countries}`
   - `{product} market surveillance compliance {countries}`

2. **Triple-AI Analysis:**
   - Component-level risk assessment
   - Test laboratory planning
   - Regulatory auditor perspective
   - Compliance manager strategy

3. **Output:**
   - Real compliance investigation document
   - Structured risk assessment
   - Official source references

---

## Implementation Checklist

Before implementing ANY step:

- [ ] Read `certean-ai` documentation for that step
- [ ] Find the REAL implementation in `certean-ai/backend/`
- [ ] Understand what services it uses
- [ ] Understand what prompts it needs
- [ ] Integrate with the REAL pipeline system
- [ ] Test with ACTUAL AI calls
- [ ] Verify REAL results are returned

**DO NOT:**
- [ ] Create fake endpoints
- [ ] Return dummy data
- [ ] Simulate processing with sleep()
- [ ] Hardcode example results
- [ ] Mark as "Simulated (Demo)"

---

## Reference Files

### certean-ai Repository
- `TECHNICAL_SPECIFICATION.md` - What each step actually does
- `STEP_BY_STEP_EXECUTION.md` - How pipeline works
- `backend/workflows/pipeline_engine.py` - Pipeline orchestration
- `backend/api/pipeline_routes.py` - Pipeline API endpoints
- `backend/services/` - Real AI service integrations

### This Repository
- `.cursorrules` - Design and API integration rules
- `API_ENDPOINTS.md` - Document actual endpoints
- `API_INTEGRATION_GUIDE.md` - How to integrate (TBD)

---

## Consequences of Violation

Creating fake/simulated solutions:
1. ✘ Wastes user's time testing fake functionality
2. ✘ Creates technical debt that must be refactored
3. ✘ Misleads stakeholders about system capabilities
4. ✘ Provides zero business value
5. ✘ Ignores existing, working infrastructure

**When in doubt: Research first, integrate with real systems, never fake it.**

---

**This rule applies to ALL steps (1, 2, 3, 4, 5+) and ALL backend functionality. No exceptions.**

