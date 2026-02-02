# utils/groq_wrapper.py
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in environment variables. Please check your .env file.")
    return Groq(api_key=api_key)

def ask_groq(model_id, messages, temperature=0.7):
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model=model_id,
            messages=messages,
            temperature=temperature
        )
        return response.choices[0].message.content
    except Exception as e:
        error_msg = f"Groq API error: {str(e)}"
        if "api_key" in str(e).lower() or "authentication" in str(e).lower():
            error_msg += "\nPlease check your GROQ_API_KEY in the .env file."
        elif "rate limit" in str(e).lower():
            error_msg += "\nRate limit exceeded. Please try again in a moment."
        raise Exception(error_msg) from e
