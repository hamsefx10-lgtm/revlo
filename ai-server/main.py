"""
Revlo AI Server v4.0 — Cerebras (Primary) + Groq (Fallback) + Gemini (Fallback)
Cerebras: Llama 3.3 70B (1M tokens/day FREE!)
Auth: companyId + userId direct headers (no cookie needed)
"""

import os, json, traceback, httpx
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from knowledge import build_system_prompt

app = FastAPI(title="Revlo AI Server", version="4.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── API Keys ──
CEREBRAS_KEY = os.getenv("CEREBRAS_API_KEY", "")
GROQ_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
INTERNAL_KEY = os.getenv("AI_INTERNAL_KEY", "revlo-ai-internal-2026-secure")

# Cerebras (PRIMARY) — 1M tokens/day FREE, OpenAI-compatible
cerebras_client = None
if CEREBRAS_KEY:
    from cerebras.cloud.sdk import Cerebras
    cerebras_client = Cerebras(api_key=CEREBRAS_KEY)

# Groq (FALLBACK #1)
groq_client = None
if GROQ_KEY:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_KEY)

# Gemini (FALLBACK #2)
gemini_client = None
if GEMINI_KEY:
    try:
        from google import genai
        from google.genai import types as gemini_types
        gemini_client = genai.Client(api_key=GEMINI_KEY)
    except:
        pass

CEREBRAS_MODEL = "qwen-3-235b-a22b-instruct-2507"  # Only large model on Cerebras, cache reduces 429s
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
GEMINI_MODEL = "gemini-2.5-flash"
NEXTJS_URL = "http://localhost:3000"

conversations: dict[str, list] = {}

# Simple response cache (5 min TTL)
import time as _time
_cache: dict[str, tuple[str, float]] = {}
CACHE_TTL = 300  # 5 minutes

def get_cached(key: str) -> str | None:
    if key in _cache:
        text, ts = _cache[key]
        if _time.time() - ts < CACHE_TTL:
            return text
        del _cache[key]
    return None

def set_cache(key: str, text: str):
    _cache[key] = (text, _time.time())
    # Cleanup old entries
    now = _time.time()
    for k in list(_cache):
        if now - _cache[k][1] > CACHE_TTL:
            del _cache[k]

