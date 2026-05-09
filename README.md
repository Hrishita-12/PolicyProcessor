## Environment setup

Create a `.env` file in the `PolicyProcessor` directory with the following variables:

```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your_openai_key_here
# Or for Gemini
# LLM_PROVIDER=gemini
# GEMINI_API_KEY=AIzaYour_Gemini_key_here

# Optional
PORT=5000
```

The server now loads `.env` automatically via `dotenv/config`.




