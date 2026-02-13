
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("No API key found")
    exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)
try:
    print("Listing models...")
    # The new SDK might have a different way to list models, let's try the standard one
    # or check the client.models to see what's available
    
    # In v2 SDK, it might be client.models.list()
    # But let's verify if we can make a simple generation request with a known stable model
    
    import sys
    
    with open('available_models_utf8.txt', 'w', encoding='utf-8') as f:
        print("Introspecting client.models...", file=f)
        try:
            # Check introspection
            methods = dir(client.models)
            print(f"Methods: {methods}", file=f)
            
            if hasattr(client.models, 'list'):
                print("\n--- Listing Models via client.models.list() ---", file=f)
                try:
                     models = client.models.list()
                     for m in models:
                         # depending on object structure, print name or full obj
                         if hasattr(m, 'name'):
                            print(f"Model Name: {m.name}", file=f)
                         else:
                            print(f"Model Object: {m}", file=f)
                except Exception as e:
                    print(f"Error listing: {e}", file=f)
            else:
                print("client.models has no 'list' method.", file=f)
                
        except Exception as e:
            print(f"General Error: {e}", file=f)
            
    print("Done writing to available_models_utf8.txt")

except Exception as e:
    print(f"General Error: {e}")