# ── OpenAI-style Tools for Groq ──
GROQ_TOOLS = [
    {"type": "function", "function": {
        "name": "get_shop_summary",
        "description": "Get shop overview: today's sales, products count, customers, employees",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }},
    {"type": "function", "function": {
        "name": "get_sales",
        "description": "Get sales for a period: today, yesterday, week, or month",
        "parameters": {"type": "object", "properties": {
            "period": {"type": "string", "enum": ["today","yesterday","week","month"]}
        }, "required": ["period"]}
    }},
    {"type": "function", "function": {
        "name": "search_customer",
        "description": "Search customer by name",
        "parameters": {"type": "object", "properties": {
            "name": {"type": "string"}
        }, "required": ["name"]}
    }},
    {"type": "function", "function": {
        "name": "get_low_stock",
        "description": "Get products with stock below minimum level",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }},
    {"type": "function", "function": {
        "name": "get_inventory",
        "description": "Get full inventory overview: products, values, profit margins",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }},
    {"type": "function", "function": {
        "name": "get_employees",
        "description": "Get employees list: name, role, salary, status",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }},
    {"type": "function", "function": {
        "name": "get_accounts",
        "description": "Get financial accounts: name, type, balance",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }},
    {"type": "function", "function": {
        "name": "get_expenses",
        "description": "Get monthly expenses breakdown",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }},
    {"type": "function", "function": {
        "name": "get_top_customers",
        "description": "Get top 10 customers by total purchases",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }},
    {"type": "function", "function": {
        "name": "search_product",
        "description": "Search product by name",
        "parameters": {"type": "object", "properties": {
            "name": {"type": "string"}
        }, "required": ["name"]}
    }},
    {"type": "function", "function": {
        "name": "create_customer",
        "description": "Create a new customer. Only when user explicitly requests it.",
        "parameters": {"type": "object", "properties": {
            "name": {"type": "string", "description": "Customer name"},
            "phone": {"type": "string", "description": "Phone number (optional)"},
            "type": {"type": "string", "enum": ["Individual","Business"]}
        }, "required": ["name"]}
    }},
    {"type": "function", "function": {
        "name": "create_product",
        "description": "Create a new product. Only when user explicitly requests it.",
        "parameters": {"type": "object", "properties": {
            "name": {"type": "string", "description": "Product name"},
            "sellingPrice": {"type": "string", "description": "Selling price"},
            "costPrice": {"type": "string", "description": "Cost price (optional)"},
            "stock": {"type": "string", "description": "Initial stock (optional)"},
            "category": {"type": "string", "description": "Category (optional)"}
        }, "required": ["name", "sellingPrice"]}
    }},
    {"type": "function", "function": {
        "name": "create_employee",
        "description": "Create a new employee. Only when user explicitly requests it.",
        "parameters": {"type": "object", "properties": {
            "name": {"type": "string", "description": "Employee name"},
            "role": {"type": "string", "description": "Job role"},
            "salary": {"type": "string", "description": "Monthly salary (optional)"},
            "phone": {"type": "string", "description": "Phone (optional)"}
        }, "required": ["name", "role"]}
    }},
    {"type": "function", "function": {
        "name": "adjust_stock",
        "description": "Adjust product stock level. Only when user explicitly requests it.",
        "parameters": {"type": "object", "properties": {
            "productName": {"type": "string", "description": "Product name"},
            "newStock": {"type": "string", "description": "New stock quantity"}
        }, "required": ["productName", "newStock"]}
    }},
    {"type": "function", "function": {
        "name": "create_sale",
        "description": "Create a manual sale entry. Records a sale of a product to a customer.",
        "parameters": {"type": "object", "properties": {
            "productName": {"type": "string", "description": "Product name to sell"},
            "customerName": {"type": "string", "description": "Customer name (optional, walk-in if not provided)"},
            "quantity": {"type": "string", "description": "Quantity to sell (default 1)"},
            "paidAmount": {"type": "string", "description": "Amount paid in ETB (default = full total)"},
            "paymentMethod": {"type": "string", "description": "Cash, eBirr, Bank Transfer", "enum": ["Cash","eBirr","Bank Transfer"]}
        }, "required": ["productName"]}
    }},
    {"type": "function", "function": {
        "name": "refund_sale",
        "description": "Refund/cancel a sale by invoice number. Restores stock and marks sale as refunded.",
        "parameters": {"type": "object", "properties": {
            "invoiceNumber": {"type": "string", "description": "Invoice number (e.g. AI-XXXXX or INV-XXXXX)"}
        }, "required": ["invoiceNumber"]}
    }},
    {"type": "function", "function": {
        "name": "delete_product",
        "description": "Delete a product from inventory. Only when user explicitly requests it.",
        "parameters": {"type": "object", "properties": {
            "productName": {"type": "string", "description": "Product name to delete"}
        }, "required": ["productName"]}
    }},
    {"type": "function", "function": {
        "name": "get_vendors",
        "description": "Get vendors/suppliers list with contact info and purchase history",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }},
    {"type": "function", "function": {
        "name": "get_purchases",
        "description": "Get recent purchase orders with vendor, status, and totals",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }},
    {"type": "function", "function": {
        "name": "settle_debt",
        "description": "Record a debt payment from a customer. Partially or fully settle outstanding balance.",
        "parameters": {"type": "object", "properties": {
            "customerName": {"type": "string", "description": "Customer name"},
            "amount": {"type": "string", "description": "Payment amount in ETB"},
            "paymentMethod": {"type": "string", "enum": ["Cash","eBirr","Bank Transfer"]}
        }, "required": ["customerName", "amount"]}
    }},
    {"type": "function", "function": {
        "name": "update_product",
        "description": "Update product details: selling price, cost price, or name.",
        "parameters": {"type": "object", "properties": {
            "productName": {"type": "string", "description": "Current product name"},
            "newName": {"type": "string", "description": "New name (optional)"},
            "newSellingPrice": {"type": "string", "description": "New selling price (optional)"},
            "newCostPrice": {"type": "string", "description": "New cost price (optional)"}
        }, "required": ["productName"]}
    }},
    {"type": "function", "function": {
        "name": "search_sale",
        "description": "Search for a specific sale by invoice number",
        "parameters": {"type": "object", "properties": {
            "invoiceNumber": {"type": "string", "description": "Invoice number to search"}
        }, "required": ["invoiceNumber"]}
    }},
    {"type": "function", "function": {
        "name": "create_multi_sale",
        "description": "Create a sale with MULTIPLE products in one transaction. Use this when user wants to sell 2+ different products at once.",
        "parameters": {"type": "object", "properties": {
            "items": {"type": "string", "description": "JSON array of items, each with productName and quantity. Example: [{\"productName\":\"Laptop\",\"quantity\":\"2\"},{\"productName\":\"Mouse\",\"quantity\":\"3\"}]"},
            "customerName": {"type": "string", "description": "Customer name (optional)"},
            "paymentMethod": {"type": "string", "enum": ["Cash","eBirr","Bank Transfer"]},
            "paidAmount": {"type": "string", "description": "Amount paid (optional, default = full total)"}
        }, "required": ["items"]}
    }},
    {"type": "function", "function": {
        "name": "update_customer",
        "description": "Update customer details: name or phone number.",
        "parameters": {"type": "object", "properties": {
            "customerName": {"type": "string", "description": "Current customer name to find"},
            "newName": {"type": "string", "description": "New name (optional)"},
            "newPhone": {"type": "string", "description": "New phone number (optional)"}
        }, "required": ["customerName"]}
    }},
    {"type": "function", "function": {
        "name": "create_vendor",
        "description": "Create a new vendor/supplier. Only when user explicitly requests it.",
        "parameters": {"type": "object", "properties": {
            "name": {"type": "string", "description": "Vendor/supplier name"},
            "type": {"type": "string", "description": "Type: General, Manufacturer, Distributor"},
            "phone": {"type": "string", "description": "Phone number (optional)"},
            "contactPerson": {"type": "string", "description": "Contact person name (optional)"}
        }, "required": ["name"]}
    }},
    {"type": "function", "function": {
        "name": "get_daily_report",
        "description": "Get comprehensive daily business report: sales, profit, stock alerts, top products, debts",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }},
]

FUNC_MAP = {
    "get_shop_summary": lambda p: ("summary", {}),
    "get_sales": lambda p: (f"sales_{p.get('period','today')}", {}),
    "search_customer": lambda p: ("customer_search", {"name": p.get("name","")}),
    "get_low_stock": lambda p: ("low_stock", {}),
    "get_inventory": lambda p: ("inventory_overview", {}),
    "get_employees": lambda p: ("employees_list", {}),
    "get_accounts": lambda p: ("accounts_overview", {}),
    "get_expenses": lambda p: ("expenses_overview", {}),
    "get_top_customers": lambda p: ("top_customers", {}),
    "search_product": lambda p: ("product_search", {"productName": p.get("name","")}),
    "create_customer": lambda p: ("create_customer", p),
    "create_product": lambda p: ("create_product", p),
    "create_employee": lambda p: ("create_employee", p),
    "adjust_stock": lambda p: ("adjust_stock", p),
    "create_sale": lambda p: ("create_sale", p),
    "refund_sale": lambda p: ("refund_sale", p),
    "delete_product": lambda p: ("delete_product", p),
    "get_vendors": lambda p: ("vendors_list", {}),
    "get_purchases": lambda p: ("purchases_list", {}),
    "settle_debt": lambda p: ("settle_debt", p),
    "update_product": lambda p: ("update_product", p),
    "search_sale": lambda p: ("search_sale", p),
    "create_multi_sale": lambda p: ("create_multi_sale", p),
    "update_customer": lambda p: ("update_customer", p),
    "create_vendor": lambda p: ("create_vendor", p),
    "get_daily_report": lambda p: ("daily_report", {}),
}


async def call_nextjs_api(query_type: str, params: dict, company_id: str = "", user_id: str = "") -> dict:
    """Call Next.js AI data API with internal auth"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as http:
            res = await http.post(
                f"{NEXTJS_URL}/api/shop/ai",
                json={"queryType": query_type, "params": params},
                headers={
                    "x-internal-key": INTERNAL_KEY,
                    "x-company-id": company_id,
                    "x-user-id": user_id,
                },
            )
            data = res.json()
            print(f"  [API] {query_type} -> {res.status_code} | {json.dumps(data, default=str)[:200]}")
            return data
    except Exception as e:
        print(f"  [API ERROR] {query_type} -> {type(e).__name__}: {e}")
        return {"error": str(e)}


async def chat_cerebras(message: str, history: list, system_prompt: str, company_id: str, user_id: str) -> str:
    """Chat using Cerebras (PRIMARY - 1M tokens/day)"""
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-20:]:
        messages.append({"role": "user" if h["role"] == "user" else "assistant", "content": h["text"]})
    messages.append({"role": "user", "content": message})

    response = cerebras_client.chat.completions.create(
        model=CEREBRAS_MODEL,
        messages=messages,
        tools=GROQ_TOOLS,
        tool_choice="auto",
        temperature=0.7,
        max_tokens=2048,
    )

    msg = response.choices[0].message

    if msg.tool_calls:
        messages.append(msg)
        for tc in msg.tool_calls:
            fn_name = tc.function.name
            fn_args = json.loads(tc.function.arguments) if tc.function.arguments else {}
            print(f"  [TOOL] {fn_name}({json.dumps(fn_args)})")

            mapper = FUNC_MAP.get(fn_name, lambda p: ("summary", {}))
            query_type, params = mapper(fn_args)
            api_result = await call_nextjs_api(query_type, params, company_id, user_id)

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(api_result, default=str)
            })

        response2 = cerebras_client.chat.completions.create(
            model=CEREBRAS_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=2048,
        )
        return response2.choices[0].message.content or ""
    
    return msg.content or ""


async def chat_groq(message: str, history: list, system_prompt: str, company_id: str, user_id: str) -> str:
    """Chat using Groq (Fallback #1) with tool_use_failed retry"""
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-20:]:
        messages.append({"role": "user" if h["role"] == "user" else "assistant", "content": h["text"]})
    messages.append({"role": "user", "content": message})

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            tools=GROQ_TOOLS,
            tool_choice="auto",
            temperature=0.7,
            max_tokens=2048,
        )

        msg = response.choices[0].message

        if msg.tool_calls:
            messages.append(msg)
            for tc in msg.tool_calls:
                fn_name = tc.function.name
                fn_args = json.loads(tc.function.arguments) if tc.function.arguments else {}
                print(f"  [TOOL] {fn_name}({json.dumps(fn_args)})")

                mapper = FUNC_MAP.get(fn_name, lambda p: ("summary", {}))
                query_type, params = mapper(fn_args)
                api_result = await call_nextjs_api(query_type, params, company_id, user_id)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(api_result, default=str)
                })

            response2 = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
            )
            return response2.choices[0].message.content or ""
        
        return msg.content or ""
    except Exception as e:
        if 'tool_use_failed' in str(e):
            print(f"  [Groq] tool_use_failed — retrying without tools...")
            # Retry without tools
            response = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
            )
            return response.choices[0].message.content or ""
        raise


async def chat_gemini(message: str, history: list, system_prompt: str, company_id: str, user_id: str) -> str:
    """Chat using Gemini (Fallback)"""
    from google.genai import types as gt
    
    gemini_tools = [gt.Tool(function_declarations=[
        gt.FunctionDeclaration(name=t["function"]["name"], description=t["function"]["description"],
            parameters=gt.Schema(type="OBJECT", properties={
                k: gt.Schema(type="STRING", description=v.get("description",""))
                for k,v in t["function"]["parameters"].get("properties",{}).items()
            }, required=t["function"]["parameters"].get("required",[])) if t["function"]["parameters"].get("properties") else None
        ) for t in GROQ_TOOLS
    ])]

    contents = []
    for h in history[-20:]:
        contents.append(gt.Content(role=h["role"], parts=[gt.Part.from_text(text=h["text"])]))
    contents.append(gt.Content(role="user", parts=[gt.Part.from_text(text=message)]))

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL, contents=contents,
        config=gt.GenerateContentConfig(system_instruction=system_prompt, temperature=0.7, max_output_tokens=4096, tools=gemini_tools)
    )

    candidate = response.candidates[0]
    if candidate.content.parts and any(p.function_call for p in candidate.content.parts):
        func_results = []
        for part in candidate.content.parts:
            if part.function_call:
                fc = part.function_call
                fn_args = dict(fc.args) if fc.args else {}
                mapper = FUNC_MAP.get(fc.name, lambda p: ("summary", {}))
                qt, pr = mapper(fn_args)
                api_result = await call_nextjs_api(qt, pr, company_id, user_id)
                func_results.append(gt.Part.from_function_response(name=fc.name, response=api_result))

        contents.append(candidate.content)
        contents.append(gt.Content(role="user", parts=func_results))
        final = gemini_client.models.generate_content(
            model=GEMINI_MODEL, contents=contents,
            config=gt.GenerateContentConfig(system_instruction=system_prompt, temperature=0.7, max_output_tokens=4096)
        )
        return final.text or ""
    return response.text or ""


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "primary": f"Cerebras ({CEREBRAS_MODEL})" if cerebras_client else "None",
        "fallback1": f"Groq ({GROQ_MODEL})" if groq_client else "None",
        "fallback2": "Gemini 2.5 Flash" if gemini_client else "None",
        "tools": len(FUNC_MAP),
        "cache_entries": len(_cache),
        "sessions": len(conversations),
    }


@app.post("/chat")
async def chat(request: Request):
    """Main chat — Cerebras primary, Groq fallback #1, Gemini fallback #2"""
    try:
        body = await request.json()
        message = body.get("message", "")
        session_id = body.get("sessionId", "default")
        company_name = body.get("companyName", "Revlo Shop")
        company_id = body.get("companyId", "")
        user_id = body.get("userId", "")

        if not message:
            return JSONResponse({"error": "Message required"}, status_code=400)

        if session_id not in conversations:
            conversations[session_id] = []

        history = conversations[session_id]
        system_prompt = build_system_prompt(company_name)
        final_text = ""
        provider_used = ""

        print(f"\n[CHAT] '{message[:60]}...' | company={company_id[:8]}... | user={user_id[:8]}...")

        # Cache check for read-only queries (skip for write commands)
        write_keywords = ["diwan geli", "samee", "cusub", "beddel", "tirtir", "refund", "bixin", "iib ", "u iib"]
        is_write = any(kw in message.lower() for kw in write_keywords)
        cache_key = f"{company_id}:{message.strip().lower()}"
        
        if not is_write:
            cached = get_cached(cache_key)
            if cached:
                print(f"[CACHE HIT] {cache_key[:50]}")
                final_text = cached
                provider_used = "cache"

        # Try providers only if no cache hit
        if not final_text and cerebras_client:
            try:
                final_text = await chat_cerebras(message, history, system_prompt, company_id, user_id)
                provider_used = "cerebras"
            except Exception as cb_err:
                print(f"[Cerebras FAIL] {cb_err}")
                # Fallback to Groq
                if groq_client:
                    try:
                        final_text = await chat_groq(message, history, system_prompt, company_id, user_id)
                        provider_used = "groq"
                    except Exception as groq_err:
                        print(f"[Groq FAIL] {groq_err}")
                        if gemini_client:
                            try:
                                final_text = await chat_gemini(message, history, system_prompt, company_id, user_id)
                                provider_used = "gemini"
                            except Exception as gem_err:
                                print(f"[Gemini FAIL] {gem_err}")
                                raise gem_err
                        else:
                            raise groq_err
                elif gemini_client:
                    try:
                        final_text = await chat_gemini(message, history, system_prompt, company_id, user_id)
                        provider_used = "gemini"
                    except Exception as gem_err:
                        print(f"[Gemini FAIL] {gem_err}")
                        raise gem_err
                else:
                    raise cb_err
        elif not final_text and groq_client:
            try:
                final_text = await chat_groq(message, history, system_prompt, company_id, user_id)
                provider_used = "groq"
            except Exception as groq_err:
                print(f"[Groq FAIL] {groq_err}")
                if gemini_client:
                    final_text = await chat_gemini(message, history, system_prompt, company_id, user_id)
                    provider_used = "gemini"
                else:
                    raise groq_err
        elif not final_text and gemini_client:
            final_text = await chat_gemini(message, history, system_prompt, company_id, user_id)
            provider_used = "gemini"
        elif not final_text:
            final_text = "API key maleh."

        print(f"[OK] Provider={provider_used} | Response={final_text[:80].encode('ascii', 'replace').decode()}...")

        # Strip thinking tags from output
        import re
        final_text = re.sub(r'<think>.*?</think>', '', final_text, flags=re.DOTALL).strip()

        # Cache read-only responses
        if not is_write and provider_used != "cache" and final_text:
            set_cache(cache_key, final_text)

        history.append({"role": "user", "text": message})
        history.append({"role": "model", "text": final_text})
        if len(history) > 40:
            conversations[session_id] = history[-30:]

        async def stream():
            words = final_text.split(' ')
            buffer = ""
            for i, word in enumerate(words):
                buffer += word + ' '
                if len(buffer) > 20 or i == len(words) - 1:
                    yield f"data: {json.dumps({'text': buffer, 'done': False})}\n\n"
                    buffer = ""
            yield f"data: {json.dumps({'text': '', 'done': True, 'fullText': final_text, 'provider': provider_used})}\n\n"

        return StreamingResponse(stream(), media_type="text/event-stream")

    except Exception as e:
        traceback.print_exc()
        raw = str(e)
        if 'RESOURCE_EXHAUSTED' in raw or '429' in raw or 'rate_limit' in raw.lower():
            error_msg = "Request limit gaadhy. Wax yar sug ama berri dib u isku day."
        elif 'timeout' in raw.lower():
            error_msg = "Server-ku wuu gaabsaday. Dib u isku day."
        elif 'invalid_api_key' in raw.lower() or 'authentication' in raw.lower():
            error_msg = "API key khalad. Fadlan hub."
        else:
            error_msg = "Khalad ayaa dhacay. Dib u isku day."
        async def error_stream():
            yield f"data: {json.dumps({'text': f'⚠️ {error_msg}', 'done': True})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")


@app.post("/chat/simple")
async def chat_simple(request: Request):
    """Non-streaming version — Cerebras primary, same fallback chain as /chat"""
    try:
        body = await request.json()
        message = body.get("message", "")
        session_id = body.get("sessionId", "default")
        company_name = body.get("companyName", "Revlo Shop")
        company_id = body.get("companyId", "")
        user_id = body.get("userId", "")

        if not message:
            return JSONResponse({"error": "Message required"}, status_code=400)

        if session_id not in conversations:
            conversations[session_id] = []

        history = conversations[session_id]
        system_prompt = build_system_prompt(company_name)
        final_text = ""
        provider_used = ""

        print(f"\n[SIMPLE] '{message[:60]}...' | company={company_id[:8] if company_id else '?'}...")

        # Cache check
        write_kw = ["diwan geli", "samee", "cusub", "beddel", "tirtir", "refund", "bixin", "iib ", "u iib"]
        is_w = any(kw in message.lower() for kw in write_kw)
        ck = f"simple:{company_id}:{message.strip().lower()}"
        if not is_w:
            cached = get_cached(ck)
            if cached:
                print(f"[CACHE HIT] simple")
                return JSONResponse({"text": cached, "success": True, "provider": "cache"})

        # Same tri-provider fallback as /chat
        if cerebras_client:
            try:
                final_text = await chat_cerebras(message, history, system_prompt, company_id, user_id)
                provider_used = "cerebras"
            except Exception as e:
                print(f"[Cerebras FAIL] {e}")
                if groq_client:
                    try:
                        final_text = await chat_groq(message, history, system_prompt, company_id, user_id)
                        provider_used = "groq"
                    except Exception as e2:
                        print(f"[Groq FAIL] {e2}")
                        if gemini_client:
                            final_text = await chat_gemini(message, history, system_prompt, company_id, user_id)
                            provider_used = "gemini"
                        else:
                            raise e2
                elif gemini_client:
                    final_text = await chat_gemini(message, history, system_prompt, company_id, user_id)
                    provider_used = "gemini"
                else:
                    raise e
        elif groq_client:
            try:
                final_text = await chat_groq(message, history, system_prompt, company_id, user_id)
                provider_used = "groq"
            except Exception as e:
                if gemini_client:
                    final_text = await chat_gemini(message, history, system_prompt, company_id, user_id)
                    provider_used = "gemini"
                else:
                    raise e
        elif gemini_client:
            final_text = await chat_gemini(message, history, system_prompt, company_id, user_id)
            provider_used = "gemini"
        else:
            final_text = "API key maleh."

        # Strip thinking tags
        import re
        final_text = re.sub(r'<think>.*?</think>', '', final_text, flags=re.DOTALL).strip()

        print(f"[SIMPLE OK] Provider={provider_used} | Response={final_text[:80].encode('ascii', 'replace').decode()}...")

        # Cache read-only
        if not is_w and final_text:
            set_cache(ck, final_text)

        history.append({"role": "user", "text": message})
        history.append({"role": "model", "text": final_text})
        if len(history) > 40:
            conversations[session_id] = history[-30:]

        return JSONResponse({"text": final_text, "success": True, "provider": provider_used})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"error": str(e), "text": "⚠️ Khalad ayaa dhacay. Dib u isku day."}, status_code=500)


@app.delete("/history/{session_id}")
async def clear_history(session_id: str):
    if session_id in conversations:
        del conversations[session_id]
    return JSONResponse({"success": True})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
